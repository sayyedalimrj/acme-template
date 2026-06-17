<?php
/**
 * Central bootstrap class for the WordPress Commerce OS Companion plugin.
 *
 * Wires up the admin page, REST routes, health checks, and the internal WooCommerce module.
 * No network calls, no credential handling.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Plugin')) {
    /**
     * Plugin bootstrap (singleton).
     */
    final class WCOS_Plugin {

        /**
         * Singleton instance.
         *
         * @var WCOS_Plugin|null
         */
        private static $instance = null;

        /**
         * Resolve / build the singleton instance.
         *
         * @return WCOS_Plugin
         */
        public static function instance() {
            if (self::$instance === null) {
                self::$instance = new self();
                self::$instance->init();
            }

            return self::$instance;
        }

        /**
         * Private constructor (use instance()).
         */
        private function __construct() {
        }

        /**
         * Initialize submodules.
         *
         * @return void
         */
        private function init() {
            if (function_exists('load_plugin_textdomain')) {
                load_plugin_textdomain(
                    WCOS_TEXT_DOMAIN,
                    false,
                    dirname(WCOS_PLUGIN_BASENAME) . '/languages'
                );
            }

            WCOS_Admin::init();
            WCOS_REST::init();

            // Register optional, guarded local WooCommerce event hooks (summary-only capture;
            // no mutation, no network, no raw payloads).
            WCOS_Event_Bridge::register_hooks();
        }

        /**
         * Plugin version.
         *
         * @return string
         */
        public function version() {
            return WCOS_VERSION;
        }

        /**
         * Frontend-safe plugin metadata (no secrets).
         *
         * @return array<string,mixed>
         */
        public function metadata() {
            return array(
                'plugin_name'    => 'WordPress Commerce OS Companion',
                'plugin_slug'    => 'wordpress-commerce-os-companion',
                'plugin_version' => WCOS_VERSION,
                'rest_namespace' => WCOS_REST_NAMESPACE,
                'one_plugin'     => true,
                'woocommerce_is_internal_module' => true,
            );
        }
    }
}
