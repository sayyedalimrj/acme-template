<?php
/**
 * Backend delivery placeholder (WCOS_Delivery).
 *
 * Represents FUTURE delivery of the read-only sync package to the backend/proxy. Delivery is
 * DISABLED BY DEFAULT and there is NO network code here at all — `build_preview_payload()`
 * only returns the locally-built package for on-screen preview; nothing is ever sent. There
 * is NO real destination URL and NO secret. See SECURITY.md.
 *
 * Allowed non-secret options:
 *   - wcos_delivery_status
 *   - wcos_delivery_destination_label
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Delivery')) {
    /**
     * Non-secret, no-network delivery placeholder.
     */
    final class WCOS_Delivery {

        const OPTION_STATUS = 'wcos_delivery_status';
        const OPTION_LABEL = 'wcos_delivery_destination_label';

        const STATUS_DISABLED = 'disabled';
        const STATUS_LOCAL_PREVIEW_ONLY = 'local_preview_only';
        const STATUS_CONFIGURED_LATER = 'configured_later';

        /**
         * Allowed delivery statuses.
         *
         * @return string[]
         */
        public static function allowed_statuses() {
            return array(
                self::STATUS_DISABLED,
                self::STATUS_LOCAL_PREVIEW_ONLY,
                self::STATUS_CONFIGURED_LATER,
            );
        }

        /**
         * Current delivery status (validated; defaults to disabled).
         *
         * @return string
         */
        public static function get_delivery_status() {
            $status = get_option(self::OPTION_STATUS, self::STATUS_DISABLED);
            if (!is_string($status) || !in_array($status, self::allowed_statuses(), true)) {
                return self::STATUS_DISABLED;
            }

            return $status;
        }

        /**
         * Non-secret delivery summary. No destination URL, no secret, never enables network.
         *
         * @return array<string,mixed>
         */
        public static function get_delivery_summary() {
            $label = get_option(self::OPTION_LABEL, '');

            return array(
                'delivery_status'   => self::get_delivery_status(),
                'destination_label' => is_string($label) && $label !== '' ? $label : 'not configured',
                'destination_url'   => null,
                'credentials_present' => false,
                'external_delivery' => false,
                'note'              => 'Delivery is disabled by default. No data is sent anywhere; this is local preview only. Real signed delivery to the backend/proxy is configured later.',
            );
        }

        /**
         * Build a local PREVIEW payload — the package that a future delivery step would send.
         * This does NOT send anything; it returns the locally-built, redacted package.
         *
         * @return array<string,mixed>
         */
        public static function build_preview_payload() {
            return array(
                'delivery'        => self::get_delivery_summary(),
                'would_send'      => false,
                'package_preview' => WCOS_Sync_Package::build_package(WCOS_Sync_Package::MAX_RECORDS),
            );
        }

        /**
         * Current signature status (delegates to WCOS_Signature; always not_configured here).
         *
         * @return string
         */
        public static function get_signature_status() {
            return class_exists('WCOS_Signature') ? WCOS_Signature::get_signature_status() : 'not_configured';
        }

        /**
         * Non-secret delivery security summary. No signing secret, no URL, no external delivery.
         * Key names deliberately avoid the redactor's sensitive tokens so the structured flags
         * survive `WCOS_Redaction::redact_array`.
         *
         * @return array<string,mixed>
         */
        public static function get_delivery_security_summary() {
            return array(
                'signing_status'    => self::get_signature_status(),
                'algorithm'         => 'hmac-sha256',
                'replay_protection' => 'backend_in_memory_later',
                'external_delivery' => false,
                'has_signing_key'   => false,
                'note'              => 'Signed delivery requires backend-provisioned signing material later. The plugin stores no signing secret, exposes no signing field, and sends nothing.',
            );
        }

        /**
         * Build a local SIGNED-preview payload. Does NOT send anything and does NOT compute a
         * real signature (no signing material is stored): the signing block reports
         * `status: not_configured`.
         *
         * @return array<string,mixed>
         */
        public static function build_signed_preview_payload() {
            return array(
                'delivery'        => self::get_delivery_summary(),
                'would_send'      => false,
                'signing'         => array(
                    'status'        => self::get_signature_status(),
                    'algorithm'     => 'hmac-sha256',
                    'key_present'   => false,
                    'value_present' => false,
                ),
                'package_preview' => WCOS_Sync_Package::build_package(WCOS_Sync_Package::MAX_RECORDS),
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
         * Mark delivery as "local preview only" (still nothing is sent anywhere).
         *
         * @return array<string,mixed> Delivery summary.
         */
        public static function mark_local_preview_only() {
            self::persist_status(self::STATUS_LOCAL_PREVIEW_ONLY);
            self::persist_label('Local preview only');

            return self::get_delivery_summary();
        }

        /**
         * Disable delivery entirely.
         *
         * @return array<string,mixed> Delivery summary.
         */
        public static function disable_delivery() {
            self::persist_status(self::STATUS_DISABLED);
            self::persist_label('Delivery disabled');

            return self::get_delivery_summary();
        }
    }
}
