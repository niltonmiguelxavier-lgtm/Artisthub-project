<?php
if (!defined('ABSPATH')) { exit; }

/**
 * Shortcode [zumbopay_button amount="1000" currency="MZN" method="mpesa" title="Doação"]
 *  → cria payment_request on-the-fly e devolve link para /pay/{reference}.
 * Uso simples fora do WooCommerce. Executa em cliques (via link REST).
 */
class ZumboPay_Shortcode {
    public function __construct() {
        add_shortcode('zumbopay_button', [$this, 'render']);
        add_action('rest_api_init', function () {
            register_rest_route('zumbopay/v1', '/quick-link', [
                'methods'  => 'POST',
                'permission_callback' => '__return_true',
                'callback' => [$this, 'quick_link'],
            ]);
        });
    }

    public function render($atts) {
        $a = shortcode_atts([
            'amount'=>'100', 'currency'=>'MZN', 'method'=>'mpesa',
            'title'=>'Pagamento', 'label'=>'Pagar com ZumboPay',
        ], $atts);
        return sprintf(
            '<a class="zp-quick-btn" style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:700" href="%s" target="_blank" rel="noopener">%s</a>',
            esc_url(rest_url('zumbopay/v1/quick-link?'.http_build_query($a))),
            esc_html($a['label'])
        );
    }

    public function quick_link(WP_REST_Request $req) {
        $client = new ZumboPay_API_Client();
        $res = $client->create_payment([
            'type'     => 'link',
            'title'    => sanitize_text_field($req['title'] ?? 'Pagamento'),
            'amount'   => (float) ($req['amount'] ?? 0),
            'currency' => strtoupper(sanitize_text_field($req['currency'] ?? 'MZN')),
            'channels' => [sanitize_text_field($req['method'] ?? 'mpesa')],
            'wallet_id'=> trim(get_option('zumbopay_settings', [])['wallet_code'] ?? ''),
        ]);
        $url = $res['body']['checkout_url'] ?? ($res['body']['data']['checkout_url'] ?? null);
        if (!$url) return new WP_REST_Response(['error'=>$res['body']['error'] ?? 'failed'], 502);
        return new WP_REST_Response(null, 302, ['Location'=>$url]);
    }
}
