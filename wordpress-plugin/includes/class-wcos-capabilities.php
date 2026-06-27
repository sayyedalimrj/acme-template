<?php
/**
 * Capabilities helper (WCOS_Capabilities).
 *
 * Thin wrapper over WordPress capability checks plus a static, non-secret summary of the
 * companion plugin's read capabilities and reserved (disabled-by-default) write capabilities.
 * No real RBAC beyond WordPress `current_user_can`. Names mirror the TypeScript
 * capabilities contract (src/capabilities-contract.ts) by convention.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Capabilities')) {
    /**
     * Capability utilities.
     */
    final class WCOS_Capabilities {

        /**
         * WordPress capability required to manage the plugin / read its admin REST endpoints.
         *
         * @return string
         */
        public static function required_admin_capability() {
            return defined('WCOS_REQUIRED_CAPABILITY') ? WCOS_REQUIRED_CAPABILITY : 'manage_options';
        }

        /** @return bool */
        public static function current_user_can_manage() {
            if (!function_exists('current_user_can')) {
                return false;
            }
            return current_user_can('manage_woocommerce') || current_user_can('manage_options');
        }

        /**
         * Plugin-scoped capabilities. Every one maps to the required admin capability
         * (manage_options) for now — this is intentional until real RBAC exists. Reserved
         * mutation capabilities are deliberately NOT included and remain disabled.
         *
         * @return string[]
         */
        public static function plugin_capabilities() {
            return array(
                'view_connection_status',
                'manage_local_connection_state',
                'view_woocommerce_summary',
                'view_woocommerce_products_summary',
                'view_woocommerce_orders_summary',
                'view_woocommerce_customers_summary',
                'view_event_queue',
                'manage_event_queue',
                'view_webhook_config',
                'manage_webhook_config',
                'view_controlled_actions',
                'request_controlled_action_placeholder',
                'view_audit_log',
                'manage_audit_log',
            );
        }

        /**
         * Whether the current user is granted a plugin capability. All plugin capabilities map
         * to the WordPress admin capability (manage_options) in this phase.
         *
         * @param string $capability Plugin capability name.
         * @return bool
         */
        public static function current_user_can($capability) {
            // Unknown capabilities are denied by default.
            if (!in_array($capability, self::plugin_capabilities(), true)) {
                return false;
            }

            return self::current_user_can_manage();
        }

        /**
         * Read capabilities the companion plugin will (later) serve. Detection/summary only —
         * none of these are active or grant any external access in this skeleton.
         *
         * @return string[]
         */
        public static function read_capabilities() {
            return array(
                'read_products',
                'read_orders',
                'read_customers',
                'read_reports',
                'receive_webhooks',
                'site_health',
                'sync_events',
            );
        }

        /**
         * Reserved write/notification capabilities. DISABLED BY DEFAULT in this phase and never
         * granted by the runtime skeleton.
         *
         * @return string[]
         */
        public static function reserved_later_capabilities() {
            return array(
                'mutate_products_later',
                'mutate_orders_later',
                'send_notifications_later',
            );
        }

        /**
         * Whether a capability is enabled by default in the current phase.
         *
         * @param string $capability Capability name.
         * @return bool
         */
        public static function is_capability_enabled_by_default($capability) {
            return in_array($capability, self::read_capabilities(), true);
        }

        /**
         * Non-secret capability summary for status/admin output.
         *
         * @return array<int,array<string,mixed>>
         */
        public static function capability_summary() {
            $summary = array();

            foreach (self::read_capabilities() as $cap) {
                $summary[] = array(
                    'capability'         => $cap,
                    'enabled_by_default' => true,
                    'status'             => 'available_later',
                );
            }

            foreach (self::reserved_later_capabilities() as $cap) {
                $summary[] = array(
                    'capability'         => $cap,
                    'enabled_by_default' => false,
                    'status'             => 'reserved_disabled',
                );
            }

            return $summary;
        }
    }
}
