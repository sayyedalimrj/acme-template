<?php
/**
 * Local audit log (WCOS_Audit).
 *
 * Stores small, summary-only, redacted audit entries for plugin actions in a single capped
 * option. NO secrets, NO full request bodies, NO PII. Local only — never delivered anywhere.
 * Action names are kept compatible with the backend `AuditAction` taxonomy where relevant.
 * See SECURITY.md.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Audit')) {
    /**
     * Capped, summary-only local audit log.
     */
    final class WCOS_Audit {

        const OPTION = 'wcos_audit_log';
        const MAX_ENTRIES = 100;

        /**
         * Allowed audit actions.
         *
         * @return string[]
         */
        public static function allowed_actions() {
            return array(
                'settings.saved',
                'backend.handshake',
                'backend.sync',
                'backend.events',
                'backend.health',
                'event.queued',
                'event.queue_cleared',
                'webhook.delivery.placeholder.updated',
                'controlled_action.requested',
                'controlled_action.rejected',
                'connection.local_ready',
                'connection.disconnected',
            );
        }

        /**
         * Read the raw stored entries.
         *
         * @return array<int,array<string,mixed>>
         */
        private static function read() {
            $entries = get_option(self::OPTION, array());

            return is_array($entries) ? $entries : array();
        }

        /**
         * Persist entries (autoload disabled to avoid bloating every page load).
         *
         * @param array<int,array<string,mixed>> $entries Entries.
         * @return void
         */
        private static function write($entries) {
            if (get_option(self::OPTION) === false) {
                add_option(self::OPTION, $entries, '', 'no');
            } else {
                update_option(self::OPTION, $entries);
            }
        }

        /**
         * Add a summary-only audit entry. The summary is redacted and reduced to scalars.
         *
         * @param string               $action      One of allowed_actions().
         * @param string               $target_type Target type (e.g. event, connection, action).
         * @param string|int|null       $target_id   Non-secret target reference.
         * @param array<string,mixed>   $summary     Small, non-secret summary.
         * @return bool Whether the entry was recorded.
         */
        public static function add_entry($action, $target_type, $target_id = null, $summary = array()) {
            if (!in_array($action, self::allowed_actions(), true)) {
                return false;
            }

            $entry = array(
                'id'          => 'audit_' . substr(md5($action . '|' . (string) $target_id . '|' . microtime(true)), 0, 16),
                'action'      => $action,
                'target_type' => is_string($target_type) ? $target_type : 'unknown',
                'target_id'   => ($target_id === null) ? null : (string) $target_id,
                'summary'     => WCOS_Redaction::redact_array(self::scalars_only($summary)),
                'at'          => function_exists('current_time') ? current_time('c') : gmdate('c'),
            );

            $entries   = self::read();
            $entries[] = $entry;
            if (count($entries) > self::MAX_ENTRIES) {
                $entries = array_slice($entries, -self::MAX_ENTRIES);
            }
            self::write($entries);

            return true;
        }

        /**
         * Reduce a summary to scalar key/value pairs only (drop arrays/objects).
         *
         * @param mixed $summary Candidate summary.
         * @return array<string,mixed>
         */
        private static function scalars_only($summary) {
            if (!is_array($summary)) {
                return array();
            }
            $out = array();
            foreach ($summary as $key => $value) {
                if (!is_string($key) || is_array($value) || is_object($value)) {
                    continue;
                }
                $out[$key] = $value;
            }

            return $out;
        }

        /**
         * List recent entries, most recent first.
         *
         * @param int $limit Max entries.
         * @return array<int,array<string,mixed>>
         */
        public static function list_entries($limit = 20) {
            $limit   = is_numeric($limit) ? max(1, min(self::MAX_ENTRIES, (int) $limit)) : 20;
            $entries = array_reverse(self::read());

            return array_slice($entries, 0, $limit);
        }

        /**
         * Clear all audit entries.
         *
         * @return void
         */
        public static function clear_entries() {
            self::write(array());
        }

        /**
         * Non-secret audit summary.
         *
         * @return array<string,mixed>
         */
        public static function get_summary() {
            $entries = self::read();

            return array(
                'count'      => count($entries),
                'max'        => self::MAX_ENTRIES,
                'newest_at'  => empty($entries) ? null : $entries[count($entries) - 1]['at'],
            );
        }
    }
}
