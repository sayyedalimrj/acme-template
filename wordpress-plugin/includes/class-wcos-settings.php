<?php
/**
 * Connection settings (WCOS_Settings).
 *
 * Stores the backend connection configuration the merchant pastes from their dashboard:
 *   - backend base URL (e.g. https://api.example.com/plugin)
 *   - site id + tenant id (issued by the backend when the site is created)
 *   - signing secret (a shared HMAC secret, NOT a user credential / not a store key)
 *
 * The signing secret is stored in a non-autoloaded option and is NEVER echoed back to the
 * browser (the admin UI shows only whether it is configured). This is the one secret the plugin
 * must hold to sign sync requests; it is provisioned by the backend and can be rotated/cleared.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Settings')) {
    final class WCOS_Settings {

        const OPT_BACKEND_URL   = 'wcos_backend_url';
        const OPT_SITE_ID       = 'wcos_connection_site_id';
        const OPT_TENANT_ID     = 'wcos_connection_tenant_id';
        const OPT_SIGNING_SECRET = 'wcos_signing_secret';

        public static function get_backend_url() {
            return rtrim((string) get_option(self::OPT_BACKEND_URL, ''), '/');
        }

        public static function get_site_id() {
            return (string) get_option(self::OPT_SITE_ID, '');
        }

        public static function get_tenant_id() {
            return (string) get_option(self::OPT_TENANT_ID, '');
        }

        public static function get_signing_secret() {
            return (string) get_option(self::OPT_SIGNING_SECRET, '');
        }

        public static function has_signing_secret() {
            return self::get_signing_secret() !== '';
        }

        /**
         * True when all four settings are present (ready to handshake/sync).
         *
         * @return bool
         */
        public static function is_configured() {
            return self::get_backend_url() !== ''
                && self::get_site_id() !== ''
                && self::get_tenant_id() !== ''
                && self::has_signing_secret();
        }

        /**
         * Persist settings from a sanitized admin submission. An empty signing-secret field is
         * IGNORED (so saving other fields does not wipe the stored secret); pass a non-empty value
         * to set/rotate it.
         *
         * @param array<string,string> $input Raw input (already unslashed by the caller).
         * @return void
         */
        public static function save(array $input) {
            if (isset($input['backend_url'])) {
                update_option(self::OPT_BACKEND_URL, esc_url_raw(rtrim(trim($input['backend_url']), '/')), false);
            }
            if (isset($input['site_id'])) {
                update_option(self::OPT_SITE_ID, sanitize_text_field($input['site_id']));
            }
            if (isset($input['tenant_id'])) {
                update_option(self::OPT_TENANT_ID, sanitize_text_field($input['tenant_id']));
            }
            if (isset($input['signing_secret']) && trim($input['signing_secret']) !== '') {
                // Stored non-autoloaded; never echoed back to the browser.
                update_option(self::OPT_SIGNING_SECRET, trim($input['signing_secret']), false);
            }
        }

        /**
         * Clear all connection settings (used on disconnect).
         *
         * @return void
         */
        public static function clear() {
            delete_option(self::OPT_BACKEND_URL);
            delete_option(self::OPT_SIGNING_SECRET);
            // site_id / tenant_id are managed by WCOS_Connection::disconnect().
        }
    }
}
