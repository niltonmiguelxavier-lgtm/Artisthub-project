<?php
if (!defined('ABSPATH')) { exit; }

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

class ZumboPay_Blocks_Support extends AbstractPaymentMethodType {
    protected $name = 'zumbopay';

    public function initialize() {
        $this->settings = get_option('woocommerce_zumbopay_settings', []);
    }

    public function is_active() { return ($this->settings['enabled'] ?? 'yes') === 'yes'; }

    public function get_payment_method_script_handles() {
        wp_register_script(
            'zumbopay-blocks',
            ZUMBOPAY_URL . 'assets/js/blocks.js',
            ['wc-blocks-registry','wc-settings','wp-element','wp-html-entities','wp-i18n'],
            ZUMBOPAY_VERSION, true
        );
        return ['zumbopay-blocks'];
    }

    public function get_payment_method_data() {
        $s = get_option('zumbopay_settings', []);
        $enabled = (array)($s['enabled_methods'] ?? []);
        $registry = zumbopay_methods_registry();
        $methods = [];
        foreach ($registry as $key => $m) {
            if (!in_array($key, $enabled, true)) continue;
            $m['key']      = $key;
            $m['logo_url'] = ZUMBOPAY_URL . 'assets/img/' . $m['logo'];
            $methods[] = $m;
        }
        return [
            'title'       => $this->settings['title'] ?? 'ZumboPay',
            'description' => $this->settings['description'] ?? '',
            'icon'        => ZUMBOPAY_URL . 'assets/img/zumbopay.png',
            'brand_logo'  => ZUMBOPAY_URL . 'assets/img/zumbopay.png',
            'methods'     => $methods,
            'intervals'   => zumbopay_recurring_intervals(),
            'recurring_enabled' => ($s['recurring_enabled'] ?? 'yes') === 'yes',
            'terms_url'   => $s['terms_url'] ?? '',
            'currency'    => strtoupper(get_woocommerce_currency()),
        ];
    }
}
