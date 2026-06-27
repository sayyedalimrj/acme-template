<?php
/**
 * Local event store (WCOS_Event_Store).
 *
 * A simple, capped, LOCAL-ONLY queue of summary-only event envelopes stored in a single
 * non-autoloaded option. No database tables, no background jobs, no delivery to a backend,
 * no raw PII, no secrets. Stored envelopes are redacted again on write as defense-in-depth.
 * See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Event_Store')) {
    /**
     * Capped local event queue.
     */
    final class WCOS_Event_Store {

        const OPTION = 'wcos_event_queue';
        const MAX_QUEUE = 200;

        /**
         * Read the raw queue.
         *
         * @return array<int,array<string,mixed>>
         */
        private static function read() {
            $queue = get_option(self::OPTION, array());

            return is_array($queue) ? $queue : array();
        }

        /**
         * Persist the queue (autoload disabled).
         *
         * @param array<int,array<string,mixed>> $queue Queue.
         * @return void
         */
        private static function write($queue) {
            if (get_option(self::OPTION) === false) {
                add_option(self::OPTION, $queue, '', 'no');
            } else {
                update_option(self::OPTION, $queue);
            }
        }

        /**
         * Add a summary-only event envelope to the queue (capped, redacted). Local only.
         *
         * @param array<string,mixed> $event Event envelope.
         * @return int New queue size.
         */
        public static function add_event($event) {
            if (!is_array($event)) {
                return count(self::read());
            }

            $queue   = self::read();
            $queue[] = WCOS_Redaction::redact_array($event);
            if (count($queue) > self::MAX_QUEUE) {
                $queue = array_slice($queue, -self::MAX_QUEUE);
            }
            self::write($queue);

            return count($queue);
        }

        /**
         * List recent events, most recent first.
         *
         * @param int $limit Max events.
         * @return array<int,array<string,mixed>>
         */
        public static function list_events($limit = 20) {
            $limit = is_numeric($limit) ? max(1, min(self::MAX_QUEUE, (int) $limit)) : 20;
            $queue = array_reverse(self::read());

            return array_slice($queue, 0, $limit);
        }

        /**
         * Clear the local queue.
         *
         * @return void
         */
        public static function clear_events() {
            self::write(array());
        }

        /**
         * Remove an event by event_id after successful delivery.
         *
         * @param string $event_id Event id.
         * @return void
         */
        public static function remove_event($event_id) {
            $queue = self::read();
            $out   = array();
            foreach ($queue as $evt) {
                if (!is_array($evt)) {
                    continue;
                }
                if (isset($evt['event_id']) && (string) $evt['event_id'] === (string) $event_id) {
                    continue;
                }
                $out[] = $evt;
            }
            self::write($out);
        }

        /** @return int */
        public static function count() {
            return count(self::read());
        }

        /**
         * Non-secret queue summary.
         *
         * @return array<string,mixed>
         */
        public static function get_queue_summary() {
            $queue = self::read();
            $count = count($queue);

            return array(
                'count'           => $count,
                'max'             => self::MAX_QUEUE,
                'delivery_status' => WCOS_Settings::is_configured() ? 'queued_for_delivery' : 'local_only',
                'oldest_at'       => $count > 0 && isset($queue[0]['occurred_at']) ? $queue[0]['occurred_at'] : null,
                'newest_at'       => $count > 0 && isset($queue[$count - 1]['occurred_at']) ? $queue[$count - 1]['occurred_at'] : null,
            );
        }
    }
}
