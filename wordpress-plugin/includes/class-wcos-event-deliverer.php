<?php
/**
 * Event deliverer (WCOS_Event_Deliverer).
 *
 * Drains the local event queue to POST /plugin/events with idempotency keys. Failed batches are
 * retried on the next scheduled run; delivered events are removed from the local queue.
 *
 * @package WordPress_Commerce_OS_Companion
 */

defined('ABSPATH') || exit;

if (!class_exists('WCOS_Event_Deliverer')) {
    final class WCOS_Event_Deliverer {

        const MAX_BATCH = 20;

        /**
         * @return array<string,mixed>
         */
        public static function deliver_batch() {
            if (!WCOS_Settings::is_configured()) {
                return array('ok' => false, 'error' => 'not configured');
            }

            $pending = WCOS_Event_Store::list_events(self::MAX_BATCH);
            if (empty($pending)) {
                return array('ok' => true, 'delivered' => 0);
            }

            $site_id   = WCOS_Settings::get_site_id();
            $tenant_id = WCOS_Settings::get_tenant_id();
            $payload   = array('events' => array());

            foreach ($pending as $evt) {
                $payload['events'][] = array(
                    'idempotencyKey'   => isset($evt['idempotency_key']) ? (string) $evt['idempotency_key'] : '',
                    'type'             => isset($evt['event_type']) ? (string) $evt['event_type'] : 'unknown',
                    'entityType'       => isset($evt['resource_type']) ? (string) $evt['resource_type'] : null,
                    'entityExternalId' => isset($evt['resource_id']) ? (string) $evt['resource_id'] : null,
                    'occurredAt'       => isset($evt['occurred_at']) ? (string) $evt['occurred_at'] : gmdate('c'),
                    'summary'          => isset($evt['payload_summary']) ? $evt['payload_summary'] : array(),
                    'siteId'           => $site_id,
                    'tenantId'         => $tenant_id,
                );
            }

            $result = WCOS_Backend_Client::post('/events', $payload);
            if (!empty($result['ok'])) {
                foreach ($pending as $evt) {
                    if (isset($evt['event_id'])) {
                        WCOS_Event_Store::remove_event($evt['event_id']);
                    }
                }
                WCOS_Audit::add_entry('backend.events', 'event', null, array(
                    'count' => count($pending),
                    'ok'    => true,
                ));
                return array('ok' => true, 'delivered' => count($pending));
            }

            WCOS_Audit::add_entry('backend.events', 'event', null, array(
                'count'  => count($pending),
                'ok'     => false,
                'status' => isset($result['status']) ? (int) $result['status'] : 0,
            ));
            return array('ok' => false, 'error' => isset($result['error']) ? $result['error'] : 'delivery failed');
        }
    }
}
