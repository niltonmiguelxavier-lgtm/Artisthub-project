<?php
if (!defined('ABSPATH')) { exit; }

class ZumboPay_I18N {
    public static function languages() {
        return ['auto'=>'Auto', 'pt'=>'Português', 'en'=>'English (ZA)'];
    }
    public static function current_lang() {
        $s = get_option('zumbopay_settings', []);
        $loc = $s['locale'] ?? 'auto';
        if ($loc !== 'auto') return $loc;
        $wp = substr((string) get_locale(), 0, 2);
        return in_array($wp, ['pt','en'], true) ? $wp : 'pt';
    }
    public static function all() {
        $lang = self::current_lang();
        $dict = [
            'pt' => [
                'plugin_title' => 'ZumboPay',
                'subtitle' => 'M-Pesa, e-Mola e Cartões — pagamentos únicos e recorrentes.',
                'credentials' => 'Credenciais',
                'api_key' => 'API Key',
                'api_key_help' => 'Encontra-a em zumbopay.com → Painel → Programadores → API Keys (zk_live_…).',
                'language' => 'Idioma',
                'save' => 'Guardar alterações',
                'test_connection' => 'Testar ligação',
                'methods' => 'Métodos de pagamento',
                'methods_help' => 'Escolha os métodos disponíveis no checkout.',
                'webhook' => 'Webhook',
                'webhook_secret' => 'Webhook Secret',
                'webhook_url' => 'URL do webhook (colar em ZumboPay → Programadores → Webhooks)',
                'webhook_regen' => 'Gerar novo webhook secret ao guardar',
                'recurring' => 'Pagamentos recorrentes (Cartão)',
                'recurring_enable' => 'Ativar recorrência no checkout',
                'terms_url' => 'URL dos Termos & Condições (mandato)',
                'phone' => 'Nº de telefone (9 dígitos)',
                'accept_mandate' => 'Aceito o mandato de cobrança recorrente',
                'period' => 'Periodicidade',
                'wallets_title' => 'Carteiras de destino',
                'wallets_help' => 'Escolha a carteira ZumboPay que recebe os pagamentos de cada método. Clique em "Sincronizar carteiras" para carregar as suas carteiras automaticamente com a API Key.',
                'select_wallet' => '— Escolher carteira —',
                'no_wallets' => 'Sem carteiras',
                'no_wallets_hint' => 'Não encontrámos nenhuma carteira ativa para este método.',
                'create_wallet' => 'Criar carteira',
                'sync_wallets' => 'Sincronizar carteiras',
                'syncing' => 'A sincronizar…',
                'sync_fail' => 'Falha ao sincronizar',
                'wallets_found' => 'carteiras encontradas',
                'need_key' => 'Cole a API Key primeiro.',
                'state_empty' => 'Sem API Key',
                'state_warn' => 'API Key colada — falta sincronizar',
                'state_ok' => 'Ligado',
                'synced_ago' => 'sincronizado há %s',
                'hero_hint' => 'Cole a sua API Key e clique em "Sincronizar carteiras" — as carteiras são carregadas automaticamente.',
            ],
            'en' => [
                'plugin_title' => 'ZumboPay',
                'subtitle' => 'M-Pesa, e-Mola and Cards — one-off and recurring payments.',
                'credentials' => 'Credentials',
                'api_key' => 'API Key',
                'api_key_help' => 'Find it at zumbopay.com → Dashboard → Developers → API Keys (zk_live_…).',
                'language' => 'Language',
                'save' => 'Save changes',
                'test_connection' => 'Test connection',
                'methods' => 'Payment methods',
                'methods_help' => 'Choose which methods to expose at checkout.',
                'webhook' => 'Webhook',
                'webhook_secret' => 'Webhook Secret',
                'webhook_url' => 'Webhook URL (paste in ZumboPay → Developers → Webhooks)',
                'webhook_regen' => 'Generate new webhook secret on save',
                'recurring' => 'Recurring payments (Card)',
                'recurring_enable' => 'Enable recurring at checkout',
                'terms_url' => 'Terms & Conditions URL (mandate)',
                'phone' => 'Phone number (9 digits)',
                'accept_mandate' => 'I accept the recurring billing mandate',
                'period' => 'Billing period',
                'wallets_title' => 'Destination wallets',
                'wallets_help' => 'Pick the ZumboPay wallet that receives payments per method. Click "Sync wallets" to auto-load your wallets using the API Key.',
                'select_wallet' => '— Choose wallet —',
                'no_wallets' => 'No wallets',
                'no_wallets_hint' => 'No active wallet found for this method.',
                'create_wallet' => 'Create wallet',
                'sync_wallets' => 'Sync wallets',
                'syncing' => 'Syncing…',
                'sync_fail' => 'Sync failed',
                'wallets_found' => 'wallets found',
                'need_key' => 'Paste the API Key first.',
                'state_empty' => 'No API Key',
                'state_warn' => 'API Key pasted — sync pending',
                'state_ok' => 'Connected',
                'synced_ago' => 'synced %s ago',
                'hero_hint' => 'Paste your API Key and click "Sync wallets" — wallets load automatically.',
            ],
        ];
        return $dict[$lang] ?? $dict['pt'];
    }
}
