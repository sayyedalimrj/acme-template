<?php
/**
 * Read-only sync package builder (WCOS_Sync_Package).
 *
 * Composes a single redacted, summary-only package from the existing local modules (site
 * identity, connection, WooCommerce store summary, product/order/customer summaries, event
 * queue summary, health). It NEVER sends anything anywhere — building a package is purely
 * local. The package is what a FUTURE delivery step would sign and POST to the backend.
 *
 * Hard rules: summary-only, small caps, no raw Woo objects, no raw customer email/phone/
 * address, no billing/shipping, no payment data, no order notes, no raw meta, no secrets, no
 * mutation data. The whole package is passed through WCOS_Redaction as defense-in-depth.
 * See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Sync_Package')) {
    /**
     * Local, read-only sync package builder.
     */
    final class WCOS_Sync_Package {

        /** Schema version (kept compatible with the backend `PLUGIN_SYNC_SCHEMA_VERSION`). */
        const SCHEMA_VERSION = 'wcos.sync.v1';

        /** Max records included per resource list in a package. */
        const MAX_RECORDS = 10;

        /** Max recent events embedded in a package. */
        const MAX_EVENTS = 10;

        /**
         * Clamp a record limit to [1, MAX_RECORDS].
         *
         * @param mixed $limit Requested limit.
         * @return int
         */
        private static function clamp($limit) {
            if (!is_numeric($limit)) {
                return self::MAX_RECORDS;
            }
            $limit = (int) $limit;
            if ($limit < 1) {
                return 1;
            }
            if ($limit > self::MAX_RECORDS) {
                return self::MAX_RECORDS;
            }

            return $limit;
        }

        /**
         * Build the full redacted, summary-only read-only sync package. Local only.
         *
         * @param int $limit Max records per resource list (clamped to MAX_RECORDS).
         * @return array<string,mixed>
         */
        public static function build_package($limit = self::MAX_RECORDS) {
            $limit      = self::clamp($limit);
            $connection = WCOS_Connection::get_connection_summary();
            $identity   = isset($connection['site_identity']) ? $connection['site_identity'] : array();

            $package = array(
                'schema_version' => self::SCHEMA_VERSION,
                'generated_at'   => function_exists('current_time') ? current_time('c') : gmdate('c'),
                'source'         => array(
                    'plugin'         => 'wordpress-commerce-os-companion',
                    'plugin_version' => defined('WCOS_VERSION') ? WCOS_VERSION : '',
                    'site_url'       => isset($identity['site_url']) ? $identity['site_url'] : '',
                    'home_url'       => isset($identity['home_url']) ? $identity['home_url'] : '',
                ),
                'connection'     => array(
                    'site_id'           => isset($connection['site_id']) ? $connection['site_id'] : '',
                    'tenant_id'         => isset($connection['tenant_id']) ? $connection['tenant_id'] : '',
                    'status'            => isset($connection['status']) ? $connection['status'] : '',
                    'mode'              => isset($connection['mode']) ? $connection['mode'] : '',
                    'backend_connected' => false,
                    'site_identity'     => $identity,
                ),
                'store_summary'  => WCOS_Read_Bridge::get_store_summary(),
                'resources'      => array(
                    'products'  => WCOS_Read_Bridge::get_products_summary($limit),
                    'orders'    => WCOS_Read_Bridge::get_orders_summary($limit),
                    'customers' => WCOS_Read_Bridge::get_customers_summary($limit),
                ),
                'events'         => array(
                    'queue'  => WCOS_Event_Store::get_queue_summary(),
                    'recent' => WCOS_Event_Store::list_events(self::MAX_EVENTS),
                ),
                'health'         => array(
                    'overall' => self::health_overall(),
                ),
                'delivery'       => WCOS_Delivery::get_delivery_summary(),
                // Placeholder only — no real secret/signature material is ever included. Named
                // "integrity" (not "signature") so the defense-in-depth redactor does not
                // flatten this structured status block.
                'integrity'      => array(
                    'status' => 'not_configured',
                    'method' => 'none',
                ),
            );

            // Defense-in-depth: redact the entire package before returning.
            return WCOS_Redaction::redact_array($package);
        }

        /**
         * Compact non-secret package summary (counts + timestamps) for admin display.
         *
         * @return array<string,mixed>
         */
        public static function get_package_summary() {
            $counts = WCOS_WooCommerce::get_counts_summary();
            $queue  = WCOS_Event_Store::get_queue_summary();

            return array(
                'schema_version' => self::SCHEMA_VERSION,
                'generated_at'   => function_exists('current_time') ? current_time('c') : gmdate('c'),
                'product_count'  => isset($counts['product_count']) ? $counts['product_count'] : null,
                'order_count'    => isset($counts['order_count']) ? $counts['order_count'] : null,
                'customer_count' => isset($counts['customer_count']) ? $counts['customer_count'] : null,
                'event_count'    => isset($queue['count']) ? $queue['count'] : 0,
                'woocommerce_active' => WCOS_WooCommerce::is_active(),
            );
        }

        /**
         * Overall health status string (safe).
         *
         * @return string
         */
        private static function health_overall() {
            $health = WCOS_Health::run();

            return isset($health['overall']) ? (string) $health['overall'] : 'unknown';
        }
    }
}
