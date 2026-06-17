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

        /**
         * Whether the current user may manage the plugin.
         *
         * @return bool
         */
        public static function current_user_can_manage() {
            return function_exists('current_user_can')
                && current_user_can(self::required_admin_capability());
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
