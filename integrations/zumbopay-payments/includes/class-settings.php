<?php
if (!defined('ABSPATH')) { exit; }

class ZumboPay_Settings {
    const OPT   = 'zumbopay_settings';
    const CACHE = 'zumbopay_wallets_cache';

    public function __construct() {
        add_action('admin_menu', [$this, 'menu']);
        add_action('admin_init', [$this, 'register']);
        add_action('wp_ajax_zumbopay_sync_wallets',   [$this, 'ajax_sync_wallets']);
        add_action('wp_ajax_zumbopay_test_connection',[$this, 'ajax_test_connection']);
    }

    public static function is_wc_active() { return class_exists('WooCommerce'); }

    public function menu() {
        if (self::is_wc_active()) return; // gerido em WC → Pagamentos → ZumboPay
        add_menu_page('ZumboPay','ZumboPay','manage_options','zumbopay',
            [$this,'render'],'dashicons-money-alt', 56);
    }

    public function register() {
        register_setting('zumbopay_group', self::OPT, [$this, 'sanitize']);
    }

    public function sanitize($input) {
        $existing = get_option(self::OPT, []);
        $secret   = sanitize_text_field($input['webhook_secret'] ?? ($existing['webhook_secret'] ?? ''));
        if (!empty($input['regen_webhook_secret'])) {
            $secret = 'whsec_' . bin2hex(random_bytes(24));
        }
        $locale = in_array($input['locale'] ?? 'auto', array_keys(ZumboPay_I18N::languages()), true) ? $input['locale'] : 'auto';
        return array_merge($existing, [
            'api_key'          => ZumboPay_API_Client::normalize_key(sanitize_text_field($input['api_key'] ?? '')),
            'wallet_mpesa'     => sanitize_text_field($input['wallet_mpesa'] ?? ''),
            'wallet_emola'     => sanitize_text_field($input['wallet_emola'] ?? ''),
            'wallet_card'      => sanitize_text_field($input['wallet_card'] ?? ''),
            'webhook_secret'   => $secret,
            'locale'           => $locale,
            'terms_url'        => esc_url_raw($input['terms_url'] ?? ''),
            'recurring_enabled'=> !empty($input['recurring_enabled']) ? 'yes' : 'no',
            'enabled_methods'  => array_values(array_intersect(
                array_keys(zumbopay_methods_registry()),
                (array)($input['enabled_methods'] ?? [])
            )),
        ]);
    }

    public static function sanitize_static($input) { return (new self())->sanitize($input); }

    /** Devolve o wallet_id (UUID) a usar para um dado método, com fallback. */
    public static function wallet_id_for_method(string $method): string {
        $s = get_option(self::OPT, []);
        $per = trim($s['wallet_' . $method] ?? '');
        if ($per) return $per;
        // Fallback: primeira wallet em cache com esse method
        $cache = get_option(self::CACHE, []);
        foreach (($cache['wallets'] ?? []) as $w) {
            if (($w['method'] ?? '') === $method) return (string)($w['id'] ?? '');
        }
        // Legacy: wallet_code guardado em versões antigas
        return trim($s['wallet_code'] ?? '');
    }

    /** Constrói a payload de erro devolvida ao admin (mensagem + diagnóstico). */
    private static function error_payload(array $res, string $step) {
        $d = ZumboPay_API_Client::describe_error($res);
        return [
            'error'  => $d['title'],
            'hint'   => $d['hint'],
            'code'   => $d['code'],
            'status' => (int) ($res['status'] ?? 0),
            'step'   => $step,
        ];
    }

    /** AJAX: valida API key + sincroniza carteiras. */
    public function ajax_sync_wallets() {
        check_ajax_referer('zumbopay_admin', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error(['error'=>'Sem permissões.'], 403);

        // Aceita uma api_key temporária (antes de guardar) via POST
        $override = isset($_POST['api_key'])
            ? ZumboPay_API_Client::normalize_key(sanitize_text_field(wp_unslash($_POST['api_key'])))
            : '';

        $s = get_option(self::OPT, []);
        $previous = $s['api_key'] ?? '';
        if ($override) {
            $s['api_key'] = $override;
            update_option(self::OPT, $s);
        }

        $effective = $override ?: ZumboPay_API_Client::normalize_key($previous);
        if (!$effective) {
            wp_send_json_error([
                'error' => 'Cole a API Key antes de sincronizar.',
                'hint'  => 'Encontra-a em zumbopay.com → Programadores → API Keys.',
                'code'  => 'missing_key',
            ], 400);
        }
        if (!ZumboPay_API_Client::key_format_ok($effective)) {
            // Não gastamos um pedido HTTP com uma chave obviamente truncada.
            if ($override && $previous) { $s['api_key'] = $previous; update_option(self::OPT, $s); }
            wp_send_json_error([
                'error' => 'Formato da API Key incorrecto',
                'hint'  => 'A chave deve começar por zk_live_ ou zk_test_ seguida de 48 caracteres hexadecimais. Copiou a chave completa? Ela só é mostrada uma vez na criação.',
                'code'  => 'malformed_key',
            ], 400);
        }

        $client = new ZumboPay_API_Client();
        $val = $client->validate_merchant();
        if (((int)($val['status'] ?? 0)) !== 200) {
            // Não deixamos uma chave rejeitada substituir a que já funcionava.
            if ($override && $previous && (int)($val['status'] ?? 0) === 401) {
                $s['api_key'] = $previous;
                update_option(self::OPT, $s);
            }
            wp_send_json_error(self::error_payload($val, 'validate'), 200);
        }

        $res = $client->list_wallets();
        if (((int)($res['status'] ?? 0)) !== 200) {
            wp_send_json_error(self::error_payload($res, 'wallets'), 200);
        }
        $wallets = $res['body']['data'] ?? [];

        // Auto-selecção: se só existe 1 carteira por método, guardar já
        $s = get_option(self::OPT, []);
        foreach (['mpesa','emola','card'] as $m) {
            $forMethod = array_values(array_filter($wallets, fn($w) => ($w['method'] ?? '') === $m && !empty($w['is_active'])));
            if (count($forMethod) === 1 && empty($s['wallet_' . $m])) {
                $s['wallet_' . $m] = (string)$forMethod[0]['id'];
            }
        }
        update_option(self::OPT, $s);

        update_option(self::CACHE, [
            'merchant'  => $val['body']['data'] ?? null,
            'wallets'   => $wallets,
            'synced_at' => time(),
        ]);

        wp_send_json_success([
            'merchant'  => $val['body']['data'] ?? null,
            'wallets'   => $wallets,
            'settings'  => [
                'wallet_mpesa' => $s['wallet_mpesa'] ?? '',
                'wallet_emola' => $s['wallet_emola'] ?? '',
                'wallet_card'  => $s['wallet_card'] ?? '',
            ],
        ]);
    }

    /** AJAX: testar ligação (só validate, sem sync). */
    public function ajax_test_connection() {
        check_ajax_referer('zumbopay_admin', 'nonce');
        if (!current_user_can('manage_options')) wp_send_json_error(['error'=>'Sem permissões.'], 403);
        $client = new ZumboPay_API_Client();
        $val = $client->validate_merchant();
        if (((int)($val['status'] ?? 0)) !== 200) {
            wp_send_json_error(self::error_payload($val, 'validate'), 200);
        }
        wp_send_json_success($val['body']['data'] ?? []);
    }



    public function render() {
        $t = ZumboPay_I18N::all(); ?>
        <div class="wrap">
            <h1><?php echo esc_html($t['plugin_title']); ?></h1>
            <p><?php echo esc_html($t['subtitle']); ?></p>
            <form method="post" action="options.php">
                <?php settings_fields('zumbopay_group'); ?>
                <?php self::render_body('sidebar'); ?>
                <?php submit_button($t['save']); ?>
            </form>
        </div>
        <?php
    }

    /** Corpo do formulário — reutilizado pela página do gateway WC. */
    public static function render_body($context = 'sidebar') {
        $s = get_option(self::OPT, []);
        $cache = get_option(self::CACHE, []);
        $wallets = (array)($cache['wallets'] ?? []);
        $merchant = $cache['merchant'] ?? null;
        $synced_at = (int)($cache['synced_at'] ?? 0);

        $t = ZumboPay_I18N::all();
        $enabled = $s['enabled_methods'] ?? [];
        $methods = zumbopay_methods_registry();
        $webhook_url = home_url('/wp-json/zumbopay/v1/webhook');
        $opt = self::OPT;
        $nonce = wp_create_nonce('zumbopay_admin');

        // Group wallets by method
        $byMethod = ['mpesa'=>[], 'emola'=>[], 'card'=>[]];
        foreach ($wallets as $w) {
            $m = $w['method'] ?? '';
            if (isset($byMethod[$m]) && !empty($w['is_active'])) $byMethod[$m][] = $w;
        }

        // Card visual state
        $has_key = !empty($s['api_key']);
        $has_sync = $synced_at > 0;
        $state_class = !$has_key ? 'zp-state-empty' : (!$has_sync ? 'zp-state-warn' : 'zp-state-ok');
        $state_label = !$has_key ? $t['state_empty'] : (!$has_sync ? $t['state_warn'] : $t['state_ok']);
        ?>
        <style>
            .zp-admin{max-width:980px}
            .zp-hero{display:flex;gap:16px;align-items:center;padding:16px;border-radius:12px;border:1px solid #e5e7eb;background:#fff;margin:12px 0 20px}
            .zp-hero .zp-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600}
            .zp-state-empty .zp-badge{background:#fee2e2;color:#991b1b}
            .zp-state-warn  .zp-badge{background:#fef3c7;color:#92400e}
            .zp-state-ok    .zp-badge{background:#dcfce7;color:#166534}
            .zp-hero h3{margin:0 0 4px}
            .zp-hero small{color:#64748b}
            .zp-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
            .zp-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid #e5e7eb;background:#f8fafc;color:#64748b}
            .zp-chip.on{background:#dcfce7;border-color:#86efac;color:#166534}
            .zp-actions{display:flex;gap:8px;margin-left:auto}
            .zp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid #2563eb;background:#2563eb;color:#fff;cursor:pointer;font-weight:600}
            .zp-btn.secondary{background:#fff;color:#2563eb}
            .zp-btn[disabled]{opacity:.6;cursor:wait}
            .zp-spin{display:inline-block;width:14px;height:14px;border:2px solid #fff;border-right-color:transparent;border-radius:50%;animation:zpspin .8s linear infinite}
            @keyframes zpspin{to{transform:rotate(360deg)}}
            .zp-wallet-card{padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;margin-bottom:10px}
            .zp-wallet-card header{display:flex;align-items:center;gap:8px;margin-bottom:8px}
            .zp-wallet-card select{width:100%;max-width:520px}
            .zp-wallet-card .zp-empty{color:#b45309;font-size:12px;margin-top:4px}
            .zp-wallet-card a.zp-create{font-size:12px}
            .zp-notice{padding:10px;border-radius:8px;font-size:13px;margin:8px 0}
            .zp-notice.ok{background:#dcfce7;color:#166534}
            .zp-notice.err{background:#fee2e2;color:#991b1b}
            .zp-diag{margin-top:16px;padding:10px;border-radius:8px;background:#f8fafc;border:1px solid #e5e7eb;font-size:12px;color:#475569}
        </style>

        <div class="zp-admin">

        <!-- HERO STATE CARD -->
        <div class="zp-hero <?php echo esc_attr($state_class); ?>">
            <img src="<?php echo esc_url(ZUMBOPAY_URL . 'assets/img/zumbopay.png'); ?>" alt="ZumboPay" style="height:34px;flex-shrink:0" />
            <div style="flex:1;min-width:0">
                <h3><?php echo esc_html($t['plugin_title']); ?> <span class="zp-badge">● <?php echo esc_html($state_label); ?></span></h3>
                <?php if ($merchant): ?>
                    <small><strong><?php echo esc_html($merchant['name'] ?? $merchant['legal_name'] ?? 'Merchant'); ?></strong>
                        <?php if (!empty($merchant['merchant_id'])): ?> · ID <code><?php echo esc_html($merchant['merchant_id']); ?></code><?php endif; ?>
                        <?php if ($synced_at): ?> · <?php echo esc_html(sprintf($t['synced_ago'], human_time_diff($synced_at, time()))); ?><?php endif; ?>
                    </small>
                <?php else: ?>
                    <small><?php echo esc_html($t['hero_hint']); ?></small>
                <?php endif; ?>
                <div class="zp-chips">
                    <?php foreach (['mpesa','emola','card'] as $m):
                        $on = !empty($s['wallet_' . $m]);
                        $label = $methods[$m]['label'] ?? $m;
                    ?>
                        <span class="zp-chip <?php echo $on ? 'on' : ''; ?>"><?php echo $on ? '✓' : '○'; ?> <?php echo esc_html($label); ?></span>
                    <?php endforeach; ?>
                </div>
            </div>
            <div class="zp-actions">
                <button type="button" class="zp-btn" id="zp-sync-btn" data-nonce="<?php echo esc_attr($nonce); ?>">
                    <span class="zp-label"><?php echo esc_html($t['sync_wallets']); ?></span>
                </button>
            </div>
        </div>
        <div id="zp-sync-notice"></div>

        <h2><?php echo esc_html($t['credentials']); ?></h2>
        <table class="form-table">
            <tr><th><?php echo esc_html($t['api_key']); ?></th>
                <td><input type="password" class="regular-text" id="zp-apikey" name="<?php echo $opt; ?>[api_key]" value="<?php echo esc_attr($s['api_key'] ?? ''); ?>" placeholder="zk_live_..." autocomplete="off" />
                <p class="description"><?php echo esc_html($t['api_key_help']); ?></p></td></tr>
            <tr><th><?php echo esc_html($t['language']); ?></th>
                <td><select name="<?php echo $opt; ?>[locale]">
                    <?php foreach (ZumboPay_I18N::languages() as $k=>$lbl): ?>
                        <option value="<?php echo esc_attr($k); ?>" <?php selected($s['locale'] ?? 'auto', $k); ?>><?php echo esc_html($lbl); ?></option>
                    <?php endforeach; ?>
                </select></td></tr>
        </table>

        <h2><?php echo esc_html($t['wallets_title']); ?></h2>
        <p class="description"><?php echo esc_html($t['wallets_help']); ?></p>

        <?php foreach (['mpesa','emola','card'] as $m):
            $label = $methods[$m]['label'] ?? $m;
            $current = $s['wallet_' . $m] ?? '';
            $options = $byMethod[$m] ?? [];
        ?>
            <div class="zp-wallet-card">
                <header>
                    <img src="<?php echo esc_url(ZUMBOPAY_URL . 'assets/img/' . ($methods[$m]['logo'] ?? 'mpesa.png')); ?>" alt="" style="height:22px" onerror="this.style.display='none'" />
                    <strong><?php echo esc_html($label); ?></strong>
                </header>
                <?php if (empty($options)): ?>
                    <select name="<?php echo $opt; ?>[wallet_<?php echo $m; ?>]" disabled>
                        <option value=""><?php echo esc_html($t['no_wallets']); ?></option>
                    </select>
                    <div class="zp-empty">
                        <?php echo esc_html($t['no_wallets_hint']); ?>
                        <a href="<?php echo esc_url(ZUMBOPAY_APP_URL . '/app/wallets'); ?>" target="_blank" rel="noopener" class="zp-create"><?php echo esc_html($t['create_wallet']); ?> →</a>
                    </div>
                <?php else: ?>
                    <select name="<?php echo $opt; ?>[wallet_<?php echo $m; ?>]">
                        <option value=""><?php echo esc_html($t['select_wallet']); ?></option>
                        <?php foreach ($options as $w): ?>
                            <option value="<?php echo esc_attr($w['id']); ?>" <?php selected($current, $w['id']); ?>>
                                <?php echo esc_html(($w['wallet_code'] ?? '?') . ' — ' . ($w['name'] ?? 'Wallet')); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                <?php endif; ?>
            </div>
        <?php endforeach; ?>

        <h2><?php echo esc_html($t['methods']); ?></h2>
        <p class="description"><?php echo esc_html($t['methods_help']); ?></p>
        <table class="form-table">
            <?php foreach ($methods as $k=>$m):
                $on = in_array($k, $enabled, true); ?>
                <tr><th><?php echo esc_html($m['label']); ?></th>
                    <td><label><input type="checkbox" name="<?php echo $opt; ?>[enabled_methods][]" value="<?php echo esc_attr($k); ?>" <?php checked($on); ?> />
                        <?php echo esc_html(implode(' / ', $m['currencies'])); ?><?php echo $m['recurring'] ? ' — '.esc_html($t['recurring']) : ''; ?>
                    </label></td></tr>
            <?php endforeach; ?>
        </table>

        <h2><?php echo esc_html($t['recurring']); ?></h2>
        <table class="form-table">
            <tr><th><?php echo esc_html($t['recurring_enable']); ?></th>
                <td><label><input type="checkbox" name="<?php echo $opt; ?>[recurring_enabled]" value="1" <?php checked(($s['recurring_enabled'] ?? 'yes')==='yes'); ?> />
                    <?php echo esc_html($t['recurring_enable']); ?></label></td></tr>
            <tr><th><?php echo esc_html($t['terms_url']); ?></th>
                <td><input type="url" class="regular-text" name="<?php echo $opt; ?>[terms_url]" value="<?php echo esc_attr($s['terms_url'] ?? ''); ?>" placeholder="https://loja.com/termos-mandato" /></td></tr>
        </table>

        <h2><?php echo esc_html($t['webhook']); ?></h2>
        <table class="form-table">
            <tr><th><?php echo esc_html($t['webhook_secret']); ?></th>
                <td><input type="text" class="regular-text" name="<?php echo $opt; ?>[webhook_secret]" value="<?php echo esc_attr($s['webhook_secret'] ?? ''); ?>" placeholder="whsec_..." />
                <label style="display:block;margin-top:6px"><input type="checkbox" name="<?php echo $opt; ?>[regen_webhook_secret]" value="1" /> <?php echo esc_html($t['webhook_regen']); ?></label></td></tr>
            <tr><th><?php echo esc_html($t['webhook_url']); ?></th>
                <td>
                    <div style="display:flex;gap:6px;align-items:center;max-width:640px">
                        <input type="text" id="zp-webhook-url" readonly class="regular-text code" value="<?php echo esc_attr($webhook_url); ?>" onfocus="this.select()" style="flex:1" />
                        <button type="button" class="button" id="zp-copy-webhook" data-target="zp-webhook-url">📋 <?php echo esc_html__('Copiar', 'zumbopay-payments'); ?></button>
                    </div>
                    <p class="description"><?php echo esc_html__('Cole este URL em ZumboPay → Programadores → Webhooks.', 'zumbopay-payments'); ?></p>
                </td></tr>
        </table>

        <div class="zp-diag">
            <strong>Diagnóstico:</strong>
            <?php if ($synced_at): ?>
                Último sync: <?php echo esc_html(date_i18n('Y-m-d H:i', $synced_at)); ?> ·
                <?php echo (int)count($wallets); ?> carteiras ·
                M-Pesa: <?php echo count($byMethod['mpesa']); ?> ·
                e-Mola: <?php echo count($byMethod['emola']); ?> ·
                Cartão: <?php echo count($byMethod['card']); ?>
            <?php else: ?>
                Ainda não sincronizado. Cole a API Key e clique em "Sincronizar carteiras".
            <?php endif; ?>
        </div>
        </div>

        <script>
        (function(){
            var btn = document.getElementById('zp-sync-btn');
            var notice = document.getElementById('zp-sync-notice');
            if (!btn) return;
            btn.addEventListener('click', function(){
                var key = (document.getElementById('zp-apikey')||{}).value || '';
                if (!key.trim()) { notice.innerHTML = '<div class="zp-notice err"><?php echo esc_js($t['need_key']); ?></div>'; return; }
                btn.disabled = true;
                btn.querySelector('.zp-label').innerHTML = '<span class="zp-spin"></span> <?php echo esc_js($t['syncing']); ?>';
                notice.innerHTML = '';
                var fd = new FormData();
                fd.append('action','zumbopay_sync_wallets');
                fd.append('nonce', btn.dataset.nonce);
                fd.append('api_key', key.trim());
                fetch(ajaxurl, {method:'POST', body:fd, credentials:'same-origin'})
                    .then(function(r){ return r.json(); })
                    .then(function(j){
                        btn.disabled = false;
                        btn.querySelector('.zp-label').textContent = '<?php echo esc_js($t['sync_wallets']); ?>';
                        if (!j || !j.success) {
                            var d = (j && j.data) || {};
                            var msg = d.error || '<?php echo esc_js($t['sync_fail']); ?>';
                            var html = '<div class="zp-notice err"><strong>✕ ' + msg + '</strong>';
                            if (d.hint) html += '<br/><span style="font-weight:400">' + d.hint + '</span>';
                            var meta = [];
                            if (d.code) meta.push('code: ' + d.code);
                            if (d.status) meta.push('HTTP ' + d.status);
                            if (d.step) meta.push('passo: ' + d.step);
                            if (meta.length) html += '<br/><small style="opacity:.75">' + meta.join(' · ') + '</small>';
                            notice.innerHTML = html + '</div>';
                            return;
                        }

                        var n = (j.data.wallets||[]).length;
                        notice.innerHTML = '<div class="zp-notice ok">✓ ' + n + ' <?php echo esc_js($t['wallets_found']); ?></div>';
                        setTimeout(function(){ location.reload(); }, 700);
                    })
                    .catch(function(e){
                        btn.disabled = false;
                        btn.querySelector('.zp-label').textContent = '<?php echo esc_js($t['sync_wallets']); ?>';
                        notice.innerHTML = '<div class="zp-notice err">✕ ' + (e.message||'network error') + '</div>';
                    });
            });



            // Copy webhook URL
            var cp = document.getElementById('zp-copy-webhook');
            if (cp) cp.addEventListener('click', function(){
                var el = document.getElementById(cp.dataset.target);
                if (!el) return;
                el.select(); el.setSelectionRange(0, 99999);
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(el.value);
                    } else {
                        document.execCommand('copy');
                    }
                    var old = cp.innerHTML;
                    cp.innerHTML = '✓ Copiado';
                    setTimeout(function(){ cp.innerHTML = old; }, 1500);
                } catch(e) {}
            });
        })();
        </script>
        <?php
    }
}
