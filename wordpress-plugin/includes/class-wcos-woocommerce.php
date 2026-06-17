<?php
/**
 * WooCommerce internal module (WCOS_WooCommerce).
 *
 * WooCommerce support is an INTERNAL module of the single companion plugin — NOT a separate
 * plugin. This module performs passive detection only:
 *   - detects whether WooCommerce is active (class_exists),
 *   - detects the WooCommerce version if exposed via the WC_VERSION constant,
 *   - reports a read-only capability summary (all "later").
 *
 * It NEVER calls the WooCommerce REST API, NEVER creates API keys, NEVER reads order/
 * customer/product data, and NEVER registers webhooks. WooCommerce is optional: the plugin
 * activates without it and reports it as a warning (not fatal).
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
         * Coarse status: "active" or "missing".
         *
         * @return string
         */
        public static function status() {
            return self::is_active() ? 'active' : 'missing';
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
