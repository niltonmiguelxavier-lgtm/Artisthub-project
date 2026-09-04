<?php
/**
 * Plugin Name: ZumboPay Payments
 * Plugin URI: https://zumbopay.com
 * Description: Aceite M-Pesa, e-Mola e Visa/Mastercard (MPGS) no WordPress e WooCommerce via ZumboPay. Suporta pagamentos únicos e recorrentes (cartão) com mandato do cliente. Sincronização automática de carteiras via API key. Auto-update. PT / EN-ZA. Apenas produção.
 * Version: 1.3.1
 * Author: ZumboPay
 * Author URI: https://zumbopay.com
 * License: GPL-2.0+
 * Text Domain: zumbopay-payments
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * Update URI: https://zumbopay.com/plugin/zumbopay-payments.json
 */

if (!defined('ABSPATH')) { exit; }

define('ZUMBOPAY_VERSION', '1.3.1');
define('ZUMBOPAY_PATH', plugin_dir_path(__FILE__));
define('ZUMBOPAY_URL',  plugin_dir_url(__FILE__));
define('ZUMBOPAY_API_URL', 'https://zumbopay.com/api/public/v1');
define('ZUMBOPAY_APP_URL', 'https://zumbopay.com');

/**
 * Métodos suportados. NOTA: PayFast/mKesh removidos por política.
 *   mpesa / emola  → apenas MZN, exige telefone (STK Push)
 *   card           → MZN e ZAR (MPGS), inclui recorrência com mandato
 */
function zumbopay_methods_registry() {
    return [
        'mpesa' => ['label'=>'M-Pesa',            'logo'=>'mpesa.png',   'currencies'=>['MZN'],       'needs_phone'=>true,  'recurring'=>false],
        'emola' => ['label'=>'e-Mola',            'logo'=>'emola.png',   'currencies'=>['MZN'],       'needs_phone'=>true,  'recurring'=>false],
        'card'  => ['label'=>'Visa / Mastercard', 'logo'=>'visa-mastercard.png', 'currencies'=>['MZN','ZAR'], 'needs_phone'=>false, 'recurring'=>true ],
    ];
}

/** Intervalos aceites pela API v1 /payments (type=recurring). */
function zumbopay_recurring_intervals() {
    return [
        'daily'      => __('Diário',     'zumbopay-payments'),
        'weekly'     => __('Semanal',    'zumbopay-payments'),
        'monthly'    => __('Mensal',     'zumbopay-payments'),
        'quarterly'  => __('Trimestral', 'zumbopay-payments'),
        'semiannual' => __('Semestral',  'zumbopay-payments'),
        'yearly'     => __('Anual',      'zumbopay-payments'),
    ];
}

require_once ZUMBOPAY_PATH . 'includes/class-i18n.php';
require_once ZUMBOPAY_PATH . 'includes/class-api-client.php';
require_once ZUMBOPAY_PATH . 'includes/class-settings.php';
require_once ZUMBOPAY_PATH . 'includes/class-payment-verifier.php';
require_once ZUMBOPAY_PATH . 'includes/class-webhook.php';
require_once ZUMBOPAY_PATH . 'includes/class-shortcode.php';
require_once ZUMBOPAY_PATH . 'includes/class-updater.php';

add_action('plugins_loaded', function () {
    new ZumboPay_Settings();
    new ZumboPay_Shortcode();
    new ZumboPay_Webhook();
    new ZumboPay_Updater(__FILE__, ZUMBOPAY_VERSION);

    if (class_exists('WC_Payment_Gateway')) {
        require_once ZUMBOPAY_PATH . 'includes/class-gateway-woocommerce.php';
        add_filter('woocommerce_payment_gateways', function ($gws) {
            $gws[] = 'ZumboPay_WC_Gateway';
            return $gws;
        });
    }
});

// HPOS + Blocks compatibility
add_action('before_woocommerce_init', function () {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('cart_checkout_blocks', __FILE__, true);
    }
});

// Registar como método Blocks
add_action('woocommerce_blocks_loaded', function () {
    if (!class_exists('Automattic\\WooCommerce\\Blocks\\Payments\\Integrations\\AbstractPaymentMethodType')) return;
    require_once ZUMBOPAY_PATH . 'includes/class-gateway-blocks.php';
    add_action('woocommerce_blocks_payment_method_type_registration', function ($registry) {
        $registry->register(new ZumboPay_Blocks_Support());
    });
});

register_activation_hook(__FILE__, function () {
    if (get_option('zumbopay_settings') === false) {
        add_option('zumbopay_settings', [
            'api_key'           => '',
            'webhook_secret'    => '',
            'wallet_mpesa'      => '',
            'wallet_emola'      => '',
            'wallet_card'       => '',
            'locale'            => 'auto',
            'enabled_methods'   => ['mpesa','emola','card'],
            'recurring_enabled' => 'yes',
            'terms_url'         => '',
        ]);
    }
});
