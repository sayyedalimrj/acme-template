<?php
/**
 * Admin page (WCOS_Admin).
 *
 * Adds a single top-level "WordPress Commerce OS" menu with an admin-only page showing:
 * Connection (status + local site/tenant identifiers + "Mark local readiness" / "Disconnect
 * locally" buttons), the WooCommerce read-only bridge (active/version, read-capability
 * readiness, aggregate counts), health checks, a security notice, and next steps.
 *
 * The two buttons post to admin-post.php and update ONLY non-secret local options (guarded by
 * `manage_options` + `check_admin_referer`). There are NO credential inputs and NO fields that
 * accept or store secrets anywhere on this page.
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
            add_action('admin_post_wcos_mark_local_ready', array(__CLASS__, 'handle_mark_local_ready'));
            add_action('admin_post_wcos_disconnect', array(__CLASS__, 'handle_disconnect'));
        }

        /**
         * Redirect back to the plugin admin page with a status notice.
         *
         * @param string $notice Notice code.
         * @return void
         */
        private static function redirect_with_notice($notice) {
            $url = function_exists('admin_url') ? admin_url('admin.php') : '';
            $url = add_query_arg(
                array(
                    'page'        => WCOS_ADMIN_PAGE_SLUG,
                    'wcos_notice' => $notice,
                ),
                $url
            );
            wp_safe_redirect($url);
            exit;
        }

        /**
         * Handle the "Mark local readiness" admin form (non-secret options only).
         *
         * @return void
         */
        public static function handle_mark_local_ready() {
            if (!WCOS_Capabilities::current_user_can('manage_local_connection_state')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_mark_local_ready');
            WCOS_Connection::mark_local_ready();
            self::redirect_with_notice('local_ready');
        }

        /**
         * Handle the "Disconnect locally" admin form (non-secret options only).
         *
         * @return void
         */
        public static function handle_disconnect() {
            if (!WCOS_Capabilities::current_user_can('manage_local_connection_state')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_disconnect');
            WCOS_Connection::disconnect();
            self::redirect_with_notice('disconnected');
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
         * Map a connection status to a [label, badge-class] pair.
         *
         * @param string $status Connection status.
         * @return array<int,string> [label, css_class]
         */
        private static function connection_label($status) {
            switch ($status) {
                case WCOS_Connection::STATUS_LOCAL_READY:
                    return array(esc_html__('Local ready', 'wordpress-commerce-os-companion'), 'wcos-status-ok');
                case WCOS_Connection::STATUS_PENDING_HANDSHAKE_LATER:
                    return array(esc_html__('Pending secure handshake (later)', 'wordpress-commerce-os-companion'), 'wcos-status-warning');
                case WCOS_Connection::STATUS_CONNECTED_READ_ONLY_LATER:
                    return array(esc_html__('Connected read-only (later)', 'wordpress-commerce-os-companion'), 'wcos-status-ok');
                case WCOS_Connection::STATUS_CONNECTION_ERROR:
                    return array(esc_html__('Connection error', 'wordpress-commerce-os-companion'), 'wcos-status-error');
                case WCOS_Connection::STATUS_DISCONNECTED:
                    return array(esc_html__('Disconnected', 'wordpress-commerce-os-companion'), 'wcos-badge-muted');
                case WCOS_Connection::STATUS_NOT_CONNECTED:
                default:
                    return array(esc_html__('Not connected', 'wordpress-commerce-os-companion'), 'wcos-badge-muted');
            }
        }

        /**
         * Render an admin notice from the `wcos_notice` query arg (if present).
         *
         * @return void
         */
        private static function maybe_render_notice() {
            $notice = isset($_GET['wcos_notice']) ? sanitize_key(wp_unslash($_GET['wcos_notice'])) : '';
            if ('local_ready' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Local readiness saved.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('Local placeholder identifiers were generated. No credentials were collected and no data was sent anywhere.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('disconnected' === $notice) {
                echo '<div class="wcos-notice wcos-notice-warning"><strong>'
                    . esc_html__('Disconnected locally.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('Local connection state was cleared. No external services were contacted.', 'wordpress-commerce-os-companion')
                    . '</div>';
            }
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
            $counts            = WCOS_WooCommerce::get_counts_summary();
            $bridge_caps       = WCOS_Read_Bridge::get_bridge_capabilities();
            $connection        = WCOS_Connection::get_connection_summary();
            $health            = WCOS_Health::run();
            list($conn_label, $conn_class) = self::connection_label($connection['status']);
            $wc_version        = isset($wc['version']) && $wc['version'] ? $wc['version'] : esc_html__('Unknown', 'wordpress-commerce-os-companion');
            $action_url        = function_exists('admin_url') ? admin_url('admin-post.php') : '';
            $yes               = esc_html__('Available', 'wordpress-commerce-os-companion');
            $no                = esc_html__('Unavailable', 'wordpress-commerce-os-companion');
            $dash              = esc_html__('—', 'wordpress-commerce-os-companion');
            ?>
            <div class="wrap wcos-wrap">
                <h1><?php echo esc_html__('WordPress Commerce OS Companion', 'wordpress-commerce-os-companion'); ?></h1>
                <p class="wcos-subtitle">
                    <?php echo esc_html__('Single companion plugin. WooCommerce support is an internal module. Non-production: read-only, summarized, admin-only — no credentials, no network calls.', 'wordpress-commerce-os-companion'); ?>
                </p>

                <?php self::maybe_render_notice(); ?>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Connection', 'wordpress-commerce-os-companion'); ?></h2>
                    <table class="wcos-table">
                        <tbody>
                            <tr>
                                <th><?php echo esc_html__('Status', 'wordpress-commerce-os-companion'); ?></th>
                                <td><span class="wcos-badge <?php echo esc_attr($conn_class); ?>"><?php echo esc_html($conn_label); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Mode', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html($connection['mode']); ?> <span class="wcos-hint"><?php echo esc_html__('(backend connection not configured yet)', 'wordpress-commerce-os-companion'); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Local site identifier', 'wordpress-commerce-os-companion'); ?></th>
                                <td><code><?php echo esc_html($connection['site_id'] !== '' ? $connection['site_id'] : $dash); ?></code></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Local tenant identifier', 'wordpress-commerce-os-companion'); ?></th>
                                <td><code><?php echo esc_html($connection['tenant_id'] !== '' ? $connection['tenant_id'] : $dash); ?></code></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Site URL', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html($connection['site_identity']['site_url']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Last checked', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html($connection['last_checked_at'] !== '' ? $connection['last_checked_at'] : $dash); ?></td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="wcos-actions">
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_mark_local_ready" />
                            <?php wp_nonce_field('wcos_mark_local_ready'); ?>
                            <button type="submit" class="button button-primary"><?php echo esc_html__('Mark local readiness', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_disconnect" />
                            <?php wp_nonce_field('wcos_disconnect'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Disconnect locally', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                    </div>
                    <p class="wcos-hint"><?php echo esc_html__('Real backend connection will be added later through the secure backend/proxy handshake. These buttons only update local, non-secret state.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('WooCommerce read-only bridge', 'wordpress-commerce-os-companion'); ?></h2>
                    <table class="wcos-table">
                        <tbody>
                            <tr>
                                <th><?php echo esc_html__('WooCommerce', 'wordpress-commerce-os-companion'); ?></th>
                                <td>
                                    <span class="wcos-badge wcos-badge-<?php echo esc_attr($wc['status']); ?>"><?php echo self::woocommerce_label($wc['status']); ?></span>
                                    <span class="wcos-hint"><?php echo esc_html($wc_version); ?></span>
                                </td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Read products', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo $bridge_caps['read_products'] ? esc_html($yes) : esc_html($no); ?> · <?php echo esc_html__('Products', 'wordpress-commerce-os-companion'); ?>: <?php echo esc_html(null === $counts['product_count'] ? $dash : (string) $counts['product_count']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Read orders', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo $bridge_caps['read_orders'] ? esc_html($yes) : esc_html($no); ?> · <?php echo esc_html__('Orders', 'wordpress-commerce-os-companion'); ?>: <?php echo esc_html(null === $counts['order_count'] ? $dash : (string) $counts['order_count']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Read customers', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo $bridge_caps['read_customers'] ? esc_html($yes) : esc_html($no); ?> · <?php echo esc_html__('Customers', 'wordpress-commerce-os-companion'); ?>: <?php echo esc_html(null === $counts['customer_count'] ? $dash : (string) $counts['customer_count']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Read reports', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo $bridge_caps['read_reports'] ? esc_html($yes) : esc_html($no); ?> <span class="wcos-hint"><?php echo esc_html__('(summary placeholder)', 'wordpress-commerce-os-companion'); ?></span></td>
                            </tr>
                        </tbody>
                    </table>
                    <p class="wcos-hint"><?php echo esc_html__('Data is read locally and only as redacted, PII-minimized summaries (no addresses, phones, raw emails, payment details, or order notes). Nothing is sent anywhere. Detailed summaries are available to admins via the REST endpoints below.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

                <?php if (empty($wc['active'])) : ?>
                    <div class="wcos-notice wcos-notice-warning">
                        <strong><?php echo esc_html__('WooCommerce is not active.', 'wordpress-commerce-os-companion'); ?></strong>
                        <?php echo esc_html__('The companion plugin still runs, but WooCommerce read summaries will be unavailable until WooCommerce is installed and active. This is a warning, not an error.', 'wordpress-commerce-os-companion'); ?>
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
                    <?php echo esc_html__('Do not paste WordPress admin passwords, application passwords, WooCommerce consumer keys/secrets, hosting/cPanel/FTP credentials, or API provider keys here. This plugin never asks for credentials.', 'wordpress-commerce-os-companion'); ?>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Next steps', 'wordpress-commerce-os-companion'); ?></h2>
                    <p><?php echo esc_html__('Secure backend connection will be handled later via the backend/proxy handshake. No credentials are collected or stored by this plugin, and it makes no network requests.', 'wordpress-commerce-os-companion'); ?></p>
                    <p class="wcos-hint"><?php echo esc_html__('Admin-only REST endpoints: /wp-json/wcos/v1/status, /health, /connection, /woocommerce/summary, /woocommerce/products, /woocommerce/orders, /woocommerce/customers.', 'wordpress-commerce-os-companion'); ?></p>
                </div>
            </div>
            <?php
        }
    }
}
