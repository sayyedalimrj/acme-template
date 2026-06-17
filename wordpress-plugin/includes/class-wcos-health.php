<?php
/**
 * Health checks (WCOS_Health).
 *
 * Computes a safe, non-secret health report from locally-available facts. Performs NO network
 * calls and NO backend communication. Each item has a status of ok | warning | error |
 * not_configured. WooCommerce being missing is a warning, never fatal.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Health')) {
    /**
     * Local health-check runner.
     */
    final class WCOS_Health {

        /**
         * Build one health item.
         *
         * @param string $id       Stable id.
         * @param string $label    Human label.
         * @param string $status   ok|warning|error|not_configured.
         * @param string $severity info|warning|critical.
         * @param string $detail   Safe, non-secret detail.
         * @return array<string,string>
         */
        private static function item($id, $label, $status, $severity, $detail) {
            return array(
                'id'       => $id,
                'label'    => $label,
                'status'   => $status,
                'severity' => $severity,
                'detail'   => $detail,
            );
        }

        /**
         * Roll up item statuses into an overall status.
         *
         * @param array<int,array<string,string>> $items Items.
         * @return string ok|warning|error
         */
        private static function rollup($items) {
            $has_error   = false;
            $has_warning = false;
            foreach ($items as $it) {
                if ($it['status'] === 'error') {
                    $has_error = true;
                }
                if ($it['status'] === 'warning') {
                    $has_warning = true;
                }
            }
            if ($has_error) {
                return 'error';
            }
            if ($has_warning) {
                return 'warning';
            }

            return 'ok';
        }

        /**
         * Run all health checks and return a safe report (no secrets, no network).
         *
         * @return array<string,mixed>
         */
        public static function run() {
            $items = array();

            // WordPress version available.
            $wp_version = function_exists('get_bloginfo') ? (string) get_bloginfo('version') : '';
            $items[] = self::item(
                'wordpress_version',
                'WordPress version',
                $wp_version !== '' ? 'ok' : 'warning',
                'info',
                $wp_version !== '' ? $wp_version : 'Unknown'
            );

            // PHP version available.
            $php_version = (string) phpversion();
            $items[] = self::item(
                'php_version',
                'PHP version',
                $php_version !== '' ? 'ok' : 'warning',
                'info',
                $php_version !== '' ? $php_version : 'Unknown'
            );

            // HTTPS status.
            $https = function_exists('is_ssl') ? is_ssl() : false;
            $items[] = self::item(
                'https_enabled',
                'HTTPS enabled',
                $https ? 'ok' : 'warning',
                'critical',
                $https ? 'HTTPS detected' : 'HTTPS not detected'
            );

            // REST API availability (presence placeholder — no network self-probe).
            $rest_ready = function_exists('rest_url');
            $items[] = self::item(
                'rest_api_available',
                'WordPress REST API available',
                $rest_ready ? 'ok' : 'warning',
                'critical',
                $rest_ready ? 'REST API present' : 'REST API unavailable'
            );

            // WooCommerce active (optional → warning, not error).
            $wc_active = WCOS_WooCommerce::is_active();
            $items[] = self::item(
                'woocommerce_active',
                'WooCommerce active',
                $wc_active ? 'ok' : 'warning',
                'warning',
                $wc_active ? 'WooCommerce active' : 'WooCommerce not detected (optional)'
            );

            // WooCommerce version available.
            $wc_version = WCOS_WooCommerce::version();
            $wc_version_status = $wc_version ? 'ok' : ($wc_active ? 'warning' : 'not_configured');
            $items[] = self::item(
                'woocommerce_version',
                'WooCommerce version',
                $wc_version_status,
                'info',
                $wc_version ? $wc_version : 'Unknown'
            );

            // Plugin version.
            $items[] = self::item(
                'plugin_version',
                'Companion plugin version',
                'ok',
                'info',
                defined('WCOS_VERSION') ? WCOS_VERSION : ''
            );

            // Backend connection status (not connected yet).
            $items[] = self::item(
                'connection_status',
                'Backend connection',
                'not_configured',
                'info',
                'Not connected (secure connection handled later via backend/proxy handshake)'
            );

            // Webhook readiness (not configured yet).
            $items[] = self::item(
                'webhook_readiness',
                'Webhook readiness',
                'not_configured',
                'info',
                'Webhooks not configured yet'
            );

            // Local connection state exists.
            $connection_status = WCOS_Connection::get_status();
            $items[] = self::item(
                'local_connection_state',
                'Local connection state',
                in_array($connection_status, WCOS_Connection::allowed_statuses(), true) ? 'ok' : 'warning',
                'info',
                'Status: ' . $connection_status
            );

            // WooCommerce read bridge readiness (missing WooCommerce = warning, not fatal).
            $items[] = self::item(
                'read_bridge_readiness',
                'WooCommerce read bridge readiness',
                $wc_active ? 'ok' : 'warning',
                'warning',
                $wc_active ? 'Read bridge available' : 'WooCommerce not active (read bridge unavailable)'
            );

            // Products summary readable.
            $items[] = self::item(
                'products_summary_readable',
                'Products summary readable',
                WCOS_WooCommerce::can_read_products() ? 'ok' : 'not_configured',
                'info',
                WCOS_WooCommerce::can_read_products() ? 'Readable' : 'Unavailable (WooCommerce inactive)'
            );

            // Orders summary readable.
            $items[] = self::item(
                'orders_summary_readable',
                'Orders summary readable',
                WCOS_WooCommerce::can_read_orders() ? 'ok' : 'not_configured',
                'info',
                WCOS_WooCommerce::can_read_orders() ? 'Readable' : 'Unavailable (WooCommerce inactive)'
            );

            // Customers summary readable.
            $items[] = self::item(
                'customers_summary_readable',
                'Customers summary readable',
                WCOS_WooCommerce::can_read_customers() ? 'ok' : 'not_configured',
                'info',
                WCOS_WooCommerce::can_read_customers() ? 'Readable' : 'Unavailable (WooCommerce inactive)'
            );

            return array(
                'overall'      => self::rollup($items),
                'items'        => $items,
                'generated_at' => function_exists('current_time') ? current_time('c') : gmdate('c'),
            );
        }
    }
}
