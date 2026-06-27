<?php
/**
 * Backend client (WCOS_Backend_Client) — signed outbound delivery to WordPress Commerce OS.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Backend_Client')) {
    final class WCOS_Backend_Client {

        /**
         * Sign + POST a JSON payload to a backend path (e.g. "/handshake").
         *
         * @param string $path    Path relative to normalized backend base (e.g. "/sync").
         * @param array  $payload JSON-serializable payload.
         * @return array<string,mixed>
         */
        public static function post($path, array $payload) {
            if (!WCOS_Settings::is_configured()) {
                return self::err('اتصال پیکربندی نشده است.');
            }
            if (!WCOS_Settings::backend_url_is_valid()) {
                return self::err('آدرس بک‌اند باید HTTPS باشد.');
            }

            $base      = WCOS_Settings::get_backend_url();
            $site_id   = WCOS_Settings::get_site_id();
            $tenant_id = WCOS_Settings::get_tenant_id();
            $secret    = WCOS_Settings::get_signing_secret();
            $path      = '/' . ltrim((string) $path, '/');

            $body = wp_json_encode($payload);
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
                    'timeout' => 60,
                    'headers' => array(
                        'Content-Type'          => 'application/json',
                        'Accept'                => 'application/json',
                        'x-wcos-site-id'        => $site_id,
                        'x-wcos-tenant-id'      => $tenant_id,
                        'x-wcos-timestamp'      => $timestamp,
                        'x-wcos-nonce'          => $nonce,
                        'x-wcos-plugin-version' => WCOS_VERSION,
                        'x-wcos-signature'      => $signature,
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

        /** Test connection via signed health check. */
        public static function test_connection() {
            return self::health();
        }

        /** Handshake: prove ownership of the signing secret. */
        public static function handshake() {
            $identity = WCOS_Connection::get_site_identity_summary();
            $caps     = WCOS_WooCommerce::summary();
            $result   = self::post('/handshake', array(
                'pluginVersion' => WCOS_VERSION,
                'wpVersion'     => isset($identity['wordpress_version']) ? $identity['wordpress_version'] : '',
                'wooVersion'    => isset($identity['woocommerce_version']) ? $identity['woocommerce_version'] : '',
                'currency'      => WCOS_Sync_Builder::currency(),
                'capabilities'  => array(
                    'hpos'       => WCOS_WooCommerce::is_hpos_enabled(),
                    'multisite'  => WCOS_WooCommerce::is_multisite(),
                    'wooActive'  => WCOS_WooCommerce::is_active(),
                ),
            ));
            if (!empty($result['ok'])) {
                update_option('wcos_connection_status', WCOS_Connection::STATUS_CONNECTED_READ_ONLY_LATER);
                update_option('wcos_connection_mode', 'backend');
                WCOS_Sync_State::record_success('handshake');
            } else {
                update_option('wcos_connection_status', WCOS_Connection::STATUS_CONNECTION_ERROR);
                if (!empty($result['error'])) {
                    WCOS_Sync_State::record_error($result['error']);
                }
            }
            WCOS_Audit::add_entry('backend.handshake', 'connection', null, array(
                'ok'     => !empty($result['ok']) ? '1' : '0',
                'status' => (string) (isset($result['status']) ? $result['status'] : 0),
            ));
            return $result;
        }

        /** Legacy full envelope sync (v1). Prefer sync_chunk for production. */
        public static function sync() {
            $envelope = WCOS_Sync_Builder::build_envelope();
            $result   = self::post('/sync', $envelope);
            if (!empty($result['ok'])) {
                WCOS_Sync_State::record_success('sync');
            } elseif (!empty($result['error'])) {
                WCOS_Sync_State::record_error($result['error']);
            }
            WCOS_Audit::add_entry('backend.sync', 'sync', null, array(
                'ok'     => !empty($result['ok']) ? '1' : '0',
                'status' => (string) (isset($result['status']) ? $result['status'] : 0),
            ));
            return $result;
        }

        /**
         * Deliver one chunked sync page.
         *
         * @param string $entity Entity name.
         * @param int    $page   Page number.
         * @return array<string,mixed>
         */
        public static function sync_chunk($entity, $page) {
            $envelope = WCOS_Sync_Builder::build_chunk_envelope($entity, $page);
            $meta     = isset($envelope['_meta']) ? $envelope['_meta'] : array();
            unset($envelope['_meta']);
            $result   = self::post('/sync', $envelope);
            $out      = array(
                'ok'      => !empty($result['ok']),
                'status'  => isset($result['status']) ? $result['status'] : 0,
                'hasMore' => !empty($meta['hasMore']),
                'error'   => isset($result['error']) ? $result['error'] : null,
                'stats'   => is_array($result['body']) && isset($result['body']['stats']) ? $result['body']['stats'] : null,
            );
            WCOS_Audit::add_entry('backend.sync', 'sync', $entity, array(
                'ok'   => $out['ok'] ? '1' : '0',
                'page' => (string) $page,
            ));
            return $out;
        }

        /** Signed health heartbeat. */
        public static function health() {
            $result = self::post('/health', array(
                'pluginVersion' => WCOS_VERSION,
                'ts'            => gmdate('c'),
                'wooActive'     => WCOS_WooCommerce::is_active(),
            ));
            if (!empty($result['ok'])) {
                WCOS_Sync_State::record_success('handshake');
            }
            return $result;
        }

        private static function err($message) {
            return array('ok' => false, 'status' => 0, 'body' => null, 'error' => (string) $message);
        }

        private static function safe_error($json, $code) {
            if (is_array($json) && isset($json['error']) && is_array($json['error']) && isset($json['error']['message'])) {
                return (string) $json['error']['message'];
            }
            if (is_array($json) && isset($json['message'])) {
                return (string) $json['message'];
            }
            return 'HTTP ' . $code;
        }
    }
}
