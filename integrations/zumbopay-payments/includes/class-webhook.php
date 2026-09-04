<?php
if (!defined('ABSPATH')) { exit; }

/**
 * Webhook ZumboPay → WooCommerce.
 * URL: /wp-json/zumbopay/v1/webhook
 *
 * Assinatura (compatível com src/lib/webhook-hmac.server.ts do backend):
 *   X-Signature: hex(hmac_sha256(`${X-Timestamp}.${rawBody}`, WEBHOOK_SECRET))
 *   X-Timestamp: epoch ms
 *
 * Camadas de segurança:
 *   1) HMAC SHA-256                    (X-Signature)
 *   2) Freshness  (janela 5 min)       (X-Timestamp)
 *   3) Idempotência por event_id       (option wp_zumbopay_events)
 *   4) Re-verificação server-to-server (GET /api/v1/payments/{reference})
 *   5) Cross-check amount + currency
 */
class ZumboPay_Webhook {

    const PROCESSED_OPT = 'zumbopay_processed_events';
    const MAX_SKEW_MS   = 300000; // 5 min

    public function __construct() {
        add_action('rest_api_init', function () {
            register_rest_route('zumbopay/v1', '/webhook', [
                'methods'  => 'POST',
                'permission_callback' => '__return_true',
                'callback' => [$this, 'handle'],
            ]);
        });
    }

    public function handle(WP_REST_Request $req) {
        $raw = $req->get_body();
        $settings = get_option('zumbopay_settings', []);
        $secret = trim($settings['webhook_secret'] ?? '');
        if (!$secret) return new WP_REST_Response(['ok'=>false,'error'=>'webhook_secret_not_set'], 500);

        $sig = $req->get_header('x_signature') ?: $req->get_header('X-Signature');
        $ts  = $req->get_header('x_timestamp') ?: $req->get_header('X-Timestamp');
        if (!$sig || !$ts) return new WP_REST_Response(['ok'=>false,'error'=>'missing_signature'], 401);

        $sig = preg_replace('/^sha256=/i', '', trim($sig));
        $ts_num = (int) $ts;
        if (!$ts_num || abs((int)(microtime(true)*1000) - $ts_num) > self::MAX_SKEW_MS) {
            return new WP_REST_Response(['ok'=>false,'error'=>'stale_timestamp'], 401);
        }
        $expected = hash_hmac('sha256', $ts . '.' . $raw, $secret);
        if (!hash_equals($expected, $sig)) {
            return new WP_REST_Response(['ok'=>false,'error'=>'invalid_signature'], 401);
        }

        $payload = json_decode($raw, true);
        if (!is_array($payload)) return new WP_REST_Response(['ok'=>false,'error'=>'invalid_json'], 400);

        $event      = strtolower((string)($payload['event'] ?? $payload['type'] ?? ''));
        $data       = is_array($payload['data'] ?? null) ? $payload['data'] : $payload;
        $reference  = sanitize_text_field($data['reference']  ?? $data['payment_reference'] ?? '');
        $source_id  = sanitize_text_field($data['source_id']  ?? $data['metadata']['source_id'] ?? '');
        $event_id   = sanitize_text_field($payload['id']      ?? $payload['event_id'] ?? ($event . ':' . $reference));

        if (!$reference || !$source_id) return new WP_REST_Response(['ok'=>false,'error'=>'missing_fields'], 400);

        // Idempotência
        $processed = get_option(self::PROCESSED_OPT, []);
        if (!is_array($processed)) $processed = [];
        if (isset($processed[$event_id])) return new WP_REST_Response(['ok'=>true,'duplicate'=>true], 200);

        $order = wc_get_order((int) $source_id);
        if (!$order) return new WP_REST_Response(['ok'=>false,'error'=>'order_not_found'], 404);

        if ($order->is_paid()) {
            $processed[$event_id] = time();
            update_option(self::PROCESSED_OPT, array_slice($processed, -500, null, true));
            return new WP_REST_Response(['ok'=>true,'already_paid'=>true], 200);
        }

        // Re-verificação autoritativa
        $client = new ZumboPay_API_Client();
        $check  = $client->get_payment($reference);
        $auth   = $check['body']['data'] ?? $check['body']['payment'] ?? null;
        if (!is_array($auth)) {
            return new WP_REST_Response(['ok'=>false,'error'=>'verification_failed','detail'=>$check['body']], 502);
        }

        $auth_status = strtolower((string)($auth['status'] ?? ''));
        if (in_array($auth_status, ['failed','cancelled','expired'], true)) {
            $order->update_status('failed', 'ZumboPay: pagamento '.$auth_status.' (verificado).');
            $processed[$event_id] = time();
            update_option(self::PROCESSED_OPT, array_slice($processed, -500, null, true));
            return new WP_REST_Response(['ok'=>true,'status'=>$auth_status], 200);
        }
        if (!in_array($auth_status, ['success','completed','paid'], true)) {
            return new WP_REST_Response(['ok'=>true,'status'=>$auth_status,'pending'=>true], 200);
        }

        $done = ZumboPay_Payment_Verifier::mark_paid_after_verification($order, $auth, $reference);
        if (!$done['ok']) {
            // e-Mola sem PIN confirmado → deixar pending e não marcar o
            // event_id como processado; próximo webhook (ou o cron da API
            // do lado ZumboPay) volta a tentar quando o cliente introduzir o PIN.
            if (!empty($done['pending'])) {
                return new WP_REST_Response(['ok'=>true,'pending'=>true,'reason'=>$done['error']], 202);
            }
            return new WP_REST_Response(['ok'=>false,'error'=>$done['error']], 409);
        }

        $processed[$event_id] = time();
        update_option(self::PROCESSED_OPT, array_slice($processed, -500, null, true));
        return new WP_REST_Response(['ok'=>true,'order_id'=>$order->get_id()], 200);
    }
}
