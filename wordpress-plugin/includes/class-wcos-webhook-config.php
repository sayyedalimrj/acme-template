<?php
/**
 * Webhook delivery config placeholder (WCOS_Webhook_Config).
 *
 * Represents FUTURE backend delivery settings WITHOUT any real secret, URL, or delivery.
 * Stores only a non-secret status + a generic destination label. There is NO webhook secret,
 * signing secret, auth token, API key, or real delivery URL — and none may ever be added
 * here. Real delivery is configured later through the backend/proxy. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Webhook_Config')) {
    /**
     * Non-secret webhook delivery placeholder.
     */
    final class WCOS_Webhook_Config {

        const OPTION_STATUS = 'wcos_webhook_delivery_status';
        const OPTION_LABEL = 'wcos_webhook_destination_label';

        const STATUS_NOT_CONFIGURED = 'not_configured';
        const STATUS_LOCAL_QUEUE_ONLY = 'local_queue_only';
        const STATUS_PENDING_BACKEND_LATER = 'pending_backend_delivery_later';
        const STATUS_DELIVERY_DISABLED = 'delivery_disabled';

        /**
         * Allowed delivery statuses.
         *
         * @return string[]
         */
        public static function allowed_statuses() {
            return array(
                self::STATUS_NOT_CONFIGURED,
                self::STATUS_LOCAL_QUEUE_ONLY,
                self::STATUS_PENDING_BACKEND_LATER,
                self::STATUS_DELIVERY_DISABLED,
            );
        }

        /**
         * Current delivery status (validated).
         *
         * @return string
         */
        public static function get_delivery_status() {
            $status = get_option(self::OPTION_STATUS, self::STATUS_NOT_CONFIGURED);
            if (!is_string($status) || !in_array($status, self::allowed_statuses(), true)) {
                return self::STATUS_NOT_CONFIGURED;
            }

            return $status;
        }

        /**
         * Whether real external webhook delivery is enabled. Always false in this phase — the
         * webhook config is a non-secret placeholder and never enables delivery here.
         *
         * @return bool
         */
        public static function is_external_delivery_enabled() {
            return false;
        }

        /**
         * Non-secret config summary. There is intentionally no destination URL and no secret.
         *
         * @return array<string,mixed>
         */
        public static function get_config_summary() {
            $label = get_option(self::OPTION_LABEL, '');

            return array(
                'delivery_status'    => self::get_delivery_status(),
                'destination_label'  => is_string($label) && $label !== '' ? $label : 'not configured',
                'destination_url'    => null,
                'secret_configured'  => false,
                'external_delivery'  => false,
                'note'               => 'Real delivery will be configured later through the backend/proxy. No URL or secret is stored here.',
            );
        }

        /**
         * Persist a status (autoload disabled).
         *
         * @param string $status One of allowed_statuses().
         * @return void
         */
        private static function persist_status($status) {
            if (get_option(self::OPTION_STATUS) === false) {
                add_option(self::OPTION_STATUS, $status, '', 'no');
            } else {
                update_option(self::OPTION_STATUS, $status);
            }
        }

        /**
         * Persist the non-secret destination label (autoload disabled).
         *
         * @param string $label Generic, non-secret label.
         * @return void
         */
        private static function persist_label($label) {
            if (get_option(self::OPTION_LABEL) === false) {
                add_option(self::OPTION_LABEL, $label, '', 'no');
            } else {
                update_option(self::OPTION_LABEL, $label);
            }
        }

        /**
         * Mark "local queue only" (events stay local; nothing is delivered).
         *
         * @return array<string,mixed> Config summary.
         */
        public static function mark_local_queue_only() {
            self::persist_status(self::STATUS_LOCAL_QUEUE_ONLY);
            self::persist_label('Local queue only');
            WCOS_Audit::add_entry('webhook.delivery.placeholder.updated', 'webhook_config', null, array('delivery_status' => self::STATUS_LOCAL_QUEUE_ONLY));

            return self::get_config_summary();
        }

        /**
         * Disable delivery entirely.
         *
         * @return array<string,mixed> Config summary.
         */
        public static function disable_delivery() {
            self::persist_status(self::STATUS_DELIVERY_DISABLED);
            self::persist_label('Delivery disabled');
            WCOS_Audit::add_entry('webhook.delivery.placeholder.updated', 'webhook_config', null, array('delivery_status' => self::STATUS_DELIVERY_DISABLED));

            return self::get_config_summary();
        }
    }
}
