<?php
if (!defined('ABSPATH')) { exit; }

/**
 * Auto-update via manifesto JSON alojado em zumbopay.com.
 *
 * Fluxo standard do WordPress (sem precisar do repositório oficial):
 *   1) WP corre `pre_set_site_transient_update_plugins` periodicamente.
 *   2) Aqui puxamos https://zumbopay.com/plugin/zumbopay-payments.json
 *      → { version, download_url, requires, tested, sections{...} }
 *   3) Se `version` remota > versão instalada, injectamos entrada no transient
 *      e o WP mostra "Update available" + botão "Update now" — o ZIP é
 *      descarregado directamente de zumbopay.com e substitui os ficheiros.
 *   4) `plugins_api` responde ao "View details" com screenshots e changelog.
 *
 * Não precisa de desinstalar. Não precisa de FTP. Não expõe segredos.
 */
class ZumboPay_Updater {

    const MANIFEST_URL   = 'https://zumbopay.com/plugin/zumbopay-payments.json';
    const CACHE_KEY      = 'zumbopay_update_manifest';
    const CACHE_TTL      = 6 * HOUR_IN_SECONDS;

    private $file;    // Caminho absoluto do ficheiro principal
    private $slug;    // basename dir (folder do plugin)
    private $basename;// plugin_basename() → "zumbopay-payments/zumbopay-payments.php"
    private $version;

    public function __construct(string $plugin_file, string $version) {
        $this->file     = $plugin_file;
        $this->version  = $version;
        $this->basename = plugin_basename($plugin_file);
        $this->slug     = dirname($this->basename);
        if ($this->slug === '.' || $this->slug === '') $this->slug = 'zumbopay-payments';

        add_filter('pre_set_site_transient_update_plugins', [$this, 'inject_update']);
        add_filter('plugins_api', [$this, 'plugins_api'], 20, 3);
        add_action('upgrader_process_complete', [$this, 'clear_cache'], 10, 2);
    }

    public function clear_cache($upgrader, $options) {
        if (($options['type'] ?? '') === 'plugin') delete_transient(self::CACHE_KEY);
    }

    /** Descarrega e faz cache do manifesto remoto. */
    private function fetch_manifest() {
        $cached = get_transient(self::CACHE_KEY);
        if (is_array($cached)) return $cached;
        $res = wp_remote_get(self::MANIFEST_URL, [
            'timeout' => 8,
            'headers' => ['Accept' => 'application/json'],
        ]);
        if (is_wp_error($res)) return null;
        $code = wp_remote_retrieve_response_code($res);
        if ($code !== 200) return null;
        $data = json_decode(wp_remote_retrieve_body($res), true);
        if (!is_array($data) || empty($data['version']) || empty($data['download_url'])) return null;
        set_transient(self::CACHE_KEY, $data, self::CACHE_TTL);
        return $data;
    }

    /** Injecta a entrada de update no transient global do core. */
    public function inject_update($transient) {
        if (empty($transient) || !is_object($transient)) $transient = new stdClass();
        $m = $this->fetch_manifest();
        if (!$m) return $transient;
        if (version_compare($m['version'], $this->version, '<=')) return $transient;
        $item = (object) [
            'id'            => 'zumbopay.com/' . $this->slug,
            'slug'          => $this->slug,
            'plugin'        => $this->basename,
            'new_version'   => (string) $m['version'],
            'url'           => esc_url_raw($m['homepage'] ?? 'https://zumbopay.com'),
            'package'       => esc_url_raw($m['download_url']),
            'requires'      => (string) ($m['requires']     ?? '5.8'),
            'requires_php'  => (string) ($m['requires_php'] ?? '7.4'),
            'tested'        => (string) ($m['tested']       ?? get_bloginfo('version')),
            'icons'         => (array)  ($m['icons']        ?? []),
            'banners'       => (array)  ($m['banners']      ?? []),
        ];
        $transient->response[$this->basename] = $item;
        return $transient;
    }

    /** Detalhes ao clicar "View details" no admin. */
    public function plugins_api($result, $action, $args) {
        if ($action !== 'plugin_information') return $result;
        if (empty($args->slug) || $args->slug !== $this->slug) return $result;
        $m = $this->fetch_manifest();
        if (!$m) return $result;
        return (object) [
            'name'          => $m['name']         ?? 'ZumboPay Payments',
            'slug'          => $this->slug,
            'version'       => (string) $m['version'],
            'author'        => $m['author']       ?? '<a href="https://zumbopay.com">ZumboPay</a>',
            'homepage'      => $m['homepage']     ?? 'https://zumbopay.com',
            'requires'      => (string)($m['requires']     ?? '5.8'),
            'requires_php'  => (string)($m['requires_php'] ?? '7.4'),
            'tested'        => (string)($m['tested']       ?? get_bloginfo('version')),
            'download_link' => esc_url_raw($m['download_url']),
            'trunk'         => esc_url_raw($m['download_url']),
            'sections'      => (array)   ($m['sections']    ?? [
                'description' => 'M-Pesa, e-Mola e Visa/Mastercard com sincronização automática de carteiras.',
            ]),
            'banners'       => (array)   ($m['banners']     ?? []),
            'icons'         => (array)   ($m['icons']       ?? []),
        ];
    }
}
