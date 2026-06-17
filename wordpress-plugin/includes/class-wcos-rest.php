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
 *   - GET  /wp-json/wcos/v1/events
 *   - POST /wp-json/wcos/v1/events/test
 *   - POST /wp-json/wcos/v1/events/clear
 *   - GET  /wp-json/wcos/v1/webhook-config
 *   - POST /wp-json/wcos/v1/webhook-config/local-queue-only
 *   - POST /wp-json/wcos/v1/webhook-config/disable
 *   - GET  /wp-json/wcos/v1/actions
 *   - POST /wp-json/wcos/v1/actions/request
 *   - GET  /wp-json/wcos/v1/audit
 *   - GET  /wp-json/wcos/v1/sync/package
 *   - GET  /wp-json/wcos/v1/sync/preview
 *   - GET  /wp-json/wcos/v1/delivery
 *   - POST /wp-json/wcos/v1/delivery/local-preview-only
 *   - POST /wp-json/wcos/v1/delivery/disable
 *
 * ALL routes require the `manage_options` capability (no public/unauthenticated access). The
 * POST routes mutate only non-secret local options/queue (no network, no credentials, no
 * WooCommerce writes). The controlled-actions request route is a placeholder that ALWAYS
 * returns disabled and performs no mutation. Responses are summary-only, PII-minimized, and
 * passed through WCOS_Redaction as defense-in-depth. They NEVER expose admin email,
 * usernames, raw customer/order/product records, addresses, phones, raw emails, full server
 * environment, secrets, tokens, cookies, nonces, or raw headers.
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

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/events',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_events'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => self::limit_arg(),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/events/test',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_event_test'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => array(
                        'event_type' => array(
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ),
                    ),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/events/clear',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_event_clear'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/webhook-config',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_webhook_config'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/webhook-config/local-queue-only',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_webhook_local_queue_only'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/webhook-config/disable',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_webhook_disable'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/actions',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_actions'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/actions/request',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_action_request'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => array(
                        'action' => array(
                            'required'          => false,
                            'type'              => 'string',
                            'sanitize_callback' => 'sanitize_text_field',
                        ),
                    ),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/audit',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_audit'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => self::limit_arg(),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/sync/package',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_sync_package'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                    'args'                => self::limit_arg(),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/sync/preview',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_sync_preview'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/delivery',
                array(
                    'methods'             => 'GET',
                    'callback'            => array(__CLASS__, 'get_delivery'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/delivery/local-preview-only',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_delivery_local_preview_only'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
                )
            );

            register_rest_route(
                WCOS_REST_NAMESPACE,
                '/delivery/disable',
                array(
                    'methods'             => 'POST',
                    'callback'            => array(__CLASS__, 'post_delivery_disable'),
                    'permission_callback' => array(__CLASS__, 'permission_check'),
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
         * GET /wcos/v1/events — recent local event queue (summary-only).
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function get_events($request) {
            $limit = self::read_limit($request);
            $data  = array(
                'bridge' => WCOS_Event_Bridge::get_event_bridge_status(),
                'events' => WCOS_Event_Store::list_events($limit),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * POST /wcos/v1/events/test — enqueue a synthetic, PII-free test event locally.
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function post_event_test($request) {
            $event_type = 'order.created';
            if (is_object($request) && method_exists($request, 'get_param')) {
                $param = $request->get_param('event_type');
                if (is_string($param) && $param !== '') {
                    $event_type = $param;
                }
            }
            $envelope = WCOS_Event_Bridge::record_test_event($event_type);
            $data     = array(
                'queued' => true,
                'event'  => $envelope,
                'queue'  => WCOS_Event_Store::get_queue_summary(),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * POST /wcos/v1/events/clear — clear the local event queue.
         *
         * @return mixed REST response.
         */
        public static function post_event_clear() {
            WCOS_Event_Store::clear_events();
            WCOS_Audit::add_entry('event.queue_cleared', 'event', null, array('source' => 'rest'));

            return rest_ensure_response(
                WCOS_Redaction::redact_array(array('cleared' => true, 'queue' => WCOS_Event_Store::get_queue_summary()))
            );
        }

        /**
         * GET /wcos/v1/webhook-config — non-secret webhook delivery placeholder summary.
         *
         * @return mixed REST response.
         */
        public static function get_webhook_config() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Webhook_Config::get_config_summary())
            );
        }

        /**
         * POST /wcos/v1/webhook-config/local-queue-only.
         *
         * @return mixed REST response.
         */
        public static function post_webhook_local_queue_only() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Webhook_Config::mark_local_queue_only())
            );
        }

        /**
         * POST /wcos/v1/webhook-config/disable.
         *
         * @return mixed REST response.
         */
        public static function post_webhook_disable() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Webhook_Config::disable_delivery())
            );
        }

        /**
         * GET /wcos/v1/actions — list controlled-action intents (all disabled).
         *
         * @return mixed REST response.
         */
        public static function get_actions() {
            $data = array(
                'mutations_enabled' => false,
                'actions'           => WCOS_Controlled_Actions::list_supported_actions(),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * POST /wcos/v1/actions/request — placeholder; always disabled, never mutates.
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function post_action_request($request) {
            $action = '';
            if (is_object($request) && method_exists($request, 'get_param')) {
                $param = $request->get_param('action');
                if (is_string($param)) {
                    $action = $param;
                }
            }
            WCOS_Audit::add_entry('controlled_action.requested', 'controlled_action', $action, array('action' => $action));
            $result = WCOS_Controlled_Actions::request_action_placeholder($action, array());
            WCOS_Audit::add_entry('controlled_action.rejected', 'controlled_action', $action, array('action' => $action, 'reason' => $result['reason']));

            return rest_ensure_response(WCOS_Redaction::redact_array($result));
        }

        /**
         * GET /wcos/v1/audit — recent local audit entries (summary-only).
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function get_audit($request) {
            $limit = self::read_limit($request);
            $data  = array(
                'summary' => WCOS_Audit::get_summary(),
                'entries' => WCOS_Audit::list_entries($limit),
            );

            return rest_ensure_response(WCOS_Redaction::redact_array($data));
        }

        /**
         * GET /wcos/v1/sync/package — the redacted, summary-only read-only sync package.
         *
         * @param mixed $request REST request.
         * @return mixed REST response.
         */
        public static function get_sync_package($request) {
            $limit = self::read_limit($request);

            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Sync_Package::build_package($limit))
            );
        }

        /**
         * GET /wcos/v1/sync/preview — local delivery preview (nothing is sent).
         *
         * @return mixed REST response.
         */
        public static function get_sync_preview() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Delivery::build_preview_payload())
            );
        }

        /**
         * GET /wcos/v1/delivery — non-secret delivery summary (no URL, no secret).
         *
         * @return mixed REST response.
         */
        public static function get_delivery() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Delivery::get_delivery_summary())
            );
        }

        /**
         * POST /wcos/v1/delivery/local-preview-only.
         *
         * @return mixed REST response.
         */
        public static function post_delivery_local_preview_only() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Delivery::mark_local_preview_only())
            );
        }

        /**
         * POST /wcos/v1/delivery/disable.
         *
         * @return mixed REST response.
         */
        public static function post_delivery_disable() {
            return rest_ensure_response(
                WCOS_Redaction::redact_array(WCOS_Delivery::disable_delivery())
            );
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
