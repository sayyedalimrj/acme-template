<?php
/**
 * REST endpoints (WCOS_REST).
 *
 * Registers local, read-only, ADMIN-AUTHENTICATED endpoints under the `wcos/v1` namespace:
 *   - GET  /wp-json/wcos/v1/status
 *   - GET  /wp-json/wcos/v1/health
 *   - GET  /wp-json/wcos/v1/connection
 *   - POST /wp-json/wcos/v1/connection/local-ready
 *   - POST /wp-json/wcos/v1/connection/disconnect
 *   - GET  /wp-json/wcos/v1/woocommerce/summary
 *   - GET  /wp-json/wcos/v1/woocommerce/products
 *   - GET  /wp-json/wcos/v1/woocommerce/orders
 *   - GET  /wp-json/wcos/v1/woocommerce/customers
 *
 * ALL routes require the `manage_options` capability (no public/unauthenticated access). The
 * connection POST routes only mutate non-secret local options (no network, no credentials).
 * Responses are summary-only, PII-minimized, and passed through WCOS_Redaction as
 * defense-in-depth. They NEVER expose admin email, usernames, raw customer/order/product
 * records, addresses, phones, raw emails, full server environment, secrets, tokens, cookies,
 * nonces, or raw headers.
 *
 * Hardening note: these routes rely on a capability permission_callback (consistent with the
 * existing skeleton). A future PR should add nonce/session hardening (e.g. `X-WP-Nonce` +
 * rotating session checks) for browser-originated calls.
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

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/connection',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_connection'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/connection/local-ready',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_local_ready'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/connection/disconnect',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_disconnect'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/woocommerce/summary',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_woocommerce_summary'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/woocommerce/products',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_woocommerce_products'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => self::limit_arg(),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/woocommerce/orders',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_woocommerce_orders'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => self::limit_arg(),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/woocommerce/customers',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_woocommerce_customers'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => self::limit_arg(),
                )
            );
        }

        /**
         * Shared REST arg schema for the optional `limit` query parameter.
         *
         * @return array<string,mixed>
         */
        private static function limit_arg() {
            return array(
                'limit' => array(
                    'required'          => false,
                    'type'              => 'integer',
                    'sanitize_callback' => 'absint',
                ),
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

        /**
         * GET /wcos/v1/connection — non-secret local connection summary.
         *
         * @return mixed REST response.
         */
        public static function get_connection() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Connection::get_connection_summary())
            );
        }

        /**
         * POST /wcos/v1/connection/local-ready — mark local readiness (non-secret options only).
         *
         * @return mixed REST response.
         */
        public static function post_local_ready() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Connection::mark_local_ready())
            );
        }

        /**
         * POST /wcos/v1/connection/disconnect — clear local connection state.
         *
         * @return mixed REST response.
         */
        public static function post_disconnect() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Connection::disconnect())
            );
        }

        /**
         * GET /wcos/v1/woocommerce/summary — counts + capabilities (no PII).
         *
         * @return mixed REST response.
         */
        public static function get_woocommerce_summary() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Read_Bridge::get_store_summary())
            );
        }

        /**
         * GET /wcos/v1/woocommerce/products — read-only product summaries.
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function get_woocommerce_products($request) {
            $limit = self::read_limit($request);
            $data  = array(
                'limit' => $limit,
                'items' => WCOS_Read_Bridge::get_products_summary($limit),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * GET /wcos/v1/woocommerce/orders — read-only order summaries.
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function get_woocommerce_orders($request) {
            $limit = self::read_limit($request);
            $data  = array(
                'limit' => $limit,
                'items' => WCOS_Read_Bridge::get_orders_summary($limit),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * GET /wcos/v1/woocommerce/customers — read-only customer summaries (generic labels).
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function get_woocommerce_customers($request) {
            $limit = self::read_limit($request);
            $data  = array(
                'limit' => $limit,
                'items' => WCOS_Read_Bridge::get_customers_summary($limit),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * Read + clamp the `limit` request parameter.
         *
         * @param mixed $request REST request.
         * @return int
         */
        private static function read_limit($request) {
            $limit = WCOS_Read_Bridge::DEFAULT_LIMIT;
            if (is_object($request) && method_exists($request, 'get_param')) {
                $param = $request->get_param('limit');
                if ($param !== null) {
                    $limit = $param;
                }
            }

            return WCOS_Read_Bridge::clamp_limit($limit);
        }
    }
}
