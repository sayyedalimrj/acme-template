<?php
/**
 * EXAMPLE ONLY — not a working plugin.
 *
 * This file shows the shape of a WordPress plugin header for the future companion plugin.
 * It contains NO activation hooks, NO network calls, NO REST endpoints, NO database access,
 * NO credentials, and NO runtime logic. Author/URLs are placeholders. Do not ship this.
 *
 * Plugin Name:       WooCommerce OS Companion
 * Description:       Securely connects this WordPress/WooCommerce site to the WooCommerce OS backend (contract/skeleton only — not production).
 * Version:           0.0.0-contract
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            WooCommerce OS (placeholder)
 * Author URI:        https://example-store.test
 * Text Domain:       woocommerce-os-companion
 * License:           GPL-2.0-or-later
 */

// Standard guard: prevent direct access. (Example only — no further logic exists.)
if (!defined('ABSPATH')) {
    exit;
}

// Intentionally empty: the real plugin runtime (activation, REST routes, event bridge,
// webhook configuration, health checks) is defined by the TypeScript contracts in
// ../src and will be implemented in a later, security-reviewed phase.
