<?php
/**
 * Uninstall handler for WordPress Commerce OS Companion.
 *
 * Runs only when the user deletes the plugin from WordPress. Removes ONLY this plugin's own
 * non-secret options. It does NOT delete any merchant content, WooCommerce data, products,
 * orders, or customers, and makes NO external/network calls.
 *
 * Plugin-owned non-secret options (no secrets, credentials, or API keys are ever stored):
 *   - wcos_connection_status
 *   - wcos_connection_site_id
 *   - wcos_connection_tenant_id
 *   - wcos_connection_last_checked_at
 *   - wcos_connection_mode
 *   - wcos_plugin_version
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('WP_UNINSTALL_PLUGIN') || exit;

$wcos_options = array(
    'wcos_connection_status',
    'wcos_connection_site_id',
    'wcos_connection_tenant_id',
    'wcos_connection_last_checked_at',
    'wcos_connection_mode',
    'wcos_plugin_version',
);

foreach ($wcos_options as $wcos_option) {
    delete_option($wcos_option);
}
