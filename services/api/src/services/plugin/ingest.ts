/**
 * Plugin sync ingestion — persists normalized read-models + events from a VERIFIED envelope.
 *
 * Signature/replay/timestamp verification happens in the route before this is called. Here we
 * upsert the read-models idempotently and record plugin_event rows (deduped on idempotency_key).
 */
import { query } from '../../db';
import { getSite, upsertProductFull } from '../sites';
import { upsertSyncedCustomer, upsertSyncedOrder } from '../syncModels';
import type { NormalizedCustomer, NormalizedOrder, NormalizedProduct, NormalizedVariation } from '../woocommerce/wooClient';

export interface SyncEnvelope {
  schemaVersion: string;
  generatedAt?: string;
  syncRunId?: string;
  chunk?: {
    entity?: string;
    chunkNumber?: number;
    page?: number;
    isFinal?: boolean;
    totalChunks?: number;
  };
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
    attributes?: ReadonlyArray<Record<string, unknown>>;
    products?: ReadonlyArray<Record<string, unknown>>;
    orders?: ReadonlyArray<Record<string, unknown>>;
    customers?: ReadonlyArray<Record<string, unknown>>;
    coupons?: ReadonlyArray<Record<string, unknown>>;
    reports?: Record<string, unknown>;
  };
}

export interface IngestStats {
  products: number;
  orders: number;
  customers: number;
  coupons: number;
  categories?: number;
  tags?: number;
  brands?: number;
}

export interface IngestResult {
  ok: boolean;
  syncRunId: string;
  stats: IngestStats;
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
): Promise<IngestResult> {
  const site = await getSite(siteId);
  const defaultCurrency = envelope.site?.currency ?? site?.currency ?? 'IRT';
  const syncRunGroup = envelope.syncRunId ?? undefined;
  const entity = envelope.chunk?.entity ?? null;
  const chunkNumber = envelope.chunk?.chunkNumber ?? null;

  const run = (
    await query<{ id: string }>(
      `INSERT INTO sync_run (site_id, tenant_id, source, status, sync_run_group, entity, chunk_number)
         VALUES ($1, $2, 'plugin', 'running', $3, $4, $5) RETURNING id`,
      [siteId, tenantId, syncRunGroup ?? null, entity, chunkNumber],
    )
  )[0];

  const stats: IngestStats = { products: 0, orders: 0, customers: 0, coupons: 0, categories: 0, tags: 0, brands: 0 };
  let receivedCount = 0;
  try {
    // Taxonomies first (if the envelope includes them) so product links can resolve. Optional —
    // a minimal envelope omits these and product taxonomy data still survives in `raw`.
    for (const c of envelope.data?.categories ?? []) {
      const ext = s(c.externalId ?? c.external_id ?? c.id);
      if (!ext) continue;
      receivedCount += 1;
      await query(
        `INSERT INTO synced_category (site_id, tenant_id, external_id, parent_external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET
           parent_external_id=EXCLUDED.parent_external_id, name=EXCLUDED.name, slug=EXCLUDED.slug,
           raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(c.parentExternalId ?? c.parent_external_id ?? c.parent), s(c.name) ?? '', s(c.slug), JSON.stringify(c)],
      );
      stats.categories = (stats.categories ?? 0) + 1;
    }
    for (const t of envelope.data?.tags ?? []) {
      const ext = s(t.externalId ?? t.external_id ?? t.id);
      if (!ext) continue;
      receivedCount += 1;
      await query(
        `INSERT INTO synced_tag (site_id, tenant_id, external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(t.name) ?? '', s(t.slug), JSON.stringify(t)],
      );
      stats.tags = (stats.tags ?? 0) + 1;
    }
    for (const b of envelope.data?.brands ?? []) {
      const ext = s(b.externalId ?? b.external_id ?? b.id);
      if (!ext) continue;
      receivedCount += 1;
      await query(
        `INSERT INTO synced_brand (site_id, tenant_id, external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(b.name) ?? '', s(b.slug), JSON.stringify(b)],
      );
      stats.brands = (stats.brands ?? 0) + 1;
    }

    for (const a of envelope.data?.attributes ?? []) {
      const ext = s(a.externalId ?? a.external_id ?? a.id);
      if (!ext) continue;
      receivedCount += 1;
      await query(
        `INSERT INTO synced_attribute (site_id, tenant_id, external_id, name, slug, raw, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6, now())
         ON CONFLICT (site_id, external_id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, raw=EXCLUDED.raw, updated_at=now()`,
        [siteId, tenantId, ext, s(a.name) ?? '', s(a.slug), JSON.stringify(a)],
      );
    }

    for (const p of envelope.data?.products ?? []) {
      const ext = s(p.externalId ?? p.external_id ?? p.id);
      if (!ext) continue;
      receivedCount += 1;
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
      receivedCount += 1;
      const currency = s(o.currency) ?? defaultCurrency;
      const billing = (o.billing as Record<string, unknown>) ?? {};
      const lineItemsRaw = Array.isArray(o.lineItems ?? o.line_items) ? (o.lineItems ?? o.line_items) as Record<string, unknown>[] : [];
      const normalized: NormalizedOrder = {
        externalId: ext,
        number: s(o.number),
        status: s(o.status),
        totalMinor: n(o.totalMinor ?? o.total_minor),
        subtotalMinor: n(o.subtotalMinor ?? o.subtotal_minor ?? o.total_minor),
        taxMinor: n(o.taxMinor ?? o.tax_minor),
        shippingMinor: n(o.shippingMinor ?? o.shipping_minor),
        discountMinor: n(o.discountMinor ?? o.discount_minor),
        currency,
        customerName: s(o.customerName ?? o.customer_name),
        customerExternalId: s(o.customerId ?? o.customer_id ?? o.customerExternalId ?? o.customer_external_id) || null,
        paymentMethodTitle: s(o.paymentMethodTitle ?? o.payment_method_title),
        lineItems: lineItemsRaw.map((li) => ({
          externalId: String(li.id ?? li.externalId ?? ''),
          productId: String(li.productId ?? li.product_id ?? ''),
          name: String(li.name ?? ''),
          sku: s(li.sku),
          quantity: Number(li.quantity ?? 0),
          priceMinor: n(li.priceMinor ?? li.price_minor),
          totalMinor: n(li.totalMinor ?? li.total_minor),
        })),
        billing: {
          firstName: String(billing.first_name ?? billing.firstName ?? ''),
          lastName: String(billing.last_name ?? billing.lastName ?? ''),
          email: String(billing.email ?? ''),
          phone: s(billing.phone),
          address1: s(billing.address_1 ?? billing.address1),
          city: s(billing.city),
          postcode: s(billing.postcode),
          country: s(billing.country),
        },
        shipping: null,
        createdAt: s(o.createdAt ?? o.created_at ?? o.external_created_at),
      };
      await upsertSyncedOrder(siteId, tenantId, normalized);
      stats.orders += 1;
    }

    for (const c of envelope.data?.customers ?? []) {
      const ext = s(c.externalId ?? c.external_id ?? c.id);
      if (!ext) continue;
      receivedCount += 1;
      const normalized: NormalizedCustomer = {
        externalId: ext,
        displayName: s(c.displayName ?? c.display_name),
        email: s(c.email),
        phone: s(c.phone),
        username: s(c.username),
        ordersCount: n(c.ordersCount ?? c.orders_count),
        totalSpentMinor: n(c.totalSpentMinor ?? c.total_spent_minor),
        currency: s(c.currency) ?? defaultCurrency,
        dateCreated: s(c.dateCreated ?? c.date_created ?? c.external_created_at),
      };
      await upsertSyncedCustomer(siteId, tenantId, normalized);
      stats.customers += 1;
    }

    for (const c of envelope.data?.coupons ?? []) {
      const ext = s(c.externalId ?? c.external_id ?? c.id);
      if (!ext) continue;
      receivedCount += 1;
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

    const inserted = stats.products + stats.orders + stats.customers + stats.coupons
      + (stats.categories ?? 0) + (stats.tags ?? 0) + (stats.brands ?? 0);
    const phase = entity ? `plugin:${entity}` : 'plugin:sync';
    const isFinal = envelope.chunk?.isFinal !== false;
    await query(
      `UPDATE sync_run SET status='success', stats=$2, finished_at=now(),
              phase=$3, message=$4, progress_percent=$5,
              received_count=$6, inserted_count=$7, updated_count=$7
         WHERE id=$1`,
      [
        run.id,
        JSON.stringify(stats),
        phase,
        entity ? `chunk ${chunkNumber ?? 1}` : 'sync complete',
        isFinal ? 100 : Math.min(99, (chunkNumber ?? 1) * 10),
        receivedCount,
        inserted,
      ],
    );
    if (isFinal || !entity) {
      await query(
        `UPDATE site SET last_synced_at=now(), last_error=NULL, woo_version=COALESCE($2, woo_version),
                wp_version=COALESCE($3, wp_version), updated_at=now() WHERE id=$1`,
        [siteId, envelope.site?.wooVersion ?? null, envelope.site?.wpVersion ?? null],
      );
    }
    return { ok: true, syncRunId: run.id, stats };
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
