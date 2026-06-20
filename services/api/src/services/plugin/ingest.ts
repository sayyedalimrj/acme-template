/**
 * Plugin sync ingestion — persists normalized read-models + events from a VERIFIED envelope.
 *
 * Signature/replay/timestamp verification happens in the route before this is called. Here we
 * upsert the read-models idempotently and record plugin_event rows (deduped on idempotency_key).
 */
import { query } from '../../db';
import { getSite, upsertProductFull } from '../sites';
import type { NormalizedProduct, NormalizedVariation } from '../woocommerce/wooClient';

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
    categories?: ReadonlyArray<Record<string, unknown>>;
    tags?: ReadonlyArray<Record<string, unknown>>;
    brands?: ReadonlyArray<Record<string, unknown>>;
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
const nq = (v: unknown): number | null => (v === undefined || v === null ? null : Number(v));

/**
 * Map a plugin-envelope product item to a NormalizedProduct so the SAME persistence path
 * (`upsertProductFull`) preserves the full structure — categories, tags, brands, attributes,
 * images, variations, meta_data, and the raw payload — exactly like the REST sync. Missing
 * sections default to empty/null, so a minimal (flat) envelope still upserts the core fields and
 * loses nothing it didn't send.
 */
function envelopeProductToNormalized(
  p: Record<string, unknown>,
  defaultCurrency: string,
): { product: NormalizedProduct; variations: NormalizedVariation[] } {
  const arr = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  const ref = (c: Record<string, unknown>) => ({
    externalId: String(c.externalId ?? c.external_id ?? c.id ?? ''),
    name: s(c.name),
    slug: s(c.slug),
  });
  const currency = s(p.currency) ?? defaultCurrency;

  const product: NormalizedProduct = {
    externalId: String(p.externalId ?? p.external_id ?? p.id ?? ''),
    name: s(p.name) ?? '',
    sku: s(p.sku),
    status: s(p.status),
    type: s(p.type),
    permalink: s(p.permalink),
    priceMinor: n(p.priceMinor ?? p.price_minor),
    regularPriceMinor: n(p.regularPriceMinor ?? p.regular_price_minor ?? p.priceMinor ?? p.price_minor),
    salePriceMinor: nq(p.salePriceMinor ?? p.sale_price_minor),
    currency,
    stockStatus: s(p.stockStatus ?? p.stock_status),
    stockQty: nq(p.stockQty ?? p.stock_qty),
    categories: arr(p.categories).map((c) => ({ externalId: ref(c).externalId, name: ref(c).name })),
    tags: arr(p.tags).map(ref),
    brands: arr(p.brands).map(ref),
    productAttributes: arr(p.attributes ?? p.productAttributes).map((a, i) => ({
      externalId:
        a.externalId ?? a.external_id ?? a.id
          ? String(a.externalId ?? a.external_id ?? a.id)
          : null,
      name: String(a.name ?? ''),
      slug: s(a.slug),
      options: Array.isArray(a.options) ? (a.options as unknown[]).map((o) => String(o)) : [],
      isVariation: Boolean(a.isVariation ?? a.variation),
      isVisible: a.isVisible === undefined && a.visible === undefined ? true : Boolean(a.isVisible ?? a.visible),
      position: typeof a.position === 'number' ? (a.position as number) : i,
      raw: a,
    })),
    images: arr(p.images)
      .map((img, i) => ({
        externalId: img.externalId ?? img.id ? String(img.externalId ?? img.id) : null,
        src: String(img.src ?? ''),
        alt: s(img.alt),
        position: typeof img.position === 'number' ? (img.position as number) : i,
      }))
      .filter((img) => img.src.length > 0),
    attributes: p.attributes ?? null,
    meta: p.meta ?? p.meta_data ?? null,
    raw: (p.raw as Record<string, unknown>) ?? p,
  };

  const variations: NormalizedVariation[] = arr(p.variations).map((v) => ({
    externalId: String(v.externalId ?? v.external_id ?? v.id ?? ''),
    sku: s(v.sku),
    priceMinor: n(v.priceMinor ?? v.price_minor),
    currency,
    stockStatus: s(v.stockStatus ?? v.stock_status),
    stockQty: nq(v.stockQty ?? v.stock_qty),
    attributes: v.attributes ?? null,
    meta: v.meta ?? v.meta_data ?? null,
    raw: (v.raw as Record<string, unknown>) ?? v,
  }));

  return { product, variations };
}

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
    // Taxonomies first (if the envelope includes them) so product links can resolve. Optional —
    // a minimal envelope omits these and product taxonomy data still survives in `raw`.
    for (const c of envelope.data?.categories ?? []) {
      const ext = s(c.externalId ?? c.external_id ?? c.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_category (site_id, tenant_id, external_id, parent_external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET
           parent_external_id=EXCLUDED.parent_external_id, name=EXCLUDED.name, slug=EXCLUDED.slug,
           raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(c.parentExternalId ?? c.parent_external_id ?? c.parent), s(c.name) ?? '', s(c.slug), JSON.stringify(c)],
      );
    }
    for (const t of envelope.data?.tags ?? []) {
      const ext = s(t.externalId ?? t.external_id ?? t.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_tag (site_id, tenant_id, external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(t.name) ?? '', s(t.slug), JSON.stringify(t)],
      );
    }
    for (const b of envelope.data?.brands ?? []) {
      const ext = s(b.externalId ?? b.external_id ?? b.id);
      if (!ext) continue;
      await query(
        `INSERT INTO synced_brand (site_id, tenant_id, external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(b.name) ?? '', s(b.slug), JSON.stringify(b)],
      );
    }

    for (const p of envelope.data?.products ?? []) {
      const ext = s(p.externalId ?? p.external_id ?? p.id);
      if (!ext) continue;
      // Route through the shared deep-preservation path: raw/meta/categories/tags/brands/
      // attributes/images/variations are all persisted when present (lossless), with safe
      // defaults when the envelope is minimal.
      const { product, variations } = envelopeProductToNormalized(p, defaultCurrency);
      await upsertProductFull(siteId, tenantId, product, variations);
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
