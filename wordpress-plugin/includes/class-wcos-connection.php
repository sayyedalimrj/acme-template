<?php
/**
 * Connection state (WCOS_Connection).
 *
 * Manages NON-SECRET local connection state only. There are NO access tokens, API keys,
 * application passwords, consumer keys/secrets, backend secrets, or webhook secrets here —
 * and none may ever be added. Placeholder site/tenant identifiers are generated LOCALLY and
 * are not external IDs. The real backend handshake arrives in a later phase. See SECURITY.md.
 *
 * Plugin-owned options (all non-secret):
 *   - wcos_connection_status
 *   - wcos_connection_site_id
 *   - wcos_connection_tenant_id
 *   - wcos_connection_last_checked_at
 *   - wcos_connection_mode
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Connection')) {
    /**
     * Non-secret local connection state manager.
     */
    final class WCOS_Connection {

        const STATUS_NOT_CONNECTED = 'not_connected';
        const STATUS_LOCAL_READY = 'local_ready';
        const STATUS_PENDING_HANDSHAKE_LATER = 'pending_secure_handshake_later';
        const STATUS_CONNECTED_READ_ONLY_LATER = 'connected_read_only_later';
        const STATUS_CONNECTION_ERROR = 'connection_error';
        const STATUS_DISCONNECTED = 'disconnected';

        /**
         * Allowed connection statuses.
         *
         * @return string[]
         */
        public static function allowed_statuses() {
            return array(
                self::STATUS_NOT_CONNECTED,
                self::STATUS_LOCAL_READY,
                self::STATUS_PENDING_HANDSHAKE_LATER,
                self::STATUS_CONNECTED_READ_ONLY_LATER,
                self::STATUS_CONNECTION_ERROR,
                self::STATUS_DISCONNECTED,
            );
        }

        /**
         * Current connection status (validated against the allow-list).
         *
         * @return string
         */
        public static function get_status() {
            $status = get_option('wcos_connection_status', self::STATUS_NOT_CONNECTED);
            if (!is_string($status) || !in_array($status, self::allowed_statuses(), true)) {
                return self::STATUS_NOT_CONNECTED;
            }

            return $status;
        }

        /**
         * Whether a connection mode is active beyond "not connected".
         *
         * @return bool
         */
        public static function is_local_ready() {
            return self::get_status() === self::STATUS_LOCAL_READY;
        }

        /**
         * Generate a LOCAL, non-secret placeholder identifier (not an external ID).
         *
         * @param string $prefix Id prefix.
         * @return string
         */
        private static function generate_local_id($prefix) {
            if (function_exists('wp_generate_uuid4')) {
                return $prefix . wp_generate_uuid4();
            }
            $seed = $prefix . (function_exists('home_url') ? home_url() : 'site') . microtime(true);

            return $prefix . substr(md5($seed), 0, 16);
        }

        /**
         * Current timestamp (ISO-8601).
         *
         * @return string
         */
        private static function now() {
            return function_exists('current_time') ? current_time('c') : gmdate('c');
        }

        /**
         * Non-secret site identity summary (no admin email, no admin URL, no credentials).
         *
         * @return array<string,mixed>
         */
        public static function get_site_identity_summary() {
            return array(
                'site_url'            => function_exists('site_url') ? site_url() : '',
                'home_url'            => function_exists('home_url') ? home_url() : '',
                'wordpress_version'   => function_exists('get_bloginfo') ? get_bloginfo('version') : '',
                'php_version'         => (string) phpversion(),
                'https_enabled'       => function_exists('is_ssl') ? is_ssl() : false,
                'multisite'           => function_exists('is_multisite') ? is_multisite() : false,
                'locale'              => function_exists('get_locale') ? get_locale() : '',
                'timezone'            => function_exists('wp_timezone_string') ? wp_timezone_string() : '',
                'woocommerce_active'  => WCOS_WooCommerce::is_active(),
                'woocommerce_version' => WCOS_WooCommerce::version(),
            );
        }

        /**
         * Non-secret connection summary.
         *
         * @return array<string,mixed>
         */
        public static function get_connection_summary() {
            return array(
                'status'          => self::get_status(),
                'mode'            => (string) get_option('wcos_connection_mode', 'local'),
                'site_id'         => (string) get_option('wcos_connection_site_id', ''),
                'tenant_id'       => (string) get_option('wcos_connection_tenant_id', ''),
                'last_checked_at' => (string) get_option('wcos_connection_last_checked_at', ''),
                'is_local'        => true,
                'backend_connected' => false,
                'site_identity'   => self::get_site_identity_summary(),
            );
        }

        /**
         * Mark the plugin as locally ready. Stores only non-secret local placeholders.
         *
         * @return array<string,mixed> Connection summary.
         */
        public static function mark_local_ready() {
            $site_id = get_option('wcos_connection_site_id');
            if (!is_string($site_id) || $site_id === '') {
                $site_id = self::generate_local_id('site_local_');
                update_option('wcos_connection_site_id', $site_id);
            }

            $tenant_id = get_option('wcos_connection_tenant_id');
            if (!is_string($tenant_id) || $tenant_id === '') {
                $tenant_id = self::generate_local_id('tenant_local_');
                update_option('wcos_connection_tenant_id', $tenant_id);
            }

            update_option('wcos_connection_status', self::STATUS_LOCAL_READY);
            update_option('wcos_connection_mode', 'local');
            update_option('wcos_connection_last_checked_at', self::now());

            return self::get_connection_summary();
        }

        /**
         * Disconnect locally: clear local placeholders and mark disconnected. No network calls.
         *
         * @return array<string,mixed> Connection summary.
         */
        public static function disconnect() {
            delete_option('wcos_connection_site_id');
            delete_option('wcos_connection_tenant_id');
            update_option('wcos_connection_status', self::STATUS_DISCONNECTED);
            update_option('wcos_connection_mode', 'local');
            update_option('wcos_connection_last_checked_at', self::now());

            return self::get_connection_summary();
        }
    }
}
