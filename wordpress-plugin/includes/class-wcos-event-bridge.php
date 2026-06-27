<?php
/**
 * Local event bridge (WCOS_Event_Bridge).
 *
 * Defines + captures SUMMARY-ONLY local events and prepares envelopes for FUTURE backend
 * delivery. It never sends anything externally, never mutates data, and never stores raw
 * payloads. Optional local WooCommerce hooks capture summary-only events into the local
 * queue; every callback is guarded and wrapped in try/catch. Event types are kept compatible
 * with the backend `WebhookEventType` taxonomy. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Event_Bridge')) {
    /**
     * Local, summary-only event bridge.
     */
    final class WCOS_Event_Bridge {

        /**
         * Supported event types. `*_later` types are reserved and not emitted in this phase.
         *
         * @return string[]
         */
        public static function get_supported_event_types() {
            return array(
                'order.created',
                'order.updated',
                'product.created',
                'product.updated',
                'product.stock_changed',
                'customer.created',
                'customer.updated',
                'coupon.created',
                'coupon.updated',
                'cart.abandoned_later',
                'search.performed_later',
                'product_interest.created_later',
                'back_in_stock.subscribed_later',
                'unknown',
            );
        }

        /**
         * Map an event type to a coarse resource type.
         *
         * @param string $event_type Event type.
         * @return string
         */
        private static function resource_type_for($event_type) {
            $map = array(
                'order.created'                   => 'order',
                'order.updated'                   => 'order',
                'product.created'                 => 'product',
                'product.updated'                 => 'product',
                'product.stock_changed'           => 'product',
                'customer.created'                => 'customer',
                'customer.updated'                => 'customer',
                'coupon.created'                  => 'coupon',
                'coupon.updated'                  => 'coupon',
                'cart.abandoned_later'            => 'cart',
                'search.performed_later'          => 'search',
                'product_interest.created_later'  => 'product',
                'back_in_stock.subscribed_later'  => 'customer',
            );

            return isset($map[$event_type]) ? $map[$event_type] : 'unknown';
        }

        /**
         * Normalize an event type to a supported value (falls back to "unknown").
         *
         * @param string $event_type Candidate type.
         * @return string
         */
        private static function normalize_type($event_type) {
            return in_array($event_type, self::get_supported_event_types(), true) ? $event_type : 'unknown';
        }

        /**
         * Build a summary-only event envelope. Never includes raw objects/PII/secrets and is
         * marked delivery_status = local_only (nothing is sent anywhere).
         *
         * @param string              $event_type  Event type.
         * @param string|int          $resource_id Non-secret resource reference.
         * @param array<string,mixed> $summary     Pre-extracted, non-secret summary.
         * @return array<string,mixed>
         */
        public static function build_event_envelope($event_type, $resource_id, $summary = array()) {
            $event_type  = self::normalize_type($event_type);
            $occurred_at = function_exists('current_time') ? current_time('c') : gmdate('c');
            $event_id    = 'evt_local_' . (function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : substr(md5($event_type . microtime(true)), 0, 20));

            return array(
                'event_id'          => $event_id,
                'event_type'        => $event_type,
                'resource_type'     => self::resource_type_for($event_type),
                'resource_id'       => (string) $resource_id,
                'occurred_at'       => $occurred_at,
                'site_identity'     => WCOS_Connection::get_site_identity_summary(),
                'payload_summary'   => WCOS_Event_Sanitizer::sanitize_event_summary($event_type, $summary),
                'delivery_status'   => 'local_only',
                'idempotency_key'   => WCOS_Event_Sanitizer::build_idempotency_key($event_type, $resource_id, $occurred_at),
                'redaction_applied' => true,
            );
        }

        /**
         * Build a synthetic, PII-free test event envelope (does not store it).
         *
         * @param string $event_type Event type.
         * @return array<string,mixed>
         */
        public static function build_test_event($event_type) {
            $event_type  = self::normalize_type($event_type);
            $resource_id = 'test_' . substr(md5($event_type . microtime(true)), 0, 8);
            $summaries   = array(
                'order'    => array('status' => 'processing', 'currency' => 'USD', 'total' => '0.00', 'item_count' => 1),
                'product'  => array('name' => 'Test product', 'sku' => 'TEST-SKU', 'status' => 'publish', 'stock_status' => 'instock'),
                'customer' => array('label' => 'Customer #0', 'order_count' => 0),
                'coupon'   => array('status' => 'publish'),
            );
            $resource = self::resource_type_for($event_type);
            $summary  = isset($summaries[$resource]) ? $summaries[$resource] : array('note' => 'test');

            return self::build_event_envelope($event_type, $resource_id, $summary);
        }

        /**
         * Build a test event, store it locally, and audit it.
         *
         * @param string $event_type Event type.
         * @return array<string,mixed> The stored envelope.
         */
        public static function record_test_event($event_type) {
            $envelope = self::build_test_event($event_type);
            WCOS_Event_Store::add_event($envelope);
            WCOS_Audit::add_entry('event.queued', 'event', $envelope['event_id'], array('event_type' => $envelope['event_type'], 'source' => 'test'));

            return $envelope;
        }

        /**
         * Bridge status (local queue only; no external delivery).
         *
         * @return array<string,mixed>
         */
        public static function get_event_bridge_status() {
            return array(
                'status'               => 'local_queue_only',
                'external_delivery'    => false,
                'supported_event_types' => self::get_supported_event_types(),
                'queue'                => WCOS_Event_Store::get_queue_summary(),
                'woocommerce_active'   => WCOS_WooCommerce::is_active(),
            );
        }

        /**
         * Register optional, low-risk local WooCommerce hooks that capture summary-only events.
         * Callbacks are guarded (WooCommerce active) and wrapped in try/catch; they never
         * mutate data, make network calls, or store raw payloads.
         *
         * @return void
         */
        public static function register_hooks() {
            add_action('woocommerce_new_order', array(__CLASS__, 'on_new_order'), 10, 1);
            add_action('woocommerce_order_status_changed', array(__CLASS__, 'on_order_status_changed'), 10, 3);
            add_action('woocommerce_product_set_stock', array(__CLASS__, 'on_product_stock'), 10, 1);
            add_action('save_post_product', array(__CLASS__, 'on_product_save'), 20, 1);
            add_action('before_delete_post', array(__CLASS__, 'on_product_delete'), 10, 1);
            add_action('save_post_shop_coupon', array(__CLASS__, 'on_coupon_save'), 20, 1);
            add_action('profile_update', array(__CLASS__, 'on_customer_update'), 10, 1);
            add_action('user_register', array(__CLASS__, 'on_user_register'), 10, 1);
        }

        /** @return void */
        private static function enqueue_and_schedule($event_type, $resource_id, $summary = array()) {
            WCOS_Event_Store::add_event(self::build_event_envelope($event_type, $resource_id, $summary));
            if (class_exists('WCOS_Sync_Engine') && WCOS_Settings::is_configured()) {
                WCOS_Sync_Engine::schedule_event_delivery(5);
            }
        }

        /**
         * Capture order.created (summary-only).
         *
         * @param int $order_id Order id.
         * @return void
         */
        public static function on_new_order($order_id) {
            if (!WCOS_WooCommerce::is_active() || !function_exists('wc_get_order')) {
                return;
            }
            try {
                $order   = wc_get_order($order_id);
                $summary = WCOS_Event_Sanitizer::sanitize_order_event_summary($order);
                self::enqueue_and_schedule('order.created', (string) $order_id, $summary);
            } catch (\Throwable $e) {
                // Swallow safely — event capture must never disrupt the store.
                return;
            }
        }

        /**
         * Capture order.updated on status change (summary-only, no PII).
         *
         * @param int    $order_id Order id.
         * @param string $from     Previous status.
         * @param string $to       New status.
         * @return void
         */
        public static function on_order_status_changed($order_id, $from, $to) {
            if (!WCOS_WooCommerce::is_active()) {
                return;
            }
            try {
                $summary = array(
                    'status_from' => is_string($from) ? $from : '',
                    'status_to'   => is_string($to) ? $to : '',
                );
                self::enqueue_and_schedule('order.updated', (string) $order_id, $summary);
            } catch (\Throwable $e) {
                return;
            }
        }

        /**
         * Capture product.stock_changed (summary-only).
         *
         * @param mixed $product WC_Product.
         * @return void
         */
        public static function on_product_stock($product) {
            if (!WCOS_WooCommerce::is_active()) {
                return;
            }
            try {
                $resource_id = is_object($product) && method_exists($product, 'get_id') ? (string) $product->get_id() : '';
                $summary     = WCOS_Event_Sanitizer::sanitize_product_event_summary($product);
                self::enqueue_and_schedule('product.stock_changed', $resource_id, $summary);
            } catch (\Throwable $e) {
                return;
            }
        }

        /**
         * Capture customer.created on user registration (generic label only).
         *
         * @param int $user_id User id.
         * @return void
         */
        public static function on_user_register($user_id) {
            if (!WCOS_WooCommerce::is_active()) {
                return;
            }
            try {
                $summary = array('label' => 'Customer #' . (int) $user_id);
                self::enqueue_and_schedule('customer.created', (string) $user_id, $summary);
            } catch (\Throwable $e) {
                return;
            }
        }

        /** @param int $post_id Post id. */
        public static function on_product_save($post_id) {
            if (!WCOS_WooCommerce::is_active() || get_post_type($post_id) !== 'product') {
                return;
            }
            try {
                $product = function_exists('wc_get_product') ? wc_get_product($post_id) : null;
                $summary = WCOS_Event_Sanitizer::sanitize_product_event_summary($product);
                $type    = get_post_status($post_id) === 'auto-draft' ? 'product.created' : 'product.updated';
                self::enqueue_and_schedule($type, (string) $post_id, $summary);
            } catch (\Throwable $e) {
                return;
            }
        }

        /** @param int $post_id Post id. */
        public static function on_product_delete($post_id) {
            if (get_post_type($post_id) !== 'product') {
                return;
            }
            self::enqueue_and_schedule('product.updated', (string) $post_id, array('status' => 'deleted'));
        }

        /** @param int $post_id Post id. */
        public static function on_coupon_save($post_id) {
            if (get_post_type($post_id) !== 'shop_coupon') {
                return;
            }
            self::enqueue_and_schedule('coupon.updated', (string) $post_id, array('status' => get_post_status($post_id)));
        }

        /** @param int $user_id User id. */
        public static function on_customer_update($user_id) {
            if (!WCOS_WooCommerce::is_active()) {
                return;
            }
            $user = get_userdata($user_id);
            if (!$user || !in_array('customer', (array) $user->roles, true)) {
                return;
            }
            self::enqueue_and_schedule('customer.updated', (string) $user_id, array('label' => 'Customer #' . (int) $user_id));
        }
    }
}
