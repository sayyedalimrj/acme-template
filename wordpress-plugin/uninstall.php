<?php
/**
 * Uninstall handler for WordPress Commerce OS Companion.
 *
 * Runs only when the user deletes the plugin from WordPress. Removes ONLY this plugin's own
 * non-secret options. It does NOT delete any merchant content, WooCommerce data, products,
 * orders, or customers, and makes NO external/network calls.
 *
 * The runtime skeleton persists only two non-secret options:
 *   - wcos_connection_status (default "not_connected")
 *   - wcos_plugin_version
 * No secrets, credentials, or API keys are ever stored, so none are removed here.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('WP_UNINSTALL_PLUGIN') || exit;

delete_option('wcos_connection_status');
delete_option('wcos_plugin_version');
