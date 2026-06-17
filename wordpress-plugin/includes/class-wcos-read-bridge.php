<?php
/**
 * Read-only WooCommerce bridge (WCOS_Read_Bridge).
 *
 * Reads LOCAL WooCommerce data (only when WooCommerce is active) and returns small, redacted,
 * PII-minimized SUMMARIES via WCOS_Data_Sanitizer. It proves the plugin can read store data
 * safely without sending it anywhere.
 *
 * Hard rules: read-only only (no save/update/delete), summaries only, a small max limit, no
 * raw meta, no addresses/phone/raw email/payment details/order notes, no tokens, no secrets,
 * no network calls. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Read_Bridge')) {
    /**
     * Local, read-only WooCommerce summaries.
     */
    final class WCOS_Read_Bridge {

        /** Hard maximum number of rows any summary will ever return. */
        const MAX_LIMIT = 20;

        /** Default number of rows. */
        const DEFAULT_LIMIT = 10;

        /**
         * Clamp a requested limit to [1, MAX_LIMIT], defaulting when invalid.
         *
         * @param mixed $limit Requested limit.
         * @return int
         */
        public static function clamp_limit($limit) {
            if (!is_numeric($limit)) {
                return self::DEFAULT_LIMIT;
            }
            $limit = (int) $limit;
            if ($limit < 1) {
                return 1;
            }
            if ($limit > self::MAX_LIMIT) {
                return self::MAX_LIMIT;
            }

            return $limit;
        }

        /**
         * Which read summaries are currently available.
         *
         * @return array<string,bool>
         */
        public static function get_bridge_capabilities() {
            return array(
                'read_products'  => WCOS_WooCommerce::can_read_products(),
                'read_orders'    => WCOS_WooCommerce::can_read_orders(),
                'read_customers' => WCOS_WooCommerce::can_read_customers(),
                'read_reports'   => WCOS_WooCommerce::can_read_reports(),
            );
        }

        /**
         * Product summaries (read-only). Empty array when unavailable.
         *
         * @param int $limit Max rows (clamped to MAX_LIMIT).
         * @return array<int,array<string,mixed>>
         */
        public static function get_products_summary($limit = self::DEFAULT_LIMIT) {
            if (!WCOS_WooCommerce::can_read_products() || !function_exists('wc_get_products')) {
                return array();
            }
            $limit    = self::clamp_limit($limit);
            $products = wc_get_products(
                array(
                    'limit'   => $limit,
                    'status'  => 'publish',
                    'orderby' => 'date',
                    'order'   => 'DESC',
                    'return'  => 'objects',
                )
            );

            $out = array();
            if (is_array($products)) {
                foreach ($products as $product) {
                    $summary = WCOS_Data_Sanitizer::sanitize_product_summary($product);
                    if ($summary !== null) {
                        $out[] = $summary;
                    }
                }
            }

            return $out;
        }

        /**
         * Order summaries (read-only). Empty array when unavailable.
         *
         * @param int $limit Max rows (clamped to MAX_LIMIT).
         * @return array<int,array<string,mixed>>
         */
        public static function get_orders_summary($limit = self::DEFAULT_LIMIT) {
            if (!WCOS_WooCommerce::can_read_orders() || !function_exists('wc_get_orders')) {
                return array();
            }
            $limit  = self::clamp_limit($limit);
            $orders = wc_get_orders(
                array(
                    'limit'   => $limit,
                    'orderby' => 'date',
                    'order'   => 'DESC',
                )
            );

            $out = array();
            if (is_array($orders)) {
                foreach ($orders as $order) {
                    $summary = WCOS_Data_Sanitizer::sanitize_order_summary($order);
                    if ($summary !== null) {
                        $out[] = $summary;
                    }
                }
            }

            return $out;
        }

        /**
         * Customer summaries (read-only, generic labels only). Empty array when unavailable.
         *
         * @param int $limit Max rows (clamped to MAX_LIMIT).
         * @return array<int,array<string,mixed>>
         */
        public static function get_customers_summary($limit = self::DEFAULT_LIMIT) {
            if (!WCOS_WooCommerce::can_read_customers() || !function_exists('get_users')) {
                return array();
            }
            $limit = self::clamp_limit($limit);
            $users = get_users(
                array(
                    'role'   => 'customer',
                    'number' => $limit,
                    'fields' => array('ID'),
                )
            );

            $out = array();
            if (is_array($users)) {
                foreach ($users as $user) {
                    $user_id = is_object($user) && isset($user->ID) ? (int) $user->ID : (int) $user;
                    if ($user_id <= 0) {
                        continue;
                    }
                    if (class_exists('WC_Customer')) {
                        $customer = new WC_Customer($user_id);
                        $summary  = WCOS_Data_Sanitizer::sanitize_customer_summary($customer);
                    } else {
                        $summary = WCOS_Data_Sanitizer::sanitize_customer_summary(array('id' => $user_id));
                    }
                    if ($summary !== null) {
                        $out[] = $summary;
                    }
                }
            }

            return $out;
        }

        /**
         * Store-level summary: counts, capabilities, and a reports placeholder. No PII.
         *
         * @return array<string,mixed>
         */
        public static function get_store_summary() {
            return array(
                'woocommerce_active'  => WCOS_WooCommerce::is_active(),
                'woocommerce_version' => WCOS_WooCommerce::version(),
                'counts'              => WCOS_WooCommerce::get_counts_summary(),
                'capabilities'        => self::get_bridge_capabilities(),
                'reports'             => array('status' => 'placeholder_later'),
            );
        }
    }
}
