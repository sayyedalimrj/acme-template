<?php
/**
 * Data sanitizer (WCOS_Data_Sanitizer).
 *
 * Converts WooCommerce objects (or plain arrays) into small, non-secret, PII-minimized
 * summaries safe for admin-only REST/admin output. NEVER returns full WooCommerce objects,
 * raw meta, addresses, phone numbers, raw emails, payment details, IPs, user agents, or order
 * notes. Missing data returns a safe null/placeholder. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Data_Sanitizer')) {
    /**
     * Summarize + mask WooCommerce data.
     */
    final class WCOS_Data_Sanitizer {

        /**
         * Read a value from either an object getter or an array key (for testability).
         *
         * @param mixed  $source    Object or array.
         * @param string $getter    Getter method name.
         * @param string $array_key Array key.
         * @param mixed  $default   Fallback.
         * @return mixed
         */
        private static function read($source, $getter, $array_key, $default = null) {
            if (is_object($source) && method_exists($source, $getter)) {
                return $source->{$getter}();
            }
            if (is_array($source) && array_key_exists($array_key, $source)) {
                return $source[$array_key];
            }

            return $default;
        }

        /**
         * Coerce a value to a safe, non-negative integer count, or null.
         *
         * @param mixed $value Value.
         * @return int|null
         */
        public static function sanitize_count($value) {
            if ($value === null || !is_numeric($value)) {
                return null;
            }
            $int = (int) $value;

            return $int < 0 ? 0 : $int;
        }

        /**
         * Coerce a value to a safe money string (2 decimals), or null. No currency symbol.
         *
         * @param mixed $value Value.
         * @return string|null
         */
        public static function sanitize_money($value) {
            if ($value === null || $value === '' || !is_numeric($value)) {
                return null;
            }

            return number_format((float) $value, 2, '.', '');
        }

        /**
         * Mask an email so it is never returned in raw form. Returns null when absent/invalid.
         *
         * @param mixed $email Email.
         * @return string|null
         */
        public static function mask_email($email) {
            if (!is_string($email) || strpos($email, '@') === false) {
                return null;
            }
            $parts  = explode('@', $email, 2);
            $local  = $parts[0];
            $domain = $parts[1];

            $masked_local = ($local !== '' ? substr($local, 0, 1) : '') . '***';

            $dot = strrpos($domain, '.');
            if ($dot !== false) {
                $name = substr($domain, 0, $dot);
                $tld  = substr($domain, $dot);
                $masked_domain = ($name !== '' ? substr($name, 0, 1) : '') . '***' . $tld;
            } else {
                $masked_domain = '***';
            }

            return $masked_local . '@' . $masked_domain;
        }

        /**
         * Mask a phone number, keeping only the last two digits. Returns null when absent.
         *
         * @param mixed $phone Phone.
         * @return string|null
         */
        public static function mask_phone($phone) {
            if (!is_string($phone) && !is_numeric($phone)) {
                return null;
            }
            $digits = preg_replace('/\D/', '', (string) $phone);
            if (!is_string($digits) || $digits === '') {
                return null;
            }

            return '••••' . substr($digits, -2);
        }

        /**
         * Coerce a value to a safe, tag-stripped string, or null.
         *
         * @param mixed $value Value.
         * @return string|null
         */
        private static function safe_string($value) {
            if ($value === null || is_array($value) || is_object($value)) {
                return null;
            }
            $value = (string) $value;
            if (function_exists('wp_strip_all_tags')) {
                return wp_strip_all_tags($value);
            }

            return strip_tags($value);
        }

        /**
         * Format a WooCommerce date getter result (WC_DateTime|DateTime|string) to Y-m-d.
         *
         * @param mixed $date Date value.
         * @return string|null
         */
        private static function safe_date($date) {
            if (is_object($date) && method_exists($date, 'date')) {
                return $date->date('Y-m-d');
            }
            if (is_string($date) && $date !== '') {
                return substr($date, 0, 10);
            }

            return null;
        }

        /**
         * Summarize a product. No raw meta. Accepts a WC_Product or a plain array.
         *
         * @param mixed $product WC_Product or array.
         * @return array<string,mixed>|null
         */
        public static function sanitize_product_summary($product) {
            if (!is_object($product) && !is_array($product)) {
                return null;
            }

            return array(
                'id'             => self::sanitize_count(self::read($product, 'get_id', 'id')),
                'name'           => self::safe_string(self::read($product, 'get_name', 'name')),
                'sku'            => self::safe_string(self::read($product, 'get_sku', 'sku')),
                'status'         => self::safe_string(self::read($product, 'get_status', 'status')),
                'stock_status'   => self::safe_string(self::read($product, 'get_stock_status', 'stock_status')),
                'stock_quantity' => self::sanitize_count(self::read($product, 'get_stock_quantity', 'stock_quantity')),
                'price'          => self::sanitize_money(self::read($product, 'get_price', 'price')),
                'type'           => self::safe_string(self::read($product, 'get_type', 'type')),
            );
        }

        /**
         * Summarize an order. No addresses, phone, email, payment details, or line items.
         * The customer is reduced to a generic, non-PII label.
         *
         * @param mixed $order WC_Order or array.
         * @return array<string,mixed>|null
         */
        public static function sanitize_order_summary($order) {
            if (!is_object($order) && !is_array($order)) {
                return null;
            }

            $customer_id = self::sanitize_count(self::read($order, 'get_customer_id', 'customer_id'));

            return array(
                'id'             => self::sanitize_count(self::read($order, 'get_id', 'id')),
                'number'         => self::safe_string(self::read($order, 'get_order_number', 'number')),
                'status'         => self::safe_string(self::read($order, 'get_status', 'status')),
                'currency'       => self::safe_string(self::read($order, 'get_currency', 'currency')),
                'total'          => self::sanitize_money(self::read($order, 'get_total', 'total')),
                'item_count'     => self::sanitize_count(self::read($order, 'get_item_count', 'item_count')),
                'created_date'   => self::safe_date(self::read($order, 'get_date_created', 'created_date')),
                'customer_label' => $customer_id ? ('Customer #' . $customer_id) : 'Guest',
            );
        }

        /**
         * Summarize a customer. Generic label only — no name, email, phone, or address.
         *
         * @param mixed $customer WC_Customer or array.
         * @return array<string,mixed>|null
         */
        public static function sanitize_customer_summary($customer) {
            if (!is_object($customer) && !is_array($customer)) {
                return null;
            }

            $id = self::sanitize_count(self::read($customer, 'get_id', 'id'));

            return array(
                'id'           => $id,
                'label'        => $id ? ('Customer #' . $id) : 'Customer',
                'order_count'  => self::sanitize_count(self::read($customer, 'get_order_count', 'order_count')),
                'total_spent'  => self::sanitize_money(self::read($customer, 'get_total_spent', 'total_spent')),
                'date_created' => self::safe_date(self::read($customer, 'get_date_created', 'date_created')),
            );
        }
    }
}
