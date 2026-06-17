<?php
/**
 * REST endpoints (WCOS_REST).
 *
 * Registers two local, read-only, ADMIN-AUTHENTICATED endpoints under the `wcos/v1`
 * namespace:
 *   - GET /wp-json/wcos/v1/status
 *   - GET /wp-json/wcos/v1/health
 *
 * Both require the `manage_options` capability (no public/unauthenticated access). They
 * return only non-secret data (plugin/connection status, site/home URL, WooCommerce active
 * flag, health summary, capability summary). They NEVER expose admin email, usernames,
 * customer/order/product data, full server environment, secrets, tokens, cookies, nonces, or
 * raw headers. Output is additionally passed through WCOS_Redaction as defense-in-depth.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_REST')) {
    /**
     * REST route registration + handlers.
     */
    final class WCOS_REST {

        /**
         * Hook route registration.
         *
         * @return void
         */
        public static function init() {
            add_action('rest_api_init', array(__CLASS__, 'register_routes'));
        }

        /**
         * Register the status + health routes.
         *
         * @return void
         */
        public static function register_routes() {
            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/status',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_status'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/health',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_health'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );
        }

        /**
         * Admin-only permission gate. No unauthenticated access.
         *
         * @return bool
         */
        public static function permission_check() {
            return WCOS_Capabilities::current_user_can_manage();
        }

        /**
         * GET /wcos/v1/status — non-secret plugin + connection + WooCommerce summary.
         *
         * @return mixed REST response.
         */
        public static function get_status() {
            $data = array(
                'plugin'            => 'wordpress-commerce-os-companion',
                'plugin_version'    => WCOS_VERSION,
                'connection_status' => wcos_get_connection_status(),
                'site_url'          => function_exists('site_url') ? site_url() : '',
                'home_url'          => function_exists('home_url') ? home_url() : '',
                'woocommerce'       => WCOS_WooCommerce::summary(),
                'capabilities'      => WCOS_Capabilities::capability_summary(),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * GET /wcos/v1/health — non-secret health summary.
         *
         * @return mixed REST response.
         */
        public static function get_health() {
            $data = array(
                'plugin_version'    => WCOS_VERSION,
                'connection_status' => wcos_get_connection_status(),
                'health'            => WCOS_Health::run(),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }
    }
}
