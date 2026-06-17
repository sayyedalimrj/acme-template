<?php
/**
 * Plugin signature helper (WCOS_Signature).
 *
 * Builds a canonical, NON-SECRET signature base string and can compute an HMAC-SHA256 over it
 * when signing material is INJECTED (e.g. in runtime sanity tests). This PR does NOT store a
 * signing secret, does NOT add an admin field for one, does NOT expose it, and does NOT log
 * it. With no signing material configured, the signature status is `not_configured`. Real
 * signed delivery uses backend-provisioned signing material later. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Signature')) {
    /**
     * Signature base-string + HMAC helper (no stored secret).
     */
    final class WCOS_Signature {

        const ALGORITHM = 'hmac-sha256';

        /**
         * JSON-encode a payload safely (no secrets are added here).
         *
         * @param mixed $payload Array or string.
         * @return string
         */
        private static function encode_body($payload) {
            if (is_string($payload)) {
                return $payload;
            }
            $encoded = function_exists('wp_json_encode') ? wp_json_encode($payload) : json_encode($payload);

            return is_string($encoded) ? $encoded : '';
        }

        /**
         * Build the canonical, non-secret base string a signature would cover. The body is
         * reduced to a SHA-256 hash so the base string never contains payload PII.
         *
         * @param mixed  $payload   Package array (or pre-serialized string).
         * @param string $timestamp ISO-8601 timestamp.
         * @param string $nonce     Per-request nonce.
         * @return string
         */
        public static function build_signature_base_string($payload, $timestamp, $nonce) {
            $ids       = class_exists('WCOS_Connection') ? WCOS_Connection::get_sync_identifiers() : array();
            $site_id   = isset($ids['site_id']) ? (string) $ids['site_id'] : '';
            $tenant_id = isset($ids['tenant_id']) ? (string) $ids['tenant_id'] : '';
            $body      = self::encode_body($payload);
            $body_hash = function_exists('hash') ? hash('sha256', $body) : '';

            return implode(
                "\n",
                array(
                    $site_id,
                    $tenant_id,
                    (string) $timestamp,
                    (string) $nonce,
                    defined('WCOS_VERSION') ? WCOS_VERSION : '',
                    $body_hash,
                )
            );
        }

        /**
         * Compute an HMAC-SHA256 over the canonical base string using INJECTED signing material.
         * Returns '' when no material is provided or HMAC is unavailable. The signing material
         * is never stored or logged.
         *
         * @param mixed  $payload        Package array (or pre-serialized string).
         * @param string $signing_secret Injected signing material (never persisted).
         * @return string Hex signature, or '' when not available.
         */
        public static function sign_payload($payload, $signing_secret) {
            if (!function_exists('hash_hmac') || !is_string($signing_secret) || $signing_secret === '') {
                return '';
            }
            $timestamp = function_exists('current_time') ? current_time('c') : gmdate('c');
            $nonce     = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : uniqid('wcos_', true);
            $base      = self::build_signature_base_string($payload, $timestamp, $nonce);

            return hash_hmac('sha256', $base, $signing_secret);
        }

        /**
         * Placeholder verification. ALWAYS returns `not_configured` — the plugin holds no
         * signing material in this phase.
         *
         * @return array<string,mixed>
         */
        public static function verify_signature_placeholder() {
            return array(
                'verified'  => false,
                'status'    => 'not_configured',
                'algorithm' => self::ALGORITHM,
                'reason'    => 'Signing material is provisioned by the backend later; the plugin stores none.',
            );
        }

        /**
         * Current signature status. Always `not_configured` (no signing material is stored).
         *
         * @return string
         */
        public static function get_signature_status() {
            return 'not_configured';
        }
    }
}
