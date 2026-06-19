/**
 * Plugin sync ingestion — persists normalized read-models + events from a VERIFIED envelope.
 *
 * Signature/replay/timestamp verification happens in the route before this is called. Here we
 * upsert the read-models idempotently and record plugin_event rows (deduped on idempotency_key).
 */
import { query } from '../../db';
import { getSite } from '../sites';

export interface SyncEnvelope {
  schemaVersion: string;
  generatedAt?: string;
  site?: {
    pluginVersion?: string;
    wooVersion?: string;
    wpVersion?: string;
    currency?: string;
  };
  data?: {
    products?: ReadonlyArray<Record<string, unknown>>;
    orders?: ReadonlyArray<Record<string, unknown>>;
    customers?: ReadonlyArray<Record<string, unknown>>;
    coupons?: ReadonlyArray<Record<string, unknown>>;
  };
}

export interface IngestStats {
  products: number;
  orders: number;
  customers: number;
  coupons: number;
}

const n = (v: unknown, d = 0): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};
const s = (v: unknown): string | null => (v === undefined || v === null ? null : String(v));

export async function ingestSyncEnvelope(
  siteId: string,
  tenantId: string,
  envelope: SyncEnvelope,
): Promise<IngestStats> {
  const site = await getSite(siteId);
  const defaultCurrency = envelope.site?.currency ?? site?.currency ?? 'IRT';

  const run = (
    await query<{ id: string }>(
      `INSERT INTO sync_run (site_id, tenant_id, source, status) VALUES ($1, $2, 'plugin', 'running') RETURNING id`,
      [siteId, tenantId],
    )
  )[0];

  const stats: IngestStats = { products: 0, orders: 0, customers: 0, coupons: 0 };
  try {
    for (const p of envelope.data?.products ?? []) {
      const ext = s(p.externalId ?? p.external_id ?? p.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_product (site_id, tenant_id, external_id, name, sku, status, price_minor, currency, stock_status, stock_qty, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET
           name=EXCLUDED.name, sku=EXCLUDED.sku, status=EXCLUDED.status, price_minor=EXCLUDED.price_minor,
           stock_status=EXCLUDED.stock_status, stock_qty=EXCLUDED.stock_qty, updated_at=now()`,
        [
          siteId, tenantId, ext, s(p.name) ?? '', s(p.sku), s(p.status),
          n(p.priceMinor ?? p.price_minor), s(p.currency) ?? defaultCurrency,
          s(p.stockStatus ?? p.stock_status),
          p.stockQty ?? p.stock_qty ?? null,
        ],
      );
      stats.products += 1;
    }

    for (const o of envelope.data?.orders ?? []) {
      const ext = s(o.externalId ?? o.external_id ?? o.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_order (site_id, tenant_id, external_id, number, status, total_minor, currency, customer_name, external_created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET
           number=EXCLUDED.number, status=EXCLUDED.status, total_minor=EXCLUDED.total_minor,
           customer_name=EXCLUDED.customer_name, external_created_at=EXCLUDED.external_created_at, updated_at=now()`,
        [
          siteId, tenantId, ext, s(o.number), s(o.status),
          n(o.totalMinor ?? o.total_minor), s(o.currency) ?? defaultCurrency,
          s(o.customerName ?? o.customer_name), s(o.createdAt ?? o.created_at),
        ],
      );
      stats.orders += 1;
    }

    for (const c of envelope.data?.customers ?? []) {
      const ext = s(c.externalId ?? c.external_id ?? c.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_customer (site_id, tenant_id, external_id, display_name, orders_count, total_spent_minor, currency, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET
           display_name=EXCLUDED.display_name, orders_count=EXCLUDED.orders_count,
           total_spent_minor=EXCLUDED.total_spent_minor, updated_at=now()`,
        [
          siteId, tenantId, ext, s(c.displayName ?? c.display_name),
          n(c.ordersCount ?? c.orders_count), n(c.totalSpentMinor ?? c.total_spent_minor),
          s(c.currency) ?? defaultCurrency,
        ],
      );
      stats.customers += 1;
    }

    for (const c of envelope.data?.coupons ?? []) {
      const ext = s(c.externalId ?? c.external_id ?? c.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_coupon (site_id, tenant_id, external_id, code, discount_type, amount_minor, currency, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET
           code=EXCLUDED.code, discount_type=EXCLUDED.discount_type, amount_minor=EXCLUDED.amount_minor, updated_at=now()`,
        [
          siteId, tenantId, ext, s(c.code), s(c.discountType ?? c.discount_type),
          n(c.amountMinor ?? c.amount_minor), s(c.currency) ?? defaultCurrency,
        ],
      );
      stats.coupons += 1;
    }

    await query(
      `UPDATE sync_run SET status='success', stats=$2, finished_at=now() WHERE id=$1`,
      [run.id, JSON.stringify(stats)],
    );
    await query(
      `UPDATE site SET last_synced_at=now(), last_error=NULL, woo_version=COALESCE($2, woo_version),
              wp_version=COALESCE($3, wp_version), updated_at=now() WHERE id=$1`,
      [siteId, envelope.site?.wooVersion ?? null, envelope.site?.wpVersion ?? null],
    );
    return stats;
  } catch (err) {
    const message = (err as Error).message?.slice(0, 300) ?? 'ingest failed';
    await query(`UPDATE sync_run SET status='failed', error=$2, finished_at=now() WHERE id=$1`, [
      run.id,
      message,
    ]);
    throw err;
  }
}

/** Record plugin events idempotently. Returns count of newly-recorded events. */
export async function ingestEvents(
  siteId: string,
  tenantId: string,
  events: ReadonlyArray<{ idempotencyKey: string; type: string; summary?: unknown }>,
): Promise<number> {
  let recorded = 0;
  for (const e of events) {
    if (!e.idempotencyKey || !e.type) continue;
    const rows = await query<{ id: string }>(
      `INSERT INTO plugin_event (site_id, tenant_id, event_type, idempotency_key, status, summary)
         VALUES ($1, $2, $3, $4, 'processed', $5)
       ON CONFLICT (site_id, idempotency_key) DO NOTHING RETURNING id`,
      [siteId, tenantId, e.type, e.idempotencyKey, e.summary ? JSON.stringify(e.summary) : null],
    );
    if (rows.length > 0) recorded += 1;
  }
  return recorded;
}
