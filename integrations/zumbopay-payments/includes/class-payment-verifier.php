<?php
if (!defined('ABSPATH')) { exit; }

/**
 * Helper partilhado: dado o payload autoritativo devolvido por
 * GET /api/public/v1/payments/{reference}, faz cross-check e marca a
 * encomenda WooCommerce como paga.
 *
 * REGRA CRÍTICA — e-Mola:
 *   e-Mola requer confirmação por PIN no telefone do cliente.
 *   NUNCA marcamos a encomenda como paga sem provas de PIN confirmado.
 *   A API devolve `pin_verified=true` OU `pin_confirmed_at` OU um
 *   `provider_status` explícito como `PIN_CONFIRMED` / `COMPLETED_WITH_PIN`
 *   assim que o cliente introduz o PIN. Se nenhuma dessas provas estiver
 *   presente, tratamos como "pending" e devolvemos o pedido para o
 *   webhook/cron voltar a verificar mais tarde.
 */
class ZumboPay_Payment_Verifier {

    /**
     * @param array $auth resposta `data` do GET /payments/{reference}.
     * @return array{ok:bool, error?:string, pending?:bool}
     */
    public static function mark_paid_after_verification(WC_Order $order, array $auth, string $reference) {
        $auth_status  = strtolower((string)($auth['status'] ?? ''));
        $auth_amount  = (float)($auth['amount']   ?? 0);
        $auth_curr    = strtoupper((string)($auth['currency'] ?? ''));
        $channel      = strtolower((string)($auth['channel'] ?? $auth['method'] ?? ''));

        if (!in_array($auth_status, ['success','completed','paid'], true)) {
            return ['ok'=>false, 'error'=>'not_paid:' . $auth_status];
        }

        // ==== e-Mola PIN guard ====
        if ($channel === 'emola') {
            $pin_ok = self::emola_pin_confirmed($auth);
            if (!$pin_ok) {
                // Não completar. Deixar a encomenda em on-hold, deverá ser
                // re-verificada pelo próximo webhook ou pelo cron.
                if ($order->get_status() !== 'on-hold') {
                    $order->update_status('on-hold', 'ZumboPay e-Mola: à espera de confirmação de PIN pelo cliente.');
                }
                return ['ok'=>false, 'error'=>'emola_pin_not_confirmed', 'pending'=>true];
            }
        }

        $expected_amount = (float) $order->get_meta('_zumbopay_charge_amount');
        $expected_curr   = strtoupper((string) $order->get_meta('_zumbopay_charge_currency'));
        if ($expected_amount <= 0) $expected_amount = (float) $order->get_total();
        if (!$expected_curr) $expected_curr = strtoupper($order->get_currency());

        if (abs($auth_amount - $expected_amount) > 0.01) {
            return ['ok'=>false, 'error'=>'amount_mismatch'];
        }
        if ($auth_curr && $expected_curr && $auth_curr !== $expected_curr) {
            return ['ok'=>false, 'error'=>'currency_mismatch'];
        }

        $order->payment_complete($reference);
        $order->add_order_note(sprintf(
            'ZumboPay: pagamento verificado (%s %s, ref %s, canal %s).',
            number_format($auth_amount, 2), $auth_curr, $reference, $channel ?: 'n/a'
        ));
        return ['ok'=>true];
    }

    /**
     * Verifica se o payload autoritativo prova que o cliente introduziu
     * o PIN na app e-Mola. Aceita várias formas em que a API pode marcar
     * essa confirmação para robustez futura.
     */
    private static function emola_pin_confirmed(array $auth): bool {
        if (!empty($auth['pin_verified']))     return true;
        if (!empty($auth['pin_confirmed']))    return true;
        if (!empty($auth['pin_confirmed_at'])) return true;
        $provider = strtoupper((string)($auth['provider_status'] ?? ''));
        if (in_array($provider, ['PIN_CONFIRMED','COMPLETED_WITH_PIN','AUTHORIZED_BY_PIN','SUCCESS'], true)) return true;
        // metadata catch-all
        $meta = $auth['metadata'] ?? [];
        if (is_array($meta)) {
            if (!empty($meta['pin_verified']))  return true;
            if (!empty($meta['emola_pin_ok'])) return true;
        }
        return false;
    }
}

