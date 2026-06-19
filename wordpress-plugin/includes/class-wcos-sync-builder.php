<?php
/**
 * Sync envelope builder (WCOS_Sync_Builder).
 *
 * Reads WooCommerce data LOCALLY and builds the camelCase, PII-minimized envelope the backend
 * expects (`services/api` plugin ingest, schemaVersion = "wcos.sync.v1"). Money is converted to
 * integer MINOR units using the store currency exponent (IRR/IRT = 0). Read-only; never mutates.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Sync_Builder')) {
    final class WCOS_Sync_Builder {

        const MAX_RECORDS = 100;

        /** Store currency code (e.g. "IRT"). */
        public static function currency() {
            return function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'IRT';
        }

        /** Minor-unit exponent per currency (0 for Rial/Toman/Yen; default 2). */
        private static function exponent($currency) {
            $zero = array('IRR', 'IRT', 'JPY');
            return in_array(strtoupper((string) $currency), $zero, true) ? 0 : 2;
        }

        /** Convert a major-unit amount string to integer minor units. */
        private static function to_minor($amount, $currency) {
            $exp = self::exponent($currency);
            return (int) round(((float) $amount) * pow(10, $exp));
        }

        /**
         * Build the full sync envelope.
         *
         * @return array<string,mixed>
         */
        public static function build_envelope() {
            $currency = self::currency();
            return array(
                'schemaVersion' => 'wcos.sync.v1',
                'generatedAt'   => gmdate('c'),
                'site'          => array(
                    'pluginVersion' => WCOS_VERSION,
                    'wooVersion'    => WCOS_WooCommerce::version(),
                    'wpVersion'     => function_exists('get_bloginfo') ? get_bloginfo('version') : '',
                    'currency'      => $currency,
                ),
                'data' => array(
                    'products'  => self::products($currency),
                    'orders'    => self::orders($currency),
                    'customers' => self::customers($currency),
                    'coupons'   => self::coupons($currency),
                ),
            );
        }

        private static function products($currency) {
            if (!WCOS_WooCommerce::is_active() || !function_exists('wc_get_products')) {
                return array();
            }
            $items = array();
            $products = wc_get_products(array('limit' => self::MAX_RECORDS, 'status' => 'publish', 'orderby' => 'date', 'order' => 'DESC'));
            foreach ($products as $p) {
                $items[] = array(
                    'externalId'  => (string) $p->get_id(),
                    'name'        => $p->get_name(),
                    'sku'         => $p->get_sku(),
                    'status'      => $p->get_status(),
                    'priceMinor'  => self::to_minor($p->get_price(), $currency),
                    'currency'    => $currency,
                    'stockStatus' => $p->get_stock_status(),
                    'stockQty'    => $p->managing_stock() ? (int) $p->get_stock_quantity() : null,
                );
            }
            return $items;
        }

        private static function orders($currency) {
            if (!WCOS_WooCommerce::is_active() || !function_exists('wc_get_orders')) {
                return array();
            }
            $items = array();
            $orders = wc_get_orders(array('limit' => self::MAX_RECORDS, 'orderby' => 'date', 'order' => 'DESC'));
            foreach ($orders as $o) {
                if (!is_object($o) || !method_exists($o, 'get_id')) {
                    continue;
                }
                $first = method_exists($o, 'get_billing_first_name') ? $o->get_billing_first_name() : '';
                $last  = method_exists($o, 'get_billing_last_name') ? $o->get_billing_last_name() : '';
                $name  = trim($first . ' ' . $last);
                $created = method_exists($o, 'get_date_created') && $o->get_date_created()
                    ? $o->get_date_created()->date('c')
                    : '';
                $items[] = array(
                    'externalId'  => (string) $o->get_id(),
                    'number'      => method_exists($o, 'get_order_number') ? (string) $o->get_order_number() : (string) $o->get_id(),
                    'status'      => $o->get_status(),
                    'totalMinor'  => self::to_minor($o->get_total(), $currency),
                    'currency'    => $currency,
                    'customerName' => $name !== '' ? $name : null,
                    'createdAt'   => $created,
                );
            }
            return $items;
        }

        private static function customers($currency) {
            if (!function_exists('get_users')) {
                return array();
            }
            $items = array();
            $users = get_users(array('role' => 'customer', 'number' => self::MAX_RECORDS, 'orderby' => 'registered', 'order' => 'DESC'));
            foreach ($users as $u) {
                $orders_count = 0;
                $total_spent  = 0;
                if (class_exists('WC_Customer')) {
                    try {
                        $c = new WC_Customer($u->ID);
                        $orders_count = (int) $c->get_order_count();
                        $total_spent  = $c->get_total_spent();
                    } catch (Exception $e) {
                        // ignore; fall back to zeros
                    }
                }
                $name = trim((string) get_user_meta($u->ID, 'first_name', true) . ' ' . (string) get_user_meta($u->ID, 'last_name', true));
                $items[] = array(
                    'externalId'       => (string) $u->ID,
                    'displayName'      => $name !== '' ? $name : $u->display_name,
                    'ordersCount'      => $orders_count,
                    'totalSpentMinor'  => self::to_minor($total_spent, $currency),
                    'currency'         => $currency,
                );
            }
            return $items;
        }

        private static function coupons($currency) {
            if (!function_exists('get_posts')) {
                return array();
            }
            $items = array();
            $posts = get_posts(array('post_type' => 'shop_coupon', 'posts_per_page' => self::MAX_RECORDS, 'post_status' => 'publish'));
            foreach ($posts as $post) {
                if (!function_exists('new_WC_Coupon') && !class_exists('WC_Coupon')) {
                    break;
                }
                try {
                    $coupon = new WC_Coupon($post->ID);
                    $items[] = array(
                        'externalId'    => (string) $post->ID,
                        'code'          => $coupon->get_code(),
                        'discountType'  => $coupon->get_discount_type(),
                        'amountMinor'   => self::to_minor($coupon->get_amount(), $currency),
                        'currency'      => $currency,
                    );
                } catch (Exception $e) {
                    // skip malformed coupon
                }
            }
            return $items;
        }
    }
}
