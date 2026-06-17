<?php
/**
 * Admin page (WCOS_Admin).
 *
 * Adds a single top-level "WordPress Commerce OS" menu with a read-only status page:
 * plugin status, connection status (Not connected), WooCommerce status (Active / Missing /
 * Unknown), health checks, a security notice, and the future-steps note. There are NO forms,
 * NO credential inputs, and NO save buttons for secrets anywhere on this page.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Admin')) {
    /**
     * Admin menu + status page renderer.
     */
    final class WCOS_Admin {

        /**
         * Hook admin menu + asset registration.
         *
         * @return void
         */
        public static function init() {
            add_action('admin_menu', array(__CLASS__, 'register_menu'));
            add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_assets'));
        }

        /**
         * Register the top-level menu page.
         *
         * @return void
         */
        public static function register_menu() {
            add_menu_page(
                esc_html__('WordPress Commerce OS Companion', 'wordpress-commerce-os-companion'),
                esc_html__('WordPress Commerce OS', 'wordpress-commerce-os-companion'),
                WCOS_Capabilities::required_admin_capability(),
                WCOS_ADMIN_PAGE_SLUG,
                array(__CLASS__, 'render_page'),
                'dashicons-store',
                58
            );
        }

        /**
         * Enqueue the admin stylesheet only on this plugin's page.
         *
         * @param string $hook Current admin page hook.
         * @return void
         */
        public static function enqueue_assets($hook) {
            if ('toplevel_page_' . WCOS_ADMIN_PAGE_SLUG !== $hook) {
                return;
            }
            wp_enqueue_style(
                'wcos-admin',
                WCOS_PLUGIN_URL . 'assets/admin.css',
                array(),
                WCOS_VERSION
            );
        }

        /**
         * Map a WooCommerce status to a safe, human-readable label.
         *
         * @param string $status active|missing|other.
         * @return string
         */
        private static function woocommerce_label($status) {
            if ('active' === $status) {
                return esc_html__('Active', 'wordpress-commerce-os-companion');
            }
            if ('missing' === $status) {
                return esc_html__('Missing', 'wordpress-commerce-os-companion');
            }

            return esc_html__('Unknown', 'wordpress-commerce-os-companion');
        }

        /**
         * Render the read-only status page.
         *
         * @return void
         */
        public static function render_page() {
            if (!WCOS_Capabilities::current_user_can_manage()) {
                wp_die(esc_html__('You do not have permission to access this page.', 'wordpress-commerce-os-companion'));
            }

            $wc                = WCOS_WooCommerce::summary();
            $health            = WCOS_Health::run();
            $connection_status = wcos_get_connection_status();
            $wc_version        = isset($wc['version']) && $wc['version'] ? $wc['version'] : esc_html__('Unknown', 'wordpress-commerce-os-companion');
            ?>
            <div class="wrap wcos-wrap">
                <h1><?php echo esc_html__('WordPress Commerce OS Companion', 'wordpress-commerce-os-companion'); ?></h1>
                <p class="wcos-subtitle">
                    <?php echo esc_html__('Single companion plugin. WooCommerce support is an internal module. This is a non-production runtime skeleton.', 'wordpress-commerce-os-companion'); ?>
                </p>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Plugin status', 'wordpress-commerce-os-companion'); ?></h2>
                    <table class="wcos-table">
                        <tbody>
                            <tr>
                                <th><?php echo esc_html__('Plugin version', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html(WCOS_VERSION); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Connection status', 'wordpress-commerce-os-companion'); ?></th>
                                <td>
                                    <span class="wcos-badge wcos-badge-muted"><?php echo esc_html__('Not connected', 'wordpress-commerce-os-companion'); ?></span>
                                    <span class="wcos-hint">(<?php echo esc_html($connection_status); ?>)</span>
                                </td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('WooCommerce', 'wordpress-commerce-os-companion'); ?></th>
                                <td>
                                    <span class="wcos-badge wcos-badge-<?php echo esc_attr($wc['status']); ?>">
                                        <?php echo self::woocommerce_label($wc['status']); ?>
                                    </span>
                                    <span class="wcos-hint"><?php echo esc_html($wc_version); ?></span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <?php if (empty($wc['active'])) : ?>
                    <div class="wcos-notice wcos-notice-warning">
                        <strong><?php echo esc_html__('WooCommerce is not active.', 'wordpress-commerce-os-companion'); ?></strong>
                        <?php echo esc_html__('The companion plugin still runs, but WooCommerce features will be unavailable until WooCommerce is installed and active. This is a warning, not an error.', 'wordpress-commerce-os-companion'); ?>
                    </div>
                <?php endif; ?>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Health checks', 'wordpress-commerce-os-companion'); ?></h2>
                    <p class="wcos-hint">
                        <?php echo esc_html__('Overall', 'wordpress-commerce-os-companion'); ?>:
                        <span class="wcos-badge wcos-status-<?php echo esc_attr($health['overall']); ?>"><?php echo esc_html($health['overall']); ?></span>
                    </p>
                    <table class="wcos-table">
                        <thead>
                            <tr>
                                <th><?php echo esc_html__('Check', 'wordpress-commerce-os-companion'); ?></th>
                                <th><?php echo esc_html__('Status', 'wordpress-commerce-os-companion'); ?></th>
                                <th><?php echo esc_html__('Detail', 'wordpress-commerce-os-companion'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($health['items'] as $item) : ?>
                                <tr>
                                    <td><?php echo esc_html($item['label']); ?></td>
                                    <td>
                                        <span class="wcos-badge wcos-status-<?php echo esc_attr($item['status']); ?>"><?php echo esc_html($item['status']); ?></span>
                                    </td>
                                    <td><?php echo esc_html($item['detail']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div class="wcos-notice wcos-notice-danger">
                    <strong><?php echo esc_html__('Security notice', 'wordpress-commerce-os-companion'); ?></strong>
                    <?php echo esc_html__('Do not paste WordPress admin passwords, application passwords, WooCommerce keys, hosting credentials, or API secrets here. This plugin never asks for credentials.', 'wordpress-commerce-os-companion'); ?>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Next steps', 'wordpress-commerce-os-companion'); ?></h2>
                    <p><?php echo esc_html__('Secure connection will be handled later via the backend/proxy handshake. No credentials are collected or stored by this plugin, and it makes no network requests.', 'wordpress-commerce-os-companion'); ?></p>
                    <p class="wcos-hint"><?php echo esc_html__('Admin-only status and health are also available via the local REST endpoints /wp-json/wcos/v1/status and /wp-json/wcos/v1/health.', 'wordpress-commerce-os-companion'); ?></p>
                </div>
            </div>
            <?php
        }
    }
}
