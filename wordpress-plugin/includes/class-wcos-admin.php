<?php
/**
 * Admin page (WCOS_Admin).
 *
 * Adds a single top-level "WordPress Commerce OS" menu with an admin-only page showing:
 * Connection, the WooCommerce read-only bridge, the local Event bridge (queue + test/clear),
 * the Webhook delivery placeholder, the Controlled actions list (all disabled), the local
 * Audit log, health checks, a security notice, and next steps.
 *
 * All buttons post to admin-post.php and update ONLY non-secret local options/queue (guarded
 * by `manage_options` + `check_admin_referer`). There are NO credential inputs, NO fields that
 * accept or store secrets, and NO mutation of WooCommerce data anywhere on this page.
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
            add_action('admin_post_wcos_add_test_event', array(__CLASS__, 'handle_add_test_event'));
            add_action('admin_post_wcos_clear_events', array(__CLASS__, 'handle_clear_events'));
            add_action('admin_post_wcos_webhook_local_queue', array(__CLASS__, 'handle_webhook_local_queue'));
            add_action('admin_post_wcos_webhook_disable', array(__CLASS__, 'handle_webhook_disable'));
            add_action('admin_post_wcos_clear_audit', array(__CLASS__, 'handle_clear_audit'));
            add_action('admin_post_wcos_build_preview', array(__CLASS__, 'handle_build_preview'));
            add_action('admin_post_wcos_delivery_local_preview', array(__CLASS__, 'handle_delivery_local_preview'));
            add_action('admin_post_wcos_delivery_disable', array(__CLASS__, 'handle_delivery_disable'));
            // Production backend connection.
            add_action('admin_post_wcos_save_settings', array(__CLASS__, 'handle_save_settings'));
            add_action('admin_post_wcos_handshake', array(__CLASS__, 'handle_handshake'));
            add_action('admin_post_wcos_test_connection', array(__CLASS__, 'handle_test_connection'));
            add_action('admin_post_wcos_sync_now', array(__CLASS__, 'handle_sync_now'));
            add_action('admin_post_wcos_full_sync', array(__CLASS__, 'handle_full_sync'));
            add_action('admin_post_wcos_clear_connection', array(__CLASS__, 'handle_clear_connection'));
        }

        /**
         * Save the backend connection settings (URL, site id, tenant id, signing secret).
         *
         * @return void
         */
        public static function handle_save_settings() {
            if (!WCOS_Capabilities::current_user_can('manage_local_connection_state')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_save_settings');
            $input = array(
                'backend_url'    => isset($_POST['backend_url']) ? wp_unslash($_POST['backend_url']) : '',
                'site_id'        => isset($_POST['site_id']) ? wp_unslash($_POST['site_id']) : '',
                'tenant_id'      => isset($_POST['tenant_id']) ? wp_unslash($_POST['tenant_id']) : '',
                'signing_secret' => isset($_POST['signing_secret']) ? wp_unslash($_POST['signing_secret']) : '',
            );
            WCOS_Settings::save($input);
            WCOS_Audit::add_entry('settings.saved', 'connection', null, array('source' => 'admin'));
            self::redirect_with_notice('settings_saved');
        }

        /**
         * Perform the signed backend handshake.
         *
         * @return void
         */
        public static function handle_handshake() {
            if (!WCOS_Capabilities::current_user_can('manage_local_connection_state')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_handshake');
            $result = WCOS_Backend_Client::handshake();
            self::redirect_with_notice(!empty($result['ok']) ? 'handshake_ok' : 'handshake_failed');
        }

        /**
         * Deliver a signed sync now.
         *
         * @return void
         */
        public static function handle_sync_now() {
            if (!WCOS_Capabilities::current_user_can_manage()) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_sync_now');
            WCOS_Sync_Engine::schedule_incremental_sync();
            self::redirect_with_notice('sync_scheduled');
        }

        /**
         * Test backend connection (signed health).
         *
         * @return void
         */
        public static function handle_test_connection() {
            if (!WCOS_Capabilities::current_user_can('manage_local_connection_state')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_test_connection');
            $result = WCOS_Backend_Client::test_connection();
            self::redirect_with_notice(!empty($result['ok']) ? 'test_ok' : 'test_failed');
        }

        /**
         * Schedule a full chunked sync (background).
         *
         * @return void
         */
        public static function handle_full_sync() {
            if (!WCOS_Capabilities::current_user_can_manage()) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_full_sync');
            WCOS_Sync_Engine::schedule_full_sync();
            self::redirect_with_notice('full_sync_scheduled');
        }

        /**
         * Clear local connection settings (disconnect / reconnect).
         *
         * @return void
         */
        public static function handle_clear_connection() {
            if (!WCOS_Capabilities::current_user_can('manage_local_connection_state')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_clear_connection');
            WCOS_Connection::disconnect();
            WCOS_Audit::add_entry('connection.disconnected', 'connection', null, array('source' => 'admin'));
            self::redirect_with_notice('disconnected');
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
         * Handle "Add test event" (enqueues a synthetic, PII-free event locally).
         *
         * @return void
         */
        public static function handle_add_test_event() {
            if (!WCOS_Capabilities::current_user_can('manage_event_queue')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_add_test_event');
            WCOS_Event_Bridge::record_test_event('order.created');
            self::redirect_with_notice('event_added');
        }

        /**
         * Handle "Clear local queue".
         *
         * @return void
         */
        public static function handle_clear_events() {
            if (!WCOS_Capabilities::current_user_can('manage_event_queue')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_clear_events');
            WCOS_Event_Store::clear_events();
            WCOS_Audit::add_entry('event.queue_cleared', 'event', null, array('source' => 'admin'));
            self::redirect_with_notice('events_cleared');
        }

        /**
         * Handle "Set local queue only" (webhook delivery placeholder).
         *
         * @return void
         */
        public static function handle_webhook_local_queue() {
            if (!WCOS_Capabilities::current_user_can('manage_webhook_config')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_webhook_local_queue');
            WCOS_Webhook_Config::mark_local_queue_only();
            self::redirect_with_notice('webhook_updated');
        }

        /**
         * Handle "Disable delivery" (webhook delivery placeholder).
         *
         * @return void
         */
        public static function handle_webhook_disable() {
            if (!WCOS_Capabilities::current_user_can('manage_webhook_config')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_webhook_disable');
            WCOS_Webhook_Config::disable_delivery();
            self::redirect_with_notice('webhook_updated');
        }

        /**
         * Handle "Clear audit log".
         *
         * @return void
         */
        public static function handle_clear_audit() {
            if (!WCOS_Capabilities::current_user_can('manage_audit_log')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_clear_audit');
            WCOS_Audit::clear_entries();
            self::redirect_with_notice('audit_cleared');
        }

        /**
         * Handle "Build / refresh preview" (purely local; builds nothing persistent).
         *
         * @return void
         */
        public static function handle_build_preview() {
            if (!WCOS_Capabilities::current_user_can_manage()) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_build_preview');
            // Nothing to persist — the preview is rebuilt on render. This just refreshes.
            self::redirect_with_notice('preview_built');
        }

        /**
         * Handle "Set local preview only" (delivery placeholder; no network).
         *
         * @return void
         */
        public static function handle_delivery_local_preview() {
            if (!WCOS_Capabilities::current_user_can('manage_webhook_config')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_delivery_local_preview');
            WCOS_Delivery::mark_local_preview_only();
            self::redirect_with_notice('delivery_updated');
        }

        /**
         * Handle "Disable delivery" (delivery placeholder; no network).
         *
         * @return void
         */
        public static function handle_delivery_disable() {
            if (!WCOS_Capabilities::current_user_can('manage_webhook_config')) {
                wp_die(esc_html__('You do not have permission to perform this action.', 'wordpress-commerce-os-companion'));
            }
            check_admin_referer('wcos_delivery_disable');
            WCOS_Delivery::disable_delivery();
            self::redirect_with_notice('delivery_updated');
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
            } elseif ('event_added' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Test event queued locally.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('A synthetic, PII-free event was added to the local queue. Nothing was sent anywhere.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('events_cleared' === $notice) {
                echo '<div class="wcos-notice wcos-notice-warning"><strong>'
                    . esc_html__('Local event queue cleared.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('All locally queued event summaries were removed.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('webhook_updated' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Webhook delivery placeholder updated.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('No URL or secret is stored; no delivery occurs.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('audit_cleared' === $notice) {
                echo '<div class="wcos-notice wcos-notice-warning"><strong>'
                    . esc_html__('Audit log cleared.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('All local audit entries were removed.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('preview_built' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Sync preview refreshed.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('The read-only package was rebuilt locally. No data was sent anywhere.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('delivery_updated' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Delivery setting updated.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('Delivery remains local/disabled. No destination URL or secret is stored and nothing is sent.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('settings_saved' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Backend connection saved.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('Now run the handshake to verify the connection.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('handshake_ok' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Handshake successful.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('The store is connected to your backend.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('handshake_failed' === $notice) {
                echo '<div class="wcos-notice wcos-notice-warning"><strong>'
                    . esc_html__('Handshake failed.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('Check the backend URL, site id, tenant id, and signing secret, then try again.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('sync_ok' === $notice) {
                echo '<div class="wcos-notice wcos-notice-success"><strong>'
                    . esc_html__('Sync delivered.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('A signed, read-only data package was sent to your backend.', 'wordpress-commerce-os-companion')
                    . '</div>';
            } elseif ('sync_failed' === $notice) {
                echo '<div class="wcos-notice wcos-notice-warning"><strong>'
                    . esc_html__('Sync failed.', 'wordpress-commerce-os-companion')
                    . '</strong>' . esc_html__('Verify the connection settings and that the handshake succeeded.', 'wordpress-commerce-os-companion')
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
            $event_status      = WCOS_Event_Bridge::get_event_bridge_status();
            $events            = WCOS_Event_Store::list_events(10);
            $webhook_config    = WCOS_Webhook_Config::get_config_summary();
            $actions           = WCOS_Controlled_Actions::list_supported_actions();
            $audit_entries     = WCOS_Audit::list_entries(10);
            $package_summary   = WCOS_Sync_Package::get_package_summary();
            $delivery          = WCOS_Delivery::get_delivery_summary();
            $delivery_security = WCOS_Delivery::get_delivery_security_summary();
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
                    <p class="wcos-hint"><?php echo esc_html__('These buttons only update local, non-secret state. Use the “Backend connection” card below to connect to your WordPress Commerce OS backend.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

                <?php
                $settings_configured = WCOS_Settings::is_configured();
                $has_secret          = WCOS_Settings::has_signing_secret();
                ?>
                <div class="wcos-card">
                    <h2><?php echo esc_html__('Backend connection', 'wordpress-commerce-os-companion'); ?></h2>
                    <p class="wcos-hint">
                        <?php echo esc_html__('Paste these values from your WordPress Commerce OS dashboard (Connect site → Plugin mode). The signing secret is shown only once there.', 'wordpress-commerce-os-companion'); ?>
                    </p>
                    <form method="post" action="<?php echo esc_url($action_url); ?>">
                        <input type="hidden" name="action" value="wcos_save_settings" />
                        <?php wp_nonce_field('wcos_save_settings'); ?>
                        <table class="wcos-table">
                            <tbody>
                                <tr>
                                    <th><label for="wcos-backend-url"><?php echo esc_html__('Backend URL', 'wordpress-commerce-os-companion'); ?></label></th>
                                    <td><input type="url" id="wcos-backend-url" name="backend_url" class="regular-text" placeholder="https://api.example.com/plugin" value="<?php echo esc_attr(WCOS_Settings::get_backend_url()); ?>" /></td>
                                </tr>
                                <tr>
                                    <th><label for="wcos-site-id"><?php echo esc_html__('Site ID', 'wordpress-commerce-os-companion'); ?></label></th>
                                    <td><input type="text" id="wcos-site-id" name="site_id" class="regular-text" value="<?php echo esc_attr(WCOS_Settings::get_site_id()); ?>" /></td>
                                </tr>
                                <tr>
                                    <th><label for="wcos-tenant-id"><?php echo esc_html__('Tenant ID', 'wordpress-commerce-os-companion'); ?></label></th>
                                    <td><input type="text" id="wcos-tenant-id" name="tenant_id" class="regular-text" value="<?php echo esc_attr(WCOS_Settings::get_tenant_id()); ?>" /></td>
                                </tr>
                                <tr>
                                    <th><label for="wcos-signing-secret"><?php echo esc_html__('Signing secret', 'wordpress-commerce-os-companion'); ?></label></th>
                                    <td>
                                        <input type="password" id="wcos-signing-secret" name="signing_secret" class="regular-text" autocomplete="new-password" placeholder="<?php echo $has_secret ? esc_attr__('•••••••• (configured — leave blank to keep)', 'wordpress-commerce-os-companion') : ''; ?>" />
                                        <p class="wcos-hint"><?php echo esc_html__('Stored securely server-side in WordPress; never shown again. Leave blank to keep the current secret.', 'wordpress-commerce-os-companion'); ?></p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <button type="submit" class="button button-primary"><?php echo esc_html__('Save connection', 'wordpress-commerce-os-companion'); ?></button>
                    </form>
                    <div class="wcos-actions" style="margin-top:12px;">
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_handshake" />
                            <?php wp_nonce_field('wcos_handshake'); ?>
                            <button type="submit" class="button button-primary" <?php disabled(!$settings_configured); ?>><?php echo esc_html__('اتصال (Handshake)', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_test_connection" />
                            <?php wp_nonce_field('wcos_test_connection'); ?>
                            <button type="submit" class="button" <?php disabled(!$settings_configured); ?>><?php echo esc_html__('تست اتصال', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_full_sync" />
                            <?php wp_nonce_field('wcos_full_sync'); ?>
                            <button type="submit" class="button" <?php disabled(!$settings_configured); ?>><?php echo esc_html__('همگام‌سازی کامل', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_clear_connection" />
                            <?php wp_nonce_field('wcos_clear_connection'); ?>
                            <button type="submit" class="button" <?php disabled(!$settings_configured); ?>><?php echo esc_html__('قطع اتصال محلی', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                    </div>
                    <?php $sync_status = WCOS_Sync_State::get_status_summary(); ?>
                    <table class="wcos-table" style="margin-top:12px;">
                        <tbody>
                            <tr><th><?php echo esc_html__('وضعیت اتصال', 'wordpress-commerce-os-companion'); ?></th><td><?php echo esc_html(WCOS_Connection::get_status()); ?></td></tr>
                            <tr><th><?php echo esc_html__('آخرین Handshake', 'wordpress-commerce-os-companion'); ?></th><td><?php echo esc_html($sync_status['lastHandshakeAt'] ? (string) $sync_status['lastHandshakeAt'] : '—'); ?></td></tr>
                            <tr><th><?php echo esc_html__('آخرین همگام‌سازی', 'wordpress-commerce-os-companion'); ?></th><td><?php echo esc_html($sync_status['lastSyncAt'] ? (string) $sync_status['lastSyncAt'] : '—'); ?></td></tr>
                            <tr><th><?php echo esc_html__('آخرین رویداد', 'wordpress-commerce-os-companion'); ?></th><td><?php echo esc_html($sync_status['lastEventAt'] ? (string) $sync_status['lastEventAt'] : '—'); ?></td></tr>
                            <tr><th><?php echo esc_html__('صف همگام‌سازی', 'wordpress-commerce-os-companion'); ?></th><td><?php echo esc_html(!empty($sync_status['queue']) ? implode(', ', $sync_status['queue']) : '—'); ?></td></tr>
                            <?php if (!empty($sync_status['lastError'])) : ?>
                            <tr><th><?php echo esc_html__('آخرین خطا', 'wordpress-commerce-os-companion'); ?></th><td><span class="wcos-badge wcos-status-error"><?php echo esc_html((string) $sync_status['lastError']); ?></span></td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                    <p class="wcos-hint">
                        <?php echo esc_html__('Backend URL:', 'wordpress-commerce-os-companion'); ?> <?php echo esc_html(WCOS_Settings::get_backend_url()); ?>
                        · <?php echo $settings_configured
                            ? esc_html__('پیکربندی شده — همگام‌سازی زمان‌بندی‌شده فعال است.', 'wordpress-commerce-os-companion')
                            : esc_html__('پیکربندی نشده.', 'wordpress-commerce-os-companion'); ?>
                    </p>
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
                    <h2><?php echo esc_html__('Read-only sync preview', 'wordpress-commerce-os-companion'); ?></h2>
                    <div class="wcos-notice wcos-notice-warning">
                        <strong><?php echo esc_html__('No data is sent externally yet.', 'wordpress-commerce-os-companion'); ?></strong>
                        <?php echo esc_html__('This builds a redacted, summary-only package locally for preview. Backend delivery is disabled by default.', 'wordpress-commerce-os-companion'); ?>
                    </div>
                    <table class="wcos-table">
                        <tbody>
                            <tr>
                                <th><?php echo esc_html__('Sync status', 'wordpress-commerce-os-companion'); ?></th>
                                <td><span class="wcos-badge wcos-status-ok"><?php echo esc_html__('Local preview', 'wordpress-commerce-os-companion'); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Package timestamp', 'wordpress-commerce-os-companion'); ?></th>
                                <td class="wcos-hint"><?php echo esc_html($package_summary['generated_at']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Products / Orders / Customers', 'wordpress-commerce-os-companion'); ?></th>
                                <td>
                                    <?php echo esc_html(null === $package_summary['product_count'] ? $dash : (string) $package_summary['product_count']); ?> /
                                    <?php echo esc_html(null === $package_summary['order_count'] ? $dash : (string) $package_summary['order_count']); ?> /
                                    <?php echo esc_html(null === $package_summary['customer_count'] ? $dash : (string) $package_summary['customer_count']); ?>
                                </td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Event queue', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html((string) $package_summary['event_count']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Delivery status', 'wordpress-commerce-os-companion'); ?></th>
                                <td><span class="wcos-badge wcos-badge-muted"><?php echo esc_html($delivery['delivery_status']); ?></span> <span class="wcos-hint"><?php echo esc_html($delivery['destination_label']); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Signature status', 'wordpress-commerce-os-companion'); ?></th>
                                <td><span class="wcos-badge wcos-badge-muted"><?php echo esc_html($delivery_security['signing_status']); ?></span> <span class="wcos-hint"><?php echo esc_html($delivery_security['algorithm']); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Delivery security', 'wordpress-commerce-os-companion'); ?></th>
                                <td>
                                    <?php echo esc_html__('External delivery', 'wordpress-commerce-os-companion'); ?>:
                                    <?php echo $delivery_security['external_delivery'] ? esc_html($yes) : esc_html($no); ?> ·
                                    <?php echo esc_html__('Signing key', 'wordpress-commerce-os-companion'); ?>:
                                    <?php echo $delivery_security['has_signing_key'] ? esc_html($yes) : esc_html($no); ?> ·
                                    <?php echo esc_html__('Replay protection', 'wordpress-commerce-os-companion'); ?>:
                                    <?php echo esc_html($delivery_security['replay_protection']); ?>
                                </td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Signed preview', 'wordpress-commerce-os-companion'); ?></th>
                                <td class="wcos-hint"><?php echo esc_html__('Available (admin REST: /wp-json/wcos/v1/sync/signed-preview)', 'wordpress-commerce-os-companion'); ?></td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="wcos-actions">
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_build_preview" />
                            <?php wp_nonce_field('wcos_build_preview'); ?>
                            <button type="submit" class="button button-primary"><?php echo esc_html__('Build / refresh preview', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_delivery_local_preview" />
                            <?php wp_nonce_field('wcos_delivery_local_preview'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Set local preview only', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_delivery_disable" />
                            <?php wp_nonce_field('wcos_delivery_disable'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Disable delivery', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                    </div>
                    <p class="wcos-hint"><?php echo esc_html__('The full package is available to admins at /wp-json/wcos/v1/sync/package and /wp-json/wcos/v1/sync/preview. No destination URL or secret is stored.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Event bridge', 'wordpress-commerce-os-companion'); ?></h2>
                    <table class="wcos-table">
                        <tbody>
                            <tr>
                                <th><?php echo esc_html__('Bridge status', 'wordpress-commerce-os-companion'); ?></th>
                                <td><span class="wcos-badge wcos-status-ok"><?php echo esc_html__('Local queue only', 'wordpress-commerce-os-companion'); ?></span> <span class="wcos-hint"><?php echo esc_html__('(no external delivery)', 'wordpress-commerce-os-companion'); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Queued events', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html((string) $event_status['queue']['count'] . ' / ' . (string) $event_status['queue']['max']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Supported event types', 'wordpress-commerce-os-companion'); ?></th>
                                <td class="wcos-hint"><?php echo esc_html(implode(', ', $event_status['supported_event_types'])); ?></td>
                            </tr>
                        </tbody>
                    </table>
                    <?php if (!empty($events)) : ?>
                        <table class="wcos-table">
                            <thead>
                                <tr>
                                    <th><?php echo esc_html__('Event', 'wordpress-commerce-os-companion'); ?></th>
                                    <th><?php echo esc_html__('Resource', 'wordpress-commerce-os-companion'); ?></th>
                                    <th><?php echo esc_html__('When', 'wordpress-commerce-os-companion'); ?></th>
                                    <th><?php echo esc_html__('Delivery', 'wordpress-commerce-os-companion'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($events as $event) : ?>
                                    <tr>
                                        <td><?php echo esc_html(isset($event['event_type']) ? $event['event_type'] : ''); ?></td>
                                        <td class="wcos-hint"><?php echo esc_html((isset($event['resource_type']) ? $event['resource_type'] : '') . ' ' . (isset($event['resource_id']) ? $event['resource_id'] : '')); ?></td>
                                        <td class="wcos-hint"><?php echo esc_html(isset($event['occurred_at']) ? $event['occurred_at'] : ''); ?></td>
                                        <td><span class="wcos-badge wcos-badge-muted"><?php echo esc_html(isset($event['delivery_status']) ? $event['delivery_status'] : 'local_only'); ?></span></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                    <div class="wcos-actions">
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_add_test_event" />
                            <?php wp_nonce_field('wcos_add_test_event'); ?>
                            <button type="submit" class="button button-primary"><?php echo esc_html__('Add test event', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_clear_events" />
                            <?php wp_nonce_field('wcos_clear_events'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Clear local queue', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                    </div>
                    <p class="wcos-hint"><?php echo esc_html__('Events are summary-only and stored in a capped local queue. No external delivery happens in this version.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Webhook delivery (placeholder)', 'wordpress-commerce-os-companion'); ?></h2>
                    <table class="wcos-table">
                        <tbody>
                            <tr>
                                <th><?php echo esc_html__('Delivery status', 'wordpress-commerce-os-companion'); ?></th>
                                <td><span class="wcos-badge wcos-badge-muted"><?php echo esc_html($webhook_config['delivery_status']); ?></span></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Destination', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html($webhook_config['destination_label']); ?></td>
                            </tr>
                            <tr>
                                <th><?php echo esc_html__('Secret', 'wordpress-commerce-os-companion'); ?></th>
                                <td><?php echo esc_html__('Not configured', 'wordpress-commerce-os-companion'); ?></td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="wcos-actions">
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_webhook_local_queue" />
                            <?php wp_nonce_field('wcos_webhook_local_queue'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Set local queue only', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_webhook_disable" />
                            <?php wp_nonce_field('wcos_webhook_disable'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Disable delivery', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                    </div>
                    <p class="wcos-hint"><?php echo esc_html__('Real delivery will be configured later through the backend/proxy. No destination URL and no webhook secret are stored here.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Controlled actions', 'wordpress-commerce-os-companion'); ?></h2>
                    <p class="wcos-hint"><?php echo esc_html__('Every action below is disabled. No mutation is possible in this version; future actions require backend permission and audit.', 'wordpress-commerce-os-companion'); ?></p>
                    <table class="wcos-table">
                        <thead>
                            <tr>
                                <th><?php echo esc_html__('Action', 'wordpress-commerce-os-companion'); ?></th>
                                <th><?php echo esc_html__('Status', 'wordpress-commerce-os-companion'); ?></th>
                                <th><?php echo esc_html__('Reason', 'wordpress-commerce-os-companion'); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($actions as $action_row) : ?>
                                <tr>
                                    <td><?php echo esc_html($action_row['action']); ?></td>
                                    <td><span class="wcos-badge wcos-badge-muted"><?php echo esc_html($action_row['status']); ?></span></td>
                                    <td class="wcos-hint"><?php echo esc_html($action_row['reason']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div class="wcos-card">
                    <h2><?php echo esc_html__('Audit (local)', 'wordpress-commerce-os-companion'); ?></h2>
                    <?php if (empty($audit_entries)) : ?>
                        <p class="wcos-hint"><?php echo esc_html__('No audit entries yet.', 'wordpress-commerce-os-companion'); ?></p>
                    <?php else : ?>
                        <table class="wcos-table">
                            <thead>
                                <tr>
                                    <th><?php echo esc_html__('Action', 'wordpress-commerce-os-companion'); ?></th>
                                    <th><?php echo esc_html__('Target', 'wordpress-commerce-os-companion'); ?></th>
                                    <th><?php echo esc_html__('When', 'wordpress-commerce-os-companion'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($audit_entries as $entry) : ?>
                                    <tr>
                                        <td><?php echo esc_html(isset($entry['action']) ? $entry['action'] : ''); ?></td>
                                        <td class="wcos-hint"><?php echo esc_html((isset($entry['target_type']) ? $entry['target_type'] : '') . ' ' . (isset($entry['target_id']) ? (string) $entry['target_id'] : '')); ?></td>
                                        <td class="wcos-hint"><?php echo esc_html(isset($entry['at']) ? $entry['at'] : ''); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                    <div class="wcos-actions">
                        <form method="post" action="<?php echo esc_url($action_url); ?>">
                            <input type="hidden" name="action" value="wcos_clear_audit" />
                            <?php wp_nonce_field('wcos_clear_audit'); ?>
                            <button type="submit" class="button"><?php echo esc_html__('Clear audit log', 'wordpress-commerce-os-companion'); ?></button>
                        </form>
                    </div>
                    <p class="wcos-hint"><?php echo esc_html__('Audit entries are summary-only and local. No secrets or PII are stored.', 'wordpress-commerce-os-companion'); ?></p>
                </div>

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
                    <p class="wcos-hint"><?php echo esc_html__('Admin-only REST endpoints: /wp-json/wcos/v1/status, /health, /connection, /woocommerce/*, /events, /webhook-config, /actions, /audit, /sync/*, /delivery, /signature/status.', 'wordpress-commerce-os-companion'); ?></p>
                </div>
            </div>
            <?php
        }
    }
}
