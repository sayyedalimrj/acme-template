<?php
/**
 * WooCommerce internal module (WCOS_WooCommerce).
 *
 * WooCommerce support is an INTERNAL module of the single companion plugin — NOT a separate
 * plugin. This module performs passive detection plus aggregate, read-only summaries:
 *   - detects whether WooCommerce is active (class_exists),
 *   - detects the WooCommerce version if exposed via the WC_VERSION constant,
 *   - reports read-capability readiness and aggregate counts.
 *
 * It NEVER calls the WooCommerce REST API, NEVER creates API keys, NEVER reads raw order/
 * customer/product records or PII (only aggregate counts), and NEVER registers webhooks or
 * performs writes. WooCommerce is optional: the plugin activates without it and reports it as
 * a warning (not fatal). Row-level read summaries live in WCOS_Read_Bridge.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_WooCommerce')) {
    /**
     * Passive WooCommerce detection + capability summary.
     */
    final class WCOS_WooCommerce {

        /**
         * Whether WooCommerce is active. Uses the standard, passive class check — no REST calls.
         *
         * @return bool
         */
        public static function is_active() {
            return class_exists('WooCommerce');
        }

        /**
         * Detected WooCommerce version, if exposed. Read from the WC_VERSION constant only;
         * we deliberately avoid invoking WooCommerce internals.
         *
         * @return string|null
         */
        public static function version() {
            if (defined('WC_VERSION') && is_string(WC_VERSION) && WC_VERSION !== '') {
                return WC_VERSION;
            }

            return null;
        }

        /**
         * Alias of version() for naming symmetry with the read bridge.
         *
         * @return string|null
         */
        public static function get_version() {
            return self::version();
        }

        /**
         * Coarse status: "active" or "missing".
         *
         * @return string
         */
        public static function status() {
            return self::is_active() ? 'active' : 'missing';
        }

        /**
         * Whether product summaries can be read locally (WooCommerce active + reader present).
         *
         * @return bool
         */
        public static function can_read_products() {
            return self::is_active() && function_exists('wc_get_products');
        }

        /**
         * Whether order summaries can be read locally.
         *
         * @return bool
         */
        public static function can_read_orders() {
            return self::is_active() && function_exists('wc_get_orders');
        }

        /**
         * Whether customer summaries can be read locally.
         *
         * @return bool
         */
        public static function can_read_customers() {
            return self::is_active() && function_exists('get_users');
        }

        /**
         * Whether report summaries can be read locally. Placeholder readiness only — the
         * report summary itself stays a placeholder in this phase.
         *
         * @return bool
         */
        public static function can_read_reports() {
            return self::is_active();
        }

        /**
         * Whether the plugin can emit local WooCommerce events (WooCommerce active).
         * Capture is summary-only and local; no delivery, no mutation.
         *
         * @return bool
         */
        public static function can_emit_events() {
            return self::is_active();
        }

        /**
         * Alias of capability_summary().
         *
         * @return array<int,array<string,string>>
         */
        public static function get_capability_summary() {
            return self::capability_summary();
        }

        /**
         * Non-secret store counts (product/order/customer). Each value is sanitized to a safe
         * integer or null. Uses only read-only WordPress/WooCommerce helpers — no REST calls.
         *
         * @return array<string,int|null>
         */
        public static function get_counts_summary() {
            $product_count  = null;
            $order_count    = null;
            $customer_count = null;

            if (self::is_active()) {
                if (function_exists('wp_count_posts')) {
                    $counts = wp_count_posts('product');
                    if (is_object($counts) && isset($counts->publish)) {
                        $product_count = (int) $counts->publish;
                    }
                }

                if (function_exists('wc_get_orders')) {
                    $result = wc_get_orders(
                        array(
                            'limit'    => 1,
                            'paginate' => true,
                            'return'   => 'ids',
                        )
                    );
                    if (is_object($result) && isset($result->total)) {
                        $order_count = (int) $result->total;
                    }
                }

                if (function_exists('count_users')) {
                    $user_counts = count_users();
                    if (isset($user_counts['avail_roles']['customer'])) {
                        $customer_count = (int) $user_counts['avail_roles']['customer'];
                    }
                }
            }

            return array(
                'product_count'  => WCOS_Data_Sanitizer::sanitize_count($product_count),
                'order_count'    => WCOS_Data_Sanitizer::sanitize_count($order_count),
                'customer_count' => WCOS_Data_Sanitizer::sanitize_count($customer_count),
            );
        }

        /**
         * Read-only capability discovery summary. Detection/intent only — nothing is active.
         *
         * @return array<int,array<string,string>>
         */
        public static function capability_summary() {
            return array(
                array('capability' => 'read_products', 'status' => 'available_later'),
                array('capability' => 'read_orders', 'status' => 'available_later'),
                array('capability' => 'read_customers', 'status' => 'available_later'),
                array('capability' => 'read_reports', 'status' => 'available_later'),
                array('capability' => 'receive_webhooks', 'status' => 'later'),
            );
        }

        /**
         * Non-secret WooCommerce summary for status/admin/health output.
         *
         * @return array<string,mixed>
         */
        public static function summary() {
            return array(
                'active'       => self::is_active(),
                'status'       => self::status(),
                'version'      => self::version(),
                'capabilities' => self::capability_summary(),
            );
        }
    }
}
