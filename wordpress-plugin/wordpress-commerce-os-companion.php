<?php
/**
 * Plugin Name:       WordPress Commerce OS Companion
 * Plugin URI:        https://app.jet-web.ir
 * Description:       Companion plugin that connects a WordPress/WooCommerce store to JetWeb Commerce OS. Performs signed (HMAC-SHA256) handshake, chunked background sync, and incremental event delivery to your platform API. Holds only a backend-issued signing secret — never WooCommerce REST keys.
 * Version:           1.1.1
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            JetWeb Commerce OS
 * Text Domain:       wordpress-commerce-os-companion
 * Domain Path:       /languages
 * License:           GPL-2.0-or-later
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

define('WCOS_VERSION', '1.1.1');
define('WCOS_SYNC_CRON_HOOK', 'wcos_scheduled_sync');
define('WCOS_HEALTH_CRON_HOOK', 'wcos_scheduled_health');
define('WCOS_PLUGIN_FILE', __FILE__);
define('WCOS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WCOS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WCOS_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('WCOS_REST_NAMESPACE', 'wcos/v1');
define('WCOS_TEXT_DOMAIN', 'wordpress-commerce-os-companion');
define('WCOS_REQUIRED_CAPABILITY', 'manage_options');
define('WCOS_ADMIN_PAGE_SLUG', 'wcos-companion');

require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-redaction.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-capabilities.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-data-sanitizer.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-woocommerce.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-connection.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-read-bridge.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-audit.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-event-sanitizer.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-event-store.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-event-bridge.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-webhook-config.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-controlled-actions.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-signature.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-settings.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-sync-state.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-sync-builder.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-backend-client.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-event-deliverer.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-sync-engine.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-sync-package.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-delivery.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-health.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-rest.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-admin.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-plugin.php';

function wcos_get_connection_status() {
    if (class_exists('WCOS_Connection')) {
        return WCOS_Connection::get_status();
    }
    $status = get_option('wcos_connection_status', 'not_connected');
    return is_string($status) ? $status : 'not_connected';
}

function wcos_activate() {
    if (get_option('wcos_connection_status') === false) {
        add_option('wcos_connection_status', 'not_connected');
    }
    update_option('wcos_plugin_version', WCOS_VERSION);
    delete_option('wcos_sync_fail_count');
    if (!wp_next_scheduled(WCOS_SYNC_CRON_HOOK)) {
        wp_schedule_event(time() + 300, 'hourly', WCOS_SYNC_CRON_HOOK);
    }
    if (!wp_next_scheduled(WCOS_HEALTH_CRON_HOOK)) {
        wp_schedule_event(time() + 600, 'twicedaily', WCOS_HEALTH_CRON_HOOK);
    }
}
register_activation_hook(__FILE__, 'wcos_activate');

function wcos_maybe_upgrade() {
    $stored = (string) get_option('wcos_plugin_version', '');
    if ($stored === WCOS_VERSION) {
        return;
    }
    delete_option('wcos_sync_fail_count');
    update_option('wcos_plugin_version', WCOS_VERSION);
    if (class_exists('WCOS_Sync_Engine') && class_exists('WCOS_Settings') && WCOS_Settings::is_configured()) {
        WCOS_Sync_Engine::schedule_incremental_sync();
    }
}
add_action('plugins_loaded', 'wcos_maybe_upgrade', 5);

function wcos_run_scheduled_sync() {
    if (class_exists('WCOS_Settings') && WCOS_Settings::is_configured()) {
        WCOS_Sync_Engine::schedule_incremental_sync();
    }
}
add_action(WCOS_SYNC_CRON_HOOK, 'wcos_run_scheduled_sync');

function wcos_run_scheduled_health() {
    if (class_exists('WCOS_Sync_Engine') && WCOS_Settings::is_configured()) {
        WCOS_Sync_Engine::run_health();
    }
}
add_action(WCOS_HEALTH_CRON_HOOK, 'wcos_run_scheduled_health');

function wcos_deactivate() {
    foreach (array(WCOS_SYNC_CRON_HOOK, WCOS_HEALTH_CRON_HOOK) as $hook) {
        $timestamp = wp_next_scheduled($hook);
        if ($timestamp) {
            wp_unschedule_event($timestamp, $hook);
        }
        wp_clear_scheduled_hook($hook);
    }
}
register_deactivation_hook(__FILE__, 'wcos_deactivate');

function wcos_plugin() {
    return WCOS_Plugin::instance();
}
add_action('plugins_loaded', 'wcos_plugin');

add_action('plugins_loaded', function () {
    if (class_exists('WCOS_Sync_Engine')) {
        WCOS_Sync_Engine::init();
    }
}, 20);
