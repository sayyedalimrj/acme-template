<?php
/**
 * Event sanitizer (WCOS_Event_Sanitizer).
 *
 * Produces small, summary-only, PII-minimized event payloads from WooCommerce objects (or
 * plain arrays). NEVER returns full WooCommerce objects, raw meta, addresses, phone numbers,
 * raw emails, IPs, user agents, payment details, order notes, or full line items. Customers
 * are reduced to a generic/masked label. See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Event_Sanitizer')) {
    /**
     * Build safe event payload summaries.
     */
    final class WCOS_Event_Sanitizer {

        /** Maximum number of keys kept in a generic event summary. */
        const MAX_SUMMARY_KEYS = 12;

        /**
         * Keep only safe scalar fields from an arbitrary summary: drop secret/PII-named keys,
         * drop nested arrays/objects, and redact string values.
         *
         * @param string              $event_type Event type (reserved for future per-type rules).
         * @param array<string,mixed> $summary    Candidate summary.
         * @return array<string,mixed>
         */
        public static function sanitize_event_summary($event_type, $summary) {
            unset($event_type); // not needed yet; kept for forward-compatible signature.
            if (!is_array($summary)) {
                return array();
            }

            $safe  = array();
            $count = 0;
            foreach ($summary as $key => $value) {
                if ($count >= self::MAX_SUMMARY_KEYS) {
                    break;
                }
                if (!is_string($key)) {
                    continue;
                }
                if (WCOS_Redaction::contains_sensitive_key($key)) {
                    continue;
                }
                $lower = strtolower($key);
                if (
                    strpos($lower, 'email') !== false
                    || strpos($lower, 'phone') !== false
                    || strpos($lower, 'address') !== false
                ) {
                    continue;
                }
                if (is_array($value) || is_object($value)) {
                    continue;
                }
                if (is_string($value)) {
                    $value = WCOS_Redaction::redact_text($value);
                }
                $safe[$key] = $value;
                $count++;
            }

            return $safe;
        }

        /**
         * Order event summary (no PII). Reuses the read-bridge sanitizer and keeps a small set.
         *
         * @param mixed $order WC_Order or array.
         * @return array<string,mixed>
         */
        public static function sanitize_order_event_summary($order) {
            $full = WCOS_Data_Sanitizer::sanitize_order_summary($order);
            if (!is_array($full)) {
                return array();
            }

            return array(
                'status'         => isset($full['status']) ? $full['status'] : null,
                'currency'       => isset($full['currency']) ? $full['currency'] : null,
                'total'          => isset($full['total']) ? $full['total'] : null,
                'item_count'     => isset($full['item_count']) ? $full['item_count'] : null,
                'created_date'   => isset($full['created_date']) ? $full['created_date'] : null,
                'customer_label' => isset($full['customer_label']) ? $full['customer_label'] : null,
            );
        }

        /**
         * Product event summary (no raw meta).
         *
         * @param mixed $product WC_Product or array.
         * @return array<string,mixed>
         */
        public static function sanitize_product_event_summary($product) {
            $full = WCOS_Data_Sanitizer::sanitize_product_summary($product);
            if (!is_array($full)) {
                return array();
            }

            return array(
                'name'           => isset($full['name']) ? $full['name'] : null,
                'sku'            => isset($full['sku']) ? $full['sku'] : null,
                'status'         => isset($full['status']) ? $full['status'] : null,
                'stock_status'   => isset($full['stock_status']) ? $full['stock_status'] : null,
                'stock_quantity' => isset($full['stock_quantity']) ? $full['stock_quantity'] : null,
                'price'          => isset($full['price']) ? $full['price'] : null,
                'type'           => isset($full['type']) ? $full['type'] : null,
            );
        }

        /**
         * Customer event summary (generic label only — no name/email/phone/address).
         *
         * @param mixed $customer WC_Customer or array.
         * @return array<string,mixed>
         */
        public static function sanitize_customer_event_summary($customer) {
            $full = WCOS_Data_Sanitizer::sanitize_customer_summary($customer);
            if (!is_array($full)) {
                return array();
            }

            return array(
                'label'        => isset($full['label']) ? $full['label'] : null,
                'order_count'  => isset($full['order_count']) ? $full['order_count'] : null,
                'date_created' => isset($full['date_created']) ? $full['date_created'] : null,
            );
        }

        /**
         * Build a NON-SECRET idempotency key placeholder (a hash of public, non-secret inputs).
         *
         * @param string         $event_type  Event type.
         * @param string|int     $resource_id Resource id.
         * @param string         $occurred_at ISO-8601 timestamp.
         * @return string
         */
        public static function build_idempotency_key($event_type, $resource_id, $occurred_at) {
            $seed = (string) $event_type . '|' . (string) $resource_id . '|' . (string) $occurred_at;

            return 'idemp_' . substr(md5($seed), 0, 24);
        }
    }
}
