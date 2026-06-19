<?php
/**
 * Plugin Name:       WordPress Commerce OS Companion
 * Plugin URI:        https://example-store.test/companion
 * Description:       Companion plugin that connects a WordPress/WooCommerce store to WordPress Commerce OS. Performs a signed (HMAC-SHA256) handshake and scheduled read-only sync of summarized, PII-minimized WooCommerce data to your backend. Holds only a backend-issued signing secret — never store/API credentials.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WordPress Commerce OS (placeholder)
 * Author URI:        https://example-store.test
 * Text Domain:       wordpress-commerce-os-companion
 * Domain Path:       /languages
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 *
 * ONE PLUGIN ONLY. WooCommerce support is an INTERNAL module (class WCOS_WooCommerce), not a
 * separate plugin. Events, webhook config, controlled actions, and diagnostics are all
 * INTERNAL modules of this same plugin. This plugin:
 *   - never asks for or stores credentials (no tokens, API keys, passwords, secrets),
 *   - never makes network requests (no wp_remote_*, no cURL) and never delivers externally,
 *   - never calls the WooCommerce REST API and never creates API keys,
 *   - never writes/mutates WooCommerce data and never registers real webhooks,
 *   - reads WooCommerce data LOCALLY in summarized, redacted, PII-minimized form only,
 *   - captures summary-only events into a capped LOCAL queue (no delivery),
 *   - exposes controlled-action intents that are DISABLED (no mutation),
 *   - builds a read-only, redacted sync PACKAGE locally and can PREVIEW it,
 *   - can build a SIGNED preview shape (signature status `not_configured`; no stored secret),
 *   - keeps backend delivery DISABLED by default (no external requests),
 *   - exposes only admin-authenticated (manage_options) local REST endpoints.
 * See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

/* -------------------------------------------------------------------------
 * Constants (unique wcos_/WCOS_ prefix).
 * ---------------------------------------------------------------------- */
define('WCOS_VERSION', '1.0.0');
define('WCOS_SYNC_CRON_HOOK', 'wcos_scheduled_sync');
define('WCOS_PLUGIN_FILE', __FILE__);
define('WCOS_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WCOS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WCOS_PLUGIN_BASENAME', plugin_basename(__FILE__));
define('WCOS_REST_NAMESPACE', 'wcos/v1');
define('WCOS_TEXT_DOMAIN', 'wordpress-commerce-os-companion');
define('WCOS_REQUIRED_CAPABILITY', 'manage_options');
define('WCOS_ADMIN_PAGE_SLUG', 'wcos-companion');

/* -------------------------------------------------------------------------
 * Includes (load order: helpers first, bootstrap last).
 * ---------------------------------------------------------------------- */
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
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-sync-builder.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-backend-client.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-sync-package.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-delivery.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-health.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-rest.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-admin.php';
require_once WCOS_PLUGIN_DIR . 'includes/class-wcos-plugin.php';

/**
 * Read the non-secret connection status option. Defaults to "not_connected".
 *
 * @return string
 */
function wcos_get_connection_status() {
    if (class_exists('WCOS_Connection')) {
        return WCOS_Connection::get_status();
    }
    $status = get_option('wcos_connection_status', 'not_connected');

    return is_string($status) ? $status : 'not_connected';
}

/* -------------------------------------------------------------------------
 * Activation / deactivation (safe: no network, no credentials, no tables).
 * ---------------------------------------------------------------------- */

/**
 * On activation, persist only non-secret, plugin-owned options.
 *
 * @return void
 */
function wcos_activate() {
    if (get_option('wcos_connection_status') === false) {
        add_option('wcos_connection_status', 'not_connected');
    }
    update_option('wcos_plugin_version', WCOS_VERSION);
    // Schedule the hourly sync (only sends when the connection is configured).
    if (!wp_next_scheduled(WCOS_SYNC_CRON_HOOK)) {
        wp_schedule_event(time() + 300, 'hourly', WCOS_SYNC_CRON_HOOK);
    }
}
register_activation_hook(__FILE__, 'wcos_activate');

/**
 * The scheduled sync runner. Only delivers when the backend connection is fully configured.
 *
 * @return void
 */
function wcos_run_scheduled_sync() {
    if (class_exists('WCOS_Settings') && WCOS_Settings::is_configured()) {
        WCOS_Backend_Client::sync();
    }
}
add_action(WCOS_SYNC_CRON_HOOK, 'wcos_run_scheduled_sync');

/**
 * On deactivation, do nothing destructive. No network calls, no data removal.
 * Connection state is preserved; full option cleanup lives in uninstall.php.
 *
 * @return void
 */
function wcos_deactivate() {
    // Clear the scheduled sync. Connection settings are preserved (cleanup lives in uninstall.php).
    $timestamp = wp_next_scheduled(WCOS_SYNC_CRON_HOOK);
    if ($timestamp) {
        wp_unschedule_event($timestamp, WCOS_SYNC_CRON_HOOK);
    }
    wp_clear_scheduled_hook(WCOS_SYNC_CRON_HOOK);
}
register_deactivation_hook(__FILE__, 'wcos_deactivate');

/* -------------------------------------------------------------------------
 * Bootstrap.
 * ---------------------------------------------------------------------- */

/**
 * Resolve the singleton plugin instance.
 *
 * @return WCOS_Plugin
 */
function wcos_plugin() {
    return WCOS_Plugin::instance();
}
add_action('plugins_loaded', 'wcos_plugin');
