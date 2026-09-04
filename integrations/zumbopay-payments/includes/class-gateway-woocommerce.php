<?php
if (!defined('ABSPATH')) { exit; }

class ZumboPay_WC_Gateway extends WC_Payment_Gateway {

    public function __construct() {
        $this->id = 'zumbopay';
        $this->method_title = 'ZumboPay';
        $this->method_description = 'M-Pesa, e-Mola e Visa/Mastercard. Suporta recorrência em cartão com aceite de mandato.';
        $this->has_fields = true;
        $this->supports = ['products'];
        $this->icon = ZUMBOPAY_URL . 'assets/img/zumbopay.png';

        $this->init_form_fields();
        $this->init_settings();
        $this->title       = $this->get_option('title', 'ZumboPay');
        $this->description = $this->get_option('description', 'Pague com M-Pesa, e-Mola ou cartão Visa/Mastercard.');
        $this->enabled     = $this->get_option('enabled', 'yes');

        add_action('woocommerce_update_options_payment_gateways_'.$this->id, [$this, 'process_admin_options']);
        add_action('woocommerce_thankyou_'.$this->id, [$this, 'thankyou_page']);
    }

    /**
     * Página "obrigado" — quando o pagamento está pendente (M-Pesa/e-Mola
     * à espera do PIN) mostra aviso e faz auto-refresh até o webhook
     * marcar como pago (ou falhar).
     */
    public function thankyou_page($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        $method = $order->get_meta('_zumbopay_method');
        $status = $order->get_status();
        if (!in_array($status, ['on-hold','pending'], true)) return;
        if (!in_array($method, ['mpesa','emola'], true)) return;
        $msg = $method === 'emola'
            ? '🔒 Verifique o seu telemóvel e introduza o PIN e-Mola para confirmar o pagamento. Esta página actualiza-se automaticamente.'
            : '📲 Confirme o pagamento M-Pesa no seu telemóvel. Esta página actualiza-se automaticamente.';
        echo '<div style="margin:16px 0;padding:14px 18px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:14px;line-height:1.4">'
           . '<strong>ZumboPay — pagamento pendente.</strong><br/>'
           . esc_html($msg)
           . '</div>';
        // auto-refresh de 6 em 6s (máximo 40 vezes = 4 min)
        echo '<script>(function(){var n=0;var t=setInterval(function(){if(n++>=40){clearInterval(t);return;}location.reload();},6000);})();</script>';
    }

    public function init_form_fields() {
        $this->form_fields = [
            'enabled'     => ['title'=>'Ativar', 'type'=>'checkbox', 'label'=>'Ativar ZumboPay no checkout', 'default'=>'yes'],
            'title'       => ['title'=>'Título', 'type'=>'text', 'default'=>'ZumboPay'],
            'description' => ['title'=>'Descrição', 'type'=>'textarea', 'default'=>'M-Pesa, e-Mola ou cartão Visa/Mastercard.'],
        ];
    }

    public function admin_options() { ?>
        <h2><?php echo esc_html($this->get_method_title()); ?></h2>
        <p><?php echo esc_html($this->get_method_description()); ?></p>
        <table class="form-table">
            <?php $this->generate_settings_html($this->get_form_fields(), false); ?>
        </table>
        <?php ZumboPay_Settings::render_body('wc');
    }

    public function process_admin_options() {
        $ok = parent::process_admin_options();
        if (isset($_POST['zumbopay_settings']) && is_array($_POST['zumbopay_settings'])) {
            $sanitized = ZumboPay_Settings::sanitize_static(wp_unslash($_POST['zumbopay_settings']));
            update_option(ZumboPay_Settings::OPT, $sanitized);
        }
        return $ok;
    }

    public function payment_fields() {
        $t = ZumboPay_I18N::all();
        $s = get_option('zumbopay_settings', []);
        $enabled = $s['enabled_methods'] ?? [];
        $methods = zumbopay_methods_registry();
        $order_currency = strtoupper(get_woocommerce_currency());
        $recurring_on   = ($s['recurring_enabled'] ?? 'yes') === 'yes';
        $terms_url      = $s['terms_url'] ?? '';
        $intervals      = zumbopay_recurring_intervals();

        echo '<style>
            .zp-brand{display:flex;align-items:center;gap:10px;margin:6px 0 10px}
            .zp-brand img{height:22px}
            .zp-brand small{color:#64748b;font-size:11px}
            .zp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}
            .zp-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;background:#fff;min-height:74px;text-align:center;transition:all .15s ease}
            .zp-card img{height:28px;object-fit:contain;max-width:80%}
            .zp-card span{font-size:11px;font-weight:600;line-height:1.1;color:#334155}
            .zp-card input[type=radio]{position:absolute;opacity:0;pointer-events:none}
            .zp-card:has(input:checked){border:2px solid #f97316;background:#fff7ed;box-shadow:0 2px 8px rgba(249,115,22,.18)}
            .zp-input{width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px}
            .zp-rec{margin-top:10px;padding:10px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc}
            .zp-rec[hidden]{display:none}
            .zp-row{display:flex;gap:8px;align-items:center;margin-top:6px}
            .zp-mandate{font-size:12px;color:#334155;line-height:1.35}
            .zp-emola-note{margin-top:8px;padding:8px 10px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;font-size:12px;line-height:1.35}
            .zp-emola-note[hidden]{display:none}
        </style>';

        echo '<div class="zp-brand"><img src="' . esc_url(ZUMBOPAY_URL . 'assets/img/zumbopay.png') . '" alt="ZumboPay" /><small>' . esc_html__('Pagamento seguro via ZumboPay', 'zumbopay-payments') . '</small></div>';

        echo '<div class="zp-grid">';
        foreach ($methods as $k => $m) {
            if (!in_array($k, $enabled, true)) continue;
            if (!in_array($order_currency, $m['currencies'], true)) continue;
            printf(
                '<label class="zp-card"><input type="radio" name="zumbopay_method" value="%s" data-recurring="%d" data-channel="%s" required /><img src="%s" alt="%s" /><span>%s</span></label>',
                esc_attr($k),
                $m['recurring'] ? 1 : 0,
                esc_attr($k),
                esc_url(ZUMBOPAY_URL . 'assets/img/' . $m['logo']),
                esc_attr($m['label']),
                esc_html($m['label'])
            );
        }
        echo '</div>';

        echo '<input type="tel" name="zumbopay_phone" maxlength="9" inputmode="numeric" pattern="[0-9]{9}" placeholder="'.esc_attr($t['phone']).'" class="zp-input" oninput="this.value=this.value.replace(/\D/g,\'\').slice(0,9)" />';

        // Aviso e-Mola: pedido só é confirmado depois do PIN.
        echo '<div class="zp-emola-note" id="zp-emola-note" hidden>🔒 '.esc_html__('Para e-Mola: a sua encomenda só é confirmada depois de introduzir o PIN no seu telemóvel. Não feche esta página enquanto não receber o pedido USSD/app e confirmar com o PIN.', 'zumbopay-payments').'</div>';
        echo "<script>(function(){
            var root=document.currentScript.parentElement;
            function refresh(){
                var sel=root.querySelector('input[name=zumbopay_method]:checked');
                var note=root.querySelector('#zp-emola-note');
                if(!note) return;
                note.hidden = !(sel && sel.getAttribute('data-channel')==='emola');
            }
            root.querySelectorAll('input[name=zumbopay_method]').forEach(function(r){ r.addEventListener('change', refresh); });
            setTimeout(refresh, 30);
        })();</script>";

        if ($recurring_on) {
            echo '<div class="zp-rec" id="zp-rec-box" hidden>';
            echo '<label class="zp-row"><input type="checkbox" id="zp-rec-enable" name="zumbopay_recurring" value="1" /> <strong>'.esc_html($t['recurring']).'</strong></label>';
            echo '<div class="zp-row"><label style="min-width:120px">'.esc_html($t['period']).'</label>';
            echo '<select name="zumbopay_interval" class="zp-input">';
            foreach ($intervals as $val=>$lbl) {
                printf('<option value="%s">%s</option>', esc_attr($val), esc_html($lbl));
            }
            echo '</select></div>';
            $terms_line = $terms_url
                ? sprintf('%s <a href="%s" target="_blank" rel="noopener">%s</a>.', esc_html($t['accept_mandate']), esc_url($terms_url), 'Termos')
                : esc_html($t['accept_mandate']).'.';
            echo '<label class="zp-row zp-mandate"><input type="checkbox" name="zumbopay_mandate" value="1" /> <span>'.$terms_line.'</span></label>';
            echo '</div>';
            // JS: só mostra bloco recorrência se o método selecionado suportar (card)
            echo "<script>(function(){
                var root=document.currentScript.parentElement;
                function refresh(){
                    var sel=root.querySelector('input[name=zumbopay_method]:checked');
                    var box=root.querySelector('#zp-rec-box');
                    if(!box) return;
                    if(sel && sel.getAttribute('data-recurring')==='1'){ box.hidden=false; }
                    else { box.hidden=true; var en=root.querySelector('#zp-rec-enable'); if(en) en.checked=false; }
                }
                root.querySelectorAll('input[name=zumbopay_method]').forEach(function(r){ r.addEventListener('change', refresh); });
                setTimeout(refresh, 30);
            })();</script>";
        }
    }

    public function process_payment($order_id) {
        try {
            $order = wc_get_order($order_id);
            if (!$order) throw new Exception('Encomenda inválida.');

            $posted = $this->collect_posted();
            $method = sanitize_text_field($posted['zumbopay_method'] ?? '');
            $phone  = preg_replace('/\D+/', '', sanitize_text_field($posted['zumbopay_phone'] ?? ''));
            $registry = zumbopay_methods_registry();
            if (!$method || !isset($registry[$method])) throw new Exception('Escolha um método de pagamento.');

            $currency = strtoupper($order->get_currency());
            if (!in_array($currency, $registry[$method]['currencies'], true)) {
                throw new Exception(sprintf('%s aceita apenas %s.', $registry[$method]['label'], implode('/', $registry[$method]['currencies'])));
            }
            if (!$phone) $phone = preg_replace('/\D+/', '', (string) $order->get_billing_phone());
            $phone = substr($phone, 0, 9);
            if (!empty($registry[$method]['needs_phone']) && !preg_match('/^\d{9}$/', $phone)) {
                throw new Exception('Introduza um número de telefone válido (9 dígitos).');
            }

            $amount = (float) $order->get_total();
            $s = get_option('zumbopay_settings', []);
            $recurring_wanted = !empty($posted['zumbopay_recurring']) && $registry[$method]['recurring']
                && ($s['recurring_enabled'] ?? 'yes') === 'yes';
            $interval = sanitize_text_field($posted['zumbopay_interval'] ?? 'monthly');
            $mandate  = !empty($posted['zumbopay_mandate']);
            $allowed_intervals = array_keys(zumbopay_recurring_intervals());
            if ($recurring_wanted) {
                if (!$mandate) throw new Exception('Deve aceitar o mandato de cobrança recorrente.');
                if (!in_array($interval, $allowed_intervals, true)) $interval = 'monthly';
            }

            $wallet_id = ZumboPay_Settings::wallet_id_for_method($method);
            if (!$wallet_id) {
                throw new Exception(sprintf(
                    'ZumboPay: nenhuma carteira %s configurada. Vá a WooCommerce → Pagamentos → ZumboPay e clique em "Sincronizar carteiras".',
                    $registry[$method]['label']
                ));
            }

            $return_url = $this->get_return_url($order);

            // ============================================================
            // M-Pesa & e-Mola → STK push DIRECTO (fica tudo no WooCommerce).
            // Sem checkout hospedado, sem redirect externo.
            // ============================================================
            if ($method === 'mpesa' || $method === 'emola') {
                $client = new ZumboPay_API_Client();
                $res  = $client->create_charge([
                    'wallet_id'     => $wallet_id,
                    'amount'        => $amount,
                    'msisdn'        => $phone,
                    'customer_name' => trim($order->get_billing_first_name().' '.$order->get_billing_last_name()) ?: 'Cliente',
                    'source_id'     => 'wc-'.$order_id.'-'.substr(md5($order_id.'|'.microtime(true)), 0, 8),
                ]);
                $status_http = (int)($res['status'] ?? 0);
                $body = is_array($res['body'] ?? null) ? $res['body'] : [];
                $data = is_array($body['data'] ?? null) ? $body['data'] : [];
                $ref  = $data['reference'] ?? null;
                $pstatus = strtolower((string)($data['status'] ?? ''));

                if (!$ref) {
                    $err = is_string($body['error'] ?? null) ? $body['error']
                         : (is_string($body['error']['message'] ?? null) ? $body['error']['message']
                         : ('HTTP '.$status_http));
                    throw new Exception('ZumboPay: '.$err);
                }

                $order->update_meta_data('_zumbopay_reference', $ref);
                $order->update_meta_data('_zumbopay_method', $method);
                $order->update_meta_data('_zumbopay_charge_amount', $amount);
                $order->update_meta_data('_zumbopay_charge_currency', $currency);
                $order->save();

                if ($pstatus === 'success') {
                    $order->payment_complete($ref);
                    $order->add_order_note(sprintf('ZumboPay %s: pago (%s).', strtoupper($method), $ref));
                } elseif ($pstatus === 'failed') {
                    $desc = (string)($data['description'] ?? $data['code'] ?? 'pagamento falhou');
                    $order->update_status('failed', 'ZumboPay: '.$desc);
                    throw new Exception('Pagamento recusado: '.$desc);
                } else {
                    // pending — cliente ainda vai confirmar com PIN
                    $order->update_status('on-hold', $method === 'emola'
                        ? 'ZumboPay e-Mola: à espera do PIN do cliente.'
                        : 'ZumboPay M-Pesa: à espera da confirmação no telemóvel.');
                }

                if (function_exists('WC') && WC()->cart) WC()->cart->empty_cart();
                return ['result'=>'success', 'redirect'=>$return_url];
            }

            // ============================================================
            // Cartão (Visa/Mastercard, MPGS 3DS) → checkout hospedado.
            // O 3DS/OTP obriga a página hospedada do MPGS; ao voltar,
            // o cliente aterra na thank-you page do WooCommerce.
            // ============================================================
            $payload = [
                'type'        => $recurring_wanted ? 'recurring' : 'link',
                'title'       => sprintf('Pedido #%d', $order_id),
                'amount'      => $amount,
                'currency'    => $currency,
                'channels'    => [$method],
                'wallet_id'   => $wallet_id,
                'description' => sprintf('WooCommerce %s — pedido %d', get_bloginfo('name'), $order_id),
                'source'      => 'woocommerce',
                'source_id'   => (string) $order_id,
                'return_url'  => $return_url,
                'callback_url'=> $return_url,
            ];

            if ($recurring_wanted) {
                $payload['recurring'] = [
                    'interval'          => $interval,
                    'channel'           => 'card',
                    'consent_accepted'  => true,
                    'customer_name'     => trim($order->get_billing_first_name().' '.$order->get_billing_last_name()) ?: 'Cliente',
                    'customer_email'    => $order->get_billing_email(),
                    'customer_msisdn'   => $phone ?: preg_replace('/\D+/', '', (string)$order->get_billing_phone()),
                ];
            }

            $client = new ZumboPay_API_Client();
            $res  = $client->create_payment($payload);
            $body = is_array($res['body'] ?? null) ? $res['body'] : [];

            $checkout_url = $body['checkout_url'] ?? ($body['data']['checkout_url'] ?? null);
            $reference    = $body['data']['reference'] ?? ($body['reference'] ?? null);
            $sub_id       = $body['data']['subscription_id'] ?? null;

            if (empty($checkout_url) || empty($reference)) {
                $err = is_string($body['error'] ?? null) ? $body['error'] : ('HTTP '.($res['status'] ?? '???'));
                throw new Exception('ZumboPay: '.$err);
            }

            $order->update_meta_data('_zumbopay_reference', $reference);
            $order->update_meta_data('_zumbopay_method', $method);
            $order->update_meta_data('_zumbopay_charge_amount', $amount);
            $order->update_meta_data('_zumbopay_charge_currency', $currency);
            if ($sub_id) $order->update_meta_data('_zumbopay_subscription_id', $sub_id);
            if ($recurring_wanted) {
                $order->update_meta_data('_zumbopay_recurring_interval', $interval);
                $order->add_order_note(sprintf('ZumboPay: mandato recorrente aceite (%s).', $interval));
            }
            $order->save();

            if (function_exists('WC') && WC()->cart) WC()->cart->empty_cart();
            return ['result'=>'success', 'redirect'=>$checkout_url];

        } catch (\Throwable $e) {
            if (function_exists('wc_add_notice')) wc_add_notice($e->getMessage(), 'error');
            return ['result'=>'failure', 'messages'=>$e->getMessage()];
        }
    }

    private function collect_posted() {
        $keys = ['zumbopay_method','zumbopay_phone','zumbopay_recurring','zumbopay_interval','zumbopay_mandate'];
        $data = [];
        foreach ($keys as $k) if (isset($_POST[$k])) $data[$k] = wp_unslash($_POST[$k]);

        // Checkout Blocks / Store API
        $payment_data = $_POST['payment_data'] ?? null;
        if (is_string($payment_data)) {
            $decoded = json_decode(wp_unslash($payment_data), true);
            if (is_array($decoded)) $payment_data = $decoded;
        }
        if (is_array($payment_data)) {
            foreach ($payment_data as $key => $row) {
                if (is_array($row) && isset($row['key']) && in_array($row['key'], $keys, true)) {
                    $data[$row['key']] = wp_unslash($row['value'] ?? '');
                } elseif (is_string($key) && in_array($key, $keys, true)) {
                    $data[$key] = wp_unslash($row);
                }
            }
        }
        return $data;
    }
}
