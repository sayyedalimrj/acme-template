<?php
/**
 * Redaction helper (WCOS_Redaction).
 *
 * Pure, dependency-free helpers that keep diagnostics and REST output safe by removing
 * secret-like field names and values. Never logs or returns the raw value. Mirrors the
 * TypeScript `redactPluginDiagnosticText` rules (src/redaction-contract.ts) by convention.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Redaction')) {
    /**
     * Secret redaction utilities.
     */
    final class WCOS_Redaction {

        const REDACTED = '[REDACTED]';

        /**
         * Normalized secret-like field-name tokens. A field whose normalized name (lowercased,
         * with spaces/underscores/dashes removed) contains any of these is treated as sensitive.
         *
         * @return string[]
         */
        private static function sensitive_key_tokens() {
            return array(
                'password',
                'applicationpassword',
                'consumersecret',
                'consumerkey',
                'apikey',
                'token',
                'tokenvalue',
                'accesstoken',
                'refreshtoken',
                'secret',
                'clientsecret',
                'authorization',
                'bearer',
                'basic',
                'cookie',
                'nonce',
                'webhooksecret',
                'signature',
                'signingmaterial',
                'signingsecret',
                // PII field names (defense-in-depth — these must never appear in output).
                'ipaddress',
                'useragent',
            );
        }

        /**
         * Whether a field name looks like it holds a secret.
         *
         * @param string $key Field name.
         * @return bool
         */
        public static function contains_sensitive_key($key) {
            if (!is_string($key)) {
                return false;
            }
            $normalized = preg_replace('/[\s_\-]/', '', strtolower($key));
            if (!is_string($normalized)) {
                return false;
            }
            foreach (self::sensitive_key_tokens() as $token) {
                if (strpos($normalized, $token) !== false) {
                    return true;
                }
            }

            return false;
        }

        /**
         * Redact secret-like substrings from free text.
         *
         * @param mixed $value Candidate text.
         * @return mixed Redacted string, or the original value if not a non-empty string.
         */
        public static function redact_text($value) {
            if (!is_string($value) || $value === '') {
                return $value;
            }

            $patterns = array(
                // Authorization: Bearer/Basic <value>
                '/\b(bearer|basic)\s+[^\s,;"\']+/i' => '${1} ' . self::REDACTED,
                // key:value / key=value for sensitive keys (incl. cookie, nonce, webhook secret)
                '/\b(application[\s_\-]?password|consumer[\s_\-]?secret|consumer[\s_\-]?key|api[\s_\-]?key|webhook[\s_\-]?secret|authorization|password|secret|token|cookie|nonce)\b(\s*[:=]\s*)("?)[^"\s,;}]+\3/i' => '${1}${2}' . self::REDACTED,
                // WooCommerce REST key/secret prefixes (ck_… / cs_…)
                '/\b(?:ck|cs)_[A-Za-z0-9]{4,}/' => self::REDACTED,
                // JWT-like triplets
                '/\beyJ[A-Za-z0-9_\-]{4,}\.[A-Za-z0-9_\-]{4,}\.[A-Za-z0-9_\-]{4,}/' => self::REDACTED,
            );

            foreach ($patterns as $pattern => $replacement) {
                $result = preg_replace($pattern, $replacement, $value);
                if (is_string($result)) {
                    $value = $result;
                }
            }

            return $value;
        }

        /**
         * Recursively redact an array for safe output:
         * - sensitive field names -> [REDACTED]
         * - string values -> redact_text()
         * - other scalars passed through.
         *
         * @param mixed $data Arbitrary data.
         * @return mixed
         */
        public static function redact_array($data) {
            if (is_string($data)) {
                return self::redact_text($data);
            }
            if (!is_array($data)) {
                return $data;
            }

            $out = array();
            foreach ($data as $key => $value) {
                if (is_string($key) && self::contains_sensitive_key($key)) {
                    $out[$key] = self::REDACTED;
                } elseif (is_array($value)) {
                    $out[$key] = self::redact_array($value);
                } elseif (is_string($value)) {
                    $out[$key] = self::redact_text($value);
                } else {
                    $out[$key] = $value;
                }
            }

            return $out;
        }
    }
}
