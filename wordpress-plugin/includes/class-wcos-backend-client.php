<?php
/**
 * Backend client (WCOS_Backend_Client) — signed outbound delivery to WordPress Commerce OS.
 *
 * Performs the real handshake/sync/events/health POSTs using `wp_remote_post`. Every request is
 * signed with HMAC-SHA256 over the EXACT JSON body plus the canonical header set, matching the
 * backend verifier (`services/api/src/services/plugin/signature.ts`):
 *
 *   base = site_id \n tenant_id \n timestamp \n nonce \n plugin_version \n sha256_hex(body)
 *   signature = hash_hmac('sha256', base, signing_secret)
 *
 * Headers: x-wcos-site-id, x-wcos-tenant-id, x-wcos-timestamp, x-wcos-nonce,
 *          x-wcos-plugin-version, x-wcos-signature.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Backend_Client')) {
    final class WCOS_Backend_Client {

        /**
         * Sign + POST a JSON payload to a backend path (e.g. "/sync"). Returns a result array:
         *   array('ok' => bool, 'status' => int, 'body' => array|null, 'error' => string|null)
         *
         * @param string $path    Backend path appended to the configured base URL.
         * @param array  $payload JSON-serializable payload.
         * @return array<string,mixed>
         */
        public static function post($path, array $payload) {
            if (!WCOS_Settings::is_configured()) {
                return self::err('اتصال پیکربندی نشده است.');
            }

            $base      = WCOS_Settings::get_backend_url();
            $site_id   = WCOS_Settings::get_site_id();
            $tenant_id = WCOS_Settings::get_tenant_id();
            $secret    = WCOS_Settings::get_signing_secret();

            $body      = wp_json_encode($payload);
            if (!is_string($body)) {
                return self::err('Encoding payload failed.');
            }

            $timestamp = gmdate('c');
            $nonce     = function_exists('wp_generate_uuid4') ? wp_generate_uuid4() : uniqid('wcos_', true);
            $body_hash = hash('sha256', $body);
            $base_str  = implode("\n", array($site_id, $tenant_id, $timestamp, $nonce, WCOS_VERSION, $body_hash));
            $signature = hash_hmac('sha256', $base_str, $secret);

            $response = wp_remote_post(
                $base . $path,
                array(
                    'timeout' => 20,
                    'headers' => array(
                        'Content-Type'           => 'application/json',
                        'Accept'                 => 'application/json',
                        'x-wcos-site-id'         => $site_id,
                        'x-wcos-tenant-id'       => $tenant_id,
                        'x-wcos-timestamp'       => $timestamp,
                        'x-wcos-nonce'           => $nonce,
                        'x-wcos-plugin-version'  => WCOS_VERSION,
                        'x-wcos-signature'       => $signature,
                    ),
                    'body' => $body,
                )
            );

            if (is_wp_error($response)) {
                return self::err($response->get_error_message());
            }

            $code = (int) wp_remote_retrieve_response_code($response);
            $raw  = wp_remote_retrieve_body($response);
            $json = json_decode($raw, true);
            $ok   = $code >= 200 && $code < 300;

            update_option('wcos_connection_last_checked_at', $timestamp);

            return array(
                'ok'     => $ok,
                'status' => $code,
                'body'   => is_array($json) ? $json : null,
                'error'  => $ok ? null : self::safe_error($json, $code),
            );
        }

        /**
         * Handshake: prove ownership of the signing secret and mark the site connected.
         *
         * @return array<string,mixed>
         */
        public static function handshake() {
            $identity = WCOS_Connection::get_site_identity_summary();
            $result   = self::post('/handshake', array(
                'pluginVersion' => WCOS_VERSION,
                'wpVersion'     => isset($identity['wordpress_version']) ? $identity['wordpress_version'] : '',
                'wooVersion'    => isset($identity['woocommerce_version']) ? $identity['woocommerce_version'] : '',
                'currency'      => WCOS_Sync_Builder::currency(),
            ));
            if (!empty($result['ok'])) {
                update_option('wcos_connection_status', WCOS_Connection::STATUS_CONNECTED_READ_ONLY_LATER);
                update_option('wcos_connection_mode', 'backend');
            } else {
                update_option('wcos_connection_status', WCOS_Connection::STATUS_CONNECTION_ERROR);
            }
            WCOS_Audit::add_entry('backend.handshake', 'connection', null, array('ok' => !empty($result['ok']), 'status' => $result['status']));
            return $result;
        }

        /**
         * Build + deliver the full signed sync envelope.
         *
         * @return array<string,mixed>
         */
        public static function sync() {
            $envelope = WCOS_Sync_Builder::build_envelope();
            $result   = self::post('/sync', $envelope);
            WCOS_Audit::add_entry('backend.sync', 'sync', null, array('ok' => !empty($result['ok']), 'status' => $result['status']));
            return $result;
        }

        /**
         * Deliver a signed health heartbeat.
         *
         * @return array<string,mixed>
         */
        public static function health() {
            return self::post('/health', array('pluginVersion' => WCOS_VERSION, 'ts' => gmdate('c')));
        }

        private static function err($message) {
            return array('ok' => false, 'status' => 0, 'body' => null, 'error' => (string) $message);
        }

        private static function safe_error($json, $code) {
            if (is_array($json) && isset($json['error']) && is_array($json['error']) && isset($json['error']['message'])) {
                return (string) $json['error']['message'];
            }
            return 'HTTP ' . $code;
        }
    }
}
