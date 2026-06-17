<?php
/**
 * Controlled actions foundation (WCOS_Controlled_Actions).
 *
 * Defines FUTURE safe action intents and validates permissions, but performs NO mutations.
 * Every action is DISABLED in this phase and returns
 * `status = disabled`, `reason = backend_permission_audit_required`,
 * `mutation_performed = false`. This module must NEVER call save(), update_status(),
 * set_stock_quantity(), wc_update_product_stock(), update_post_meta(), wp_insert_post(),
 * wp_delete_post(), or any WooCommerce setter. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Controlled_Actions')) {
    /**
     * Disabled-by-default controlled action intents.
     */
    final class WCOS_Controlled_Actions {

        const REASON_DISABLED = 'backend_permission_audit_required';

        /**
         * Supported future action intents. All are disabled in this phase.
         *
         * @return string[]
         */
        public static function action_intents() {
            return array(
                'update_product_stock_later',
                'update_product_price_later',
                'update_product_status_later',
                'update_order_status_later',
                'add_order_note_later',
                'add_tracking_number_later',
                'mark_order_fulfilled_later',
                'update_customer_tag_later',
                'send_notification_later',
            );
        }

        /**
         * List supported actions with their (disabled) status.
         *
         * @return array<int,array<string,mixed>>
         */
        public static function list_supported_actions() {
            $out = array();
            foreach (self::action_intents() as $action) {
                $out[] = array(
                    'action'             => $action,
                    'status'             => 'disabled',
                    'reason'             => self::REASON_DISABLED,
                    'mutation_performed' => false,
                );
            }

            return $out;
        }

        /**
         * Status for a single action.
         *
         * @param string $action Action name.
         * @return array<string,mixed>
         */
        public static function get_action_status($action) {
            if (!in_array($action, self::action_intents(), true)) {
                return array(
                    'action'             => is_string($action) ? $action : '',
                    'status'             => 'unknown',
                    'reason'             => 'unsupported_action',
                    'mutation_performed' => false,
                );
            }

            return array(
                'action'             => $action,
                'status'             => 'disabled',
                'reason'             => self::REASON_DISABLED,
                'mutation_performed' => false,
            );
        }

        /**
         * Validate an action intent. Always invalid in this phase (disabled), but reports
         * whether the action is known and the payload is well-formed. Performs NO mutation.
         *
         * @param string $action  Action name.
         * @param mixed  $payload Candidate payload.
         * @return array<string,mixed>
         */
        public static function validate_action_intent($action, $payload) {
            $known        = in_array($action, self::action_intents(), true);
            $payload_ok   = is_array($payload) || $payload === null;

            return array(
                'action'             => is_string($action) ? $action : '',
                'valid'              => false,
                'known_action'       => $known,
                'payload_ok'         => $payload_ok,
                'reason'             => $known ? self::REASON_DISABLED : 'unsupported_action',
                'mutation_performed' => false,
            );
        }

        /**
         * Request an action. ALWAYS returns disabled and performs NO mutation. Pure (no side
         * effects); audit logging is handled by the caller.
         *
         * @param string $action  Action name.
         * @param mixed  $payload Candidate payload (ignored; never applied).
         * @return array<string,mixed>
         */
        public static function request_action_placeholder($action, $payload = array()) {
            unset($payload); // never applied — no mutations in this phase.
            $known = in_array($action, self::action_intents(), true);

            return array(
                'action'             => is_string($action) ? $action : '',
                'status'             => 'disabled',
                'reason'             => $known ? self::REASON_DISABLED : 'unsupported_action',
                'mutation_performed' => false,
            );
        }
    }
}
