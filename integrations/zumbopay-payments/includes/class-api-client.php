<?php
if (!defined('ABSPATH')) { exit; }

/**
 * Wrapper HTTP para a API pública ZumboPay.
 *   Base: https://zumbopay.com/api/public/v1
 *   Auth: Authorization: Bearer <api_key>   (zk_live_… ou zk_test_…)
 */
class ZumboPay_API_Client {
    private $settings;

    public function __construct() {
        $this->settings = get_option('zumbopay_settings', []);
    }

    /**
     * Normaliza a API key colada pelo utilizador.
     * Remove espaços, quebras de linha, NBSP e caracteres invisíveis (zero-width)
     * que os browsers costumam colar a partir do painel — a causa mais comum de
     * "API key inválida" mesmo com uma chave correcta.
     */
    public static function normalize_key($raw) {
        $k = (string) $raw;
        // zero-width space / non-joiner / joiner / BOM / NBSP
        $k = preg_replace('/\x{200B}|\x{200C}|\x{200D}|\x{FEFF}|\x{00A0}/u', '', $k);
        $k = preg_replace('/\s+/', '', $k);
        // Alguns utilizadores colam "Bearer zk_live_…"
        $k = preg_replace('/^bearer/i', '', $k);
        return trim($k);
    }

    /** Verifica o formato exigido pela API: zk_live_/zk_test_ + hex. */
    public static function key_format_ok($key) {
        return (bool) preg_match('/^zk_(live|test)_[a-f0-9]{20,}$/i', (string) $key);
    }

    private function api_key() { return self::normalize_key($this->settings['api_key'] ?? ''); }

    /** POST /payments — cria payment_request (link|split|recurring). */
    public function create_payment(array $payload) {
        if (!$this->api_key()) {
            return ['status'=>400, 'body'=>['success'=>false, 'error'=>'ZumboPay: API key não configurada.']];
        }
        return $this->request('POST', '/payments', $payload);
    }

    /**
     * POST /charges — STK push directo (M-Pesa / e-Mola), sem checkout hospedado.
     * Devolve status=success | pending | failed.
     */
    public function create_charge(array $payload) {
        if (!$this->api_key()) {
            return ['status'=>400, 'body'=>['success'=>false, 'error'=>'ZumboPay: API key não configurada.']];
        }
        return $this->request('POST', '/charges', $payload);
    }

    /** GET /payments/{reference} — estado autoritativo. */
    public function get_payment(string $reference) {
        $reference = rawurlencode($reference);
        return $this->request('GET', "/payments/{$reference}");
    }

    /** GET /wallets — lista carteiras activas do merchant. */
    public function list_wallets() {
        return $this->request('GET', '/wallets');
    }

    /** GET /merchant/validate — valida API key + devolve relatório completo. */
    public function validate_merchant() {
        return $this->request('GET', '/merchant/validate');
    }

    /** DELETE /subscriptions/{id}. */
    public function cancel_subscription(string $subId) {
        $subId = rawurlencode($subId);
        return $this->request('DELETE', "/subscriptions/{$subId}");
    }

    private function request(string $method, string $path, array $body = null) {
        $args = [
            'method'  => $method,
            'timeout' => 45,
            'headers' => [
                'Accept'            => 'application/json',
                'Content-Type'      => 'application/json',
                'Authorization'     => 'Bearer ' . $this->api_key(),
                'X-ZumboPay-Client' => 'woocommerce/' . ZUMBOPAY_VERSION,
                'Idempotency-Key'   => wp_generate_uuid4(),
            ],
        ];
        if ($body !== null && $method !== 'GET') {
            $args['body'] = wp_json_encode($body);
        }
        $res = wp_remote_request(ZUMBOPAY_API_URL . $path, $args);
        if (is_wp_error($res)) {
            // Falha de rede do servidor WordPress (firewall/egress do alojamento,
            // DNS, timeout cURL). NÃO é uma API key inválida.
            return [
                'status'  => 0,
                'network' => true,
                'body'    => [
                    'success' => false,
                    'error'   => [
                        'code'    => 'network_error',
                        'message' => $res->get_error_message(),
                    ],
                ],
            ];
        }
        $code = wp_remote_retrieve_response_code($res);
        $data = json_decode(wp_remote_retrieve_body($res), true);
        if (!is_array($data)) {
            $data = ['success'=>false, 'error'=>['code'=>'bad_response', 'message'=>'Resposta vazia ou não-JSON do servidor.']];
        }
        return ['status' => $code ?: 200, 'network' => false, 'body' => $data];
    }

    /**
     * Converte uma resposta de erro numa mensagem accionável em português.
     * Nunca devolve "API key inválida" para problemas que não são da chave.
     */
    public static function describe_error(array $res) {
        $status = (int) ($res['status'] ?? 0);
        $err    = $res['body']['error'] ?? [];
        $code   = is_array($err) ? ($err['code'] ?? '') : '';
        $msg    = is_array($err) ? ($err['message'] ?? '') : (string) $err;

        if (!empty($res['network']) || $status === 0) {
            return [
                'code'  => 'network_error',
                'title' => 'Não foi possível contactar zumbopay.com a partir deste servidor',
                'hint'  => 'O WordPress não conseguiu sair para a Internet (' . $msg . '). Peça ao alojamento para permitir ligações HTTPS de saída para zumbopay.com, ou aumente o timeout do cURL. A sua API Key não foi rejeitada.',
            ];
        }
        switch ($status) {
            case 401:
                if ($code === 'revoked_api_key') {
                    return ['code'=>$code, 'title'=>'API Key revogada', 'hint'=>'Crie uma nova chave em zumbopay.com → Programadores → API Keys.'];
                }
                if ($code === 'expired_api_key') {
                    return ['code'=>$code, 'title'=>'API Key expirada', 'hint'=>'Crie ou rode a chave em zumbopay.com → Programadores → API Keys.'];
                }
                return ['code'=>$code ?: 'invalid_api_key', 'title'=>'API Key inválida', 'hint'=>'Copie a chave completa (zk_live_… ou zk_test_…) sem espaços. A chave só é mostrada uma vez ao ser criada — se a perdeu, crie uma nova.'];
            case 403:
                if ($code === 'insufficient_scope') {
                    return ['code'=>$code, 'title'=>'A API Key não tem permissões suficientes', 'hint'=>'A chave precisa do scope wallets:read (e payments:write). Crie uma nova chave com todos os scopes em Programadores → API Keys. Detalhe: ' . $msg];
                }
                if ($code === 'account_suspended') {
                    return ['code'=>$code, 'title'=>'Conta restringida', 'hint'=>'A sua conta ZumboPay está suspensa. Contacte o suporte.'];
                }
                return ['code'=>$code ?: 'forbidden', 'title'=>'Acesso negado', 'hint'=>$msg];
            case 429:
                return ['code'=>'rate_limited', 'title'=>'Demasiados pedidos', 'hint'=>'Aguarde um minuto e tente novamente.'];
            case 404:
                return ['code'=>'not_found', 'title'=>'Endpoint não encontrado', 'hint'=>'Confirme que o URL base é ' . ZUMBOPAY_API_URL . '.'];
            default:
                if ($status >= 500) {
                    return ['code'=>$code ?: 'server_error', 'title'=>'Erro no servidor ZumboPay', 'hint'=>$msg ?: 'Tente novamente dentro de instantes.'];
                }
                return ['code'=>$code ?: 'error', 'title'=>'Erro (HTTP ' . $status . ')', 'hint'=>$msg];
        }
    }
}


