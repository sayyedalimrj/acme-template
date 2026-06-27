/**
 * Plugin event processor — applies incremental events after idempotent ingest.
 *
 * Events that include enough summary data update read-model timestamps; others are recorded for
 * audit and may trigger a lightweight flag on the site for the plugin to pull that entity.
 */
import { query } from '../../db';
import { audit } from '../audit';

export interface PluginEventInput {
  idempotencyKey: string;
  type: string;
  entityType?: string;
  entityExternalId?: string;
  occurredAt?: string;
  summary?: unknown;
}

/** Map event type prefix to a coarse entity for sync hints. */
function entityFromType(type: string): string | null {
  if (type.startsWith('product.')) return 'products';
  if (type.startsWith('order.')) return 'orders';
  if (type.startsWith('customer.')) return 'customers';
  if (type.startsWith('coupon.')) return 'coupons';
  return null;
}

/**
 * After events are stored, bump plugin_connection.last_event_at and audit each new event.
 * Full entity re-pull is left to the plugin's incremental sync on the next chunk cycle.
 */
export async function processPluginEvents(
  siteId: string,
  tenantId: string,
  events: ReadonlyArray<PluginEventInput>,
  newlyRecorded: number,
): Promise<void> {
  if (newlyRecorded <= 0) return;

  await query(`UPDATE plugin_connection SET last_event_at = now() WHERE site_id = $1`, [siteId]);

  for (const e of events) {
    const entity = e.entityType ?? entityFromType(e.type);
    await audit({
      action: 'plugin.event.received',
      targetType: 'site',
      targetId: siteId,
      meta: {
        tenantId,
        eventType: e.type,
        entity,
        entityExternalId: e.entityExternalId ?? null,
        idempotencyKey: e.idempotencyKey,
      },
    });
  }
}
