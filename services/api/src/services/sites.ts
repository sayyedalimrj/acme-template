/**
 * Site connection + sync service.
 *
 * Handles the merchant → backend → WooCommerce/WordPress connection flow:
 *  - WooCommerce REST: merchant enters store URL + consumer key/secret; backend verifies them
 *    server-side, seals them in the credential vault, and pulls a normalized read-model.
 *  - Plugin signed sync: backend issues a per-site signing secret (shown once) sealed in the
 *    vault; the WordPress plugin handshakes + pushes signed data which the backend verifies.
 *
 * Credentials are NEVER returned to the client after saving and NEVER logged.
 */
import { randomBytes } from 'node:crypto';

import { pool, query, queryOne } from '../db';
import { badRequest, conflict, notFound } from '../util/errors';
import { normalizeAndValidateStoreUrl } from '../util/ssrf';
import { openSecret, sealSecret, type SealedSecret } from './security/credentialVault';
import {
  getProduct,
  listAttributeTerms,
  listAttributes,
  listBrands,
  listCategories,
  listCoupons,
  listCustomers,
  listOrders,
  listProductVariations,
  listProducts,
  listTags,
  verifyWooCredentials,
  type NormalizedProduct,
  type NormalizedVariation,
  type WooCredentials,
  type WooPage,
} from './woocommerce/wooClient';

export type ConnectionMode = 'woo_rest' | 'plugin';

export interface SiteRow {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  connection_mode: ConnectionMode;
  status: string;
  woo_version: string | null;
  wp_version: string | null;
  currency: string;
  last_synced_at: string | null;
  last_error: string | null;
  created_at: string;
}

export async function listSites(tenantId: string): Promise<SiteRow[]> {
  // Exclude disconnected/deleted connections so a removed store's card disappears immediately from
  // the merchant's store list, the active-store carousel, and the dashboard (which derive the
  // active site from this list). Read-models are kept in the DB for history/reporting.
  return query<SiteRow>(
    `SELECT id, tenant_id, name, url, connection_mode, status, woo_version, wp_version,
            currency, last_synced_at, last_error, created_at
       FROM site WHERE tenant_id = $1 AND status <> 'disconnected' ORDER BY created_at DESC`,
    [tenantId],
  );
}

export async function getSite(siteId: string): Promise<SiteRow | null> {
  return queryOne<SiteRow>(
    `SELECT id, tenant_id, name, url, connection_mode, status, woo_version, wp_version,
            currency, last_synced_at, last_error, created_at
       FROM site WHERE id = $1`,
    [siteId],
  );
}

/** Start a connection: create a pending site. For plugin mode, mint a one-time signing secret. */
export async function startConnection(input: {
  tenantId: string;
  name: string;
  url: string;
  mode: ConnectionMode;
}): Promise<{ siteId: string; connectionId: string; signingSecret?: string }> {
  const url = await normalizeAndValidateStoreUrl(input.url);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const site = (
      await client.query<{ id: string }>(
        `INSERT INTO site (tenant_id, name, url, connection_mode, status)
           VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
        [input.tenantId, input.name, url, input.mode],
      )
    ).rows[0];

    const challenge = randomBytes(16).toString('hex');
    const conn = (
      await client.query<{ id: string }>(
        `INSERT INTO site_connection (site_id, tenant_id, mode, status, challenge_nonce)
           VALUES ($1, $2, $3, 'pending', $4) RETURNING id`,
        [site.id, input.tenantId, input.mode, challenge],
      )
    ).rows[0];

    let signingSecret: string | undefined;
    if (input.mode === 'plugin') {
      signingSecret = randomBytes(32).toString('base64url');
      const sealed = sealSecret({ signingSecret });
      await client.query(
        `INSERT INTO site_credential (site_id, tenant_id, kind, key_version, iv, auth_tag, ciphertext)
           VALUES ($1, $2, 'plugin_signing', $3, $4, $5, $6)`,
        [site.id, input.tenantId, sealed.keyVersion, sealed.iv, sealed.authTag, sealed.ciphertext],
      );
      await client.query(
        `INSERT INTO plugin_connection (site_id, tenant_id, status) VALUES ($1, $2, 'pending')
           ON CONFLICT (site_id) DO NOTHING`,
        [site.id, input.tenantId],
      );
    }

    await client.query('COMMIT');
    return { siteId: site.id, connectionId: conn.id, signingSecret };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Verify + persist WooCommerce REST credentials, mark the site connected, and seed a sync. */
export async function verifyWooConnection(input: {
  siteId: string;
  tenantId: string;
  consumerKey: string;
  consumerSecret: string;
}): Promise<SiteRow> {
  const site = await getSite(input.siteId);
  if (!site) throw notFound('فروشگاه یافت نشد.');
  if (site.connection_mode !== 'woo_rest') {
    throw badRequest('این فروشگاه در حالت اتصال افزونه است.');
  }
  const creds: WooCredentials = {
    storeUrl: site.url,
    consumerKey: input.consumerKey,
    consumerSecret: input.consumerSecret,
  };
  await normalizeAndValidateStoreUrl(creds.storeUrl);
  const verified = await verifyWooCredentials(creds); // throws safe error on failure

  const sealed = sealSecret(creds);
  await query(
    `UPDATE site_credential SET status = 'revoked' WHERE site_id = $1 AND kind = 'woo_rest'`,
    [input.siteId],
  );
  await query(
    `INSERT INTO site_credential (site_id, tenant_id, kind, key_version, iv, auth_tag, ciphertext)
       VALUES ($1, $2, 'woo_rest', $3, $4, $5, $6)`,
    [input.siteId, input.tenantId, sealed.keyVersion, sealed.iv, sealed.authTag, sealed.ciphertext],
  );
  await query(
    `UPDATE site SET status = 'connected', currency = $2, woo_version = $3,
            last_error = NULL, updated_at = now() WHERE id = $1`,
    [input.siteId, verified.currency, verified.wooVersion],
  );
  await query(
    `UPDATE site_connection SET status = 'verified', verified_at = now()
       WHERE site_id = $1 AND mode = 'woo_rest'`,
    [input.siteId],
  );

  // Kick off the initial catalog/orders sync in the BACKGROUND so connect/re-test returns fast.
  // Blocking on the full sync here is exactly what made the connect form hit the API request
  // timeout ("درخواست زمان‌بر شد"). syncWooSite records its own progress/result.
  startSiteSync(input.siteId);

  return (await getSite(input.siteId))!;
}

/**
 * Run a full WooCommerce sync in the BACKGROUND and return immediately. Connect/re-test and the
 * manual sync button must never block on the (potentially long) full catalog/orders pull — a
 * blocking sync is what caused the connect form to exceed the API request timeout. `syncWooSite`
 * records its own progress/result on `sync_run` + the site row (`last_synced_at` / `last_error`),
 * which the status endpoint surfaces. The rejection is swallowed here (already persisted) so the
 * detached promise never becomes an unhandled rejection.
 */
export function startSiteSync(siteId: string): void {
  void syncWooSite(siteId).catch(() => {
    /* failure already recorded on sync_run + site.last_error by syncWooSite */
  });
}

/** Decrypt the active WooCommerce credentials for a site (server-side use only). */
export async function getWooCredentials(siteId: string): Promise<WooCredentials | null> {
  const row = await queryOne<SealedSecret>(
    `SELECT key_version AS "keyVersion", iv, auth_tag AS "authTag", ciphertext
       FROM site_credential WHERE site_id = $1 AND kind = 'woo_rest' AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
    [siteId],
  );
  if (!row) return null;
  return openSecret<WooCredentials>(row);
}

/** Decrypt the active plugin signing secret for a site (server-side use only). */
export async function getPluginSigningSecret(siteId: string): Promise<string | null> {
  const row = await queryOne<SealedSecret>(
    `SELECT key_version AS "keyVersion", iv, auth_tag AS "authTag", ciphertext
       FROM site_credential WHERE site_id = $1 AND kind = 'plugin_signing' AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
    [siteId],
  );
  if (!row) return null;
  return openSecret<{ signingSecret: string }>(row).signingSecret;
}

/** Generate + store a WooCommerce webhook secret for a site (returned once for the merchant). */
export async function setWooWebhookSecret(siteId: string, tenantId: string): Promise<string> {
  const secret = randomBytes(24).toString('base64url');
  const sealed = sealSecret({ secret });
  await query(
    `UPDATE site_credential SET status = 'revoked' WHERE site_id = $1 AND kind = 'woo_webhook'`,
    [siteId],
  );
  await query(
    `INSERT INTO site_credential (site_id, tenant_id, kind, key_version, iv, auth_tag, ciphertext)
       VALUES ($1, $2, 'woo_webhook', $3, $4, $5, $6)`,
    [siteId, tenantId, sealed.keyVersion, sealed.iv, sealed.authTag, sealed.ciphertext],
  );
  return secret;
}

/** Decrypt the active WooCommerce webhook secret for a site (server-side use only). */
export async function getWooWebhookSecret(siteId: string): Promise<string | null> {
  const row = await queryOne<SealedSecret>(
    `SELECT key_version AS "keyVersion", iv, auth_tag AS "authTag", ciphertext
       FROM site_credential WHERE site_id = $1 AND kind = 'woo_webhook' AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
    [siteId],
  );
  if (!row) return null;
  return openSecret<{ secret: string }>(row).secret;
}

/**
 * Safe edit of a connected store's settings. Display name can always change. The URL may change
 * but is re-validated (SSRF-guarded) and, if the host actually changes, the site is set back to
 * `pending` so the merchant must re-verify the connection (existing credentials are host-bound).
 * Secrets are never touched here and never returned to the client.
 */
export async function updateSiteSettings(
  siteId: string,
  tenantId: string,
  input: { name?: string; url?: string },
): Promise<SiteRow> {
  const site = await getSite(siteId);
  if (!site || site.tenant_id !== tenantId) throw notFound('فروشگاه یافت نشد.');

  let nextUrl = site.url;
  let requireReverify = false;
  if (input.url !== undefined) {
    nextUrl = await normalizeAndValidateStoreUrl(input.url);
    const prevHost = safeHost(site.url);
    const nextHost = safeHost(nextUrl);
    requireReverify = prevHost !== nextHost;
  }
  const nextName = input.name?.trim() || site.name;
  const nextStatus = requireReverify ? 'pending' : site.status;

  await query(
    `UPDATE site SET name = $2, url = $3, status = $4,
            last_error = CASE WHEN $5 THEN NULL ELSE last_error END, updated_at = now()
       WHERE id = $1`,
    [siteId, nextName, nextUrl, nextStatus, requireReverify],
  );
  return (await getSite(siteId))!;
}

function safeHost(url: string): string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/** Disconnect a site: revoke credentials + connections; keep read-models for history. */
export async function disconnectSite(siteId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE site_credential SET status = 'revoked' WHERE site_id = $1`, [siteId]);
    await client.query(
      `UPDATE site_connection SET status = 'revoked' WHERE site_id = $1 AND status != 'revoked'`,
      [siteId],
    );
    await client.query(`UPDATE plugin_connection SET status = 'revoked' WHERE site_id = $1`, [siteId]);
    // Cancel any in-flight sync so a removed/disconnected store leaves no stale 'running' progress.
    await client.query(
      `UPDATE sync_run SET status = 'cancelled', message = 'اتصال فروشگاه حذف شد', finished_at = now()
         WHERE site_id = $1 AND status IN ('queued', 'running')`,
      [siteId],
    );
    await client.query(
      `UPDATE site SET status = 'disconnected', updated_at = now() WHERE id = $1`,
      [siteId],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export interface SyncStats {
  products: number;
  categories: number;
  tags: number;
  brands: number;
  attributes: number;
  variants: number;
  images: number;
  orders: number;
  customers: number;
  coupons: number;
}

/**
 * Upsert a single product and ALL its related rows idempotently: category/tag/brand links,
 * per-product attributes, images, and variations. The full WooCommerce payload + meta_data are
 * preserved on `synced_product.raw` / `.meta` (and per variation), so nothing is ever lost even
 * though the UI shows only a minimal subset.
 *
 * Variations are passed in (not fetched here) so this works for BOTH transports: the REST sync
 * fetches them via the API, while the plugin transport supplies them from its signed envelope.
 * Product/variation rows upsert on (site_id, external_id); per-product links/images/attributes are
 * replaced (delete-then-insert), so repeated syncs never duplicate. Taxonomy links resolve to
 * already-synced `synced_category/tag/brand` rows, so sync those first.
 */
export async function upsertProductFull(
  siteId: string,
  tenantId: string,
  p: NormalizedProduct,
  variations: ReadonlyArray<NormalizedVariation> = [],
): Promise<{ variants: number; images: number }> {
  const productRow = (
    await query<{ id: string }>(
      `INSERT INTO synced_product (site_id, tenant_id, external_id, name, sku, status, type, permalink, price_minor, currency, stock_status, stock_qty, meta, raw, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
       ON CONFLICT (site_id, external_id) DO UPDATE SET
         name = EXCLUDED.name, sku = EXCLUDED.sku, status = EXCLUDED.status, type = EXCLUDED.type,
         permalink = EXCLUDED.permalink, price_minor = EXCLUDED.price_minor,
         stock_status = EXCLUDED.stock_status, stock_qty = EXCLUDED.stock_qty,
         meta = EXCLUDED.meta, raw = EXCLUDED.raw, updated_at = now()
       RETURNING id`,
      [
        siteId, tenantId, p.externalId, p.name, p.sku, p.status, p.type, p.permalink, p.priceMinor,
        p.currency, p.stockStatus, p.stockQty, JSON.stringify(p.meta ?? null), JSON.stringify(p.raw),
      ],
    )
  )[0];
  const productId = productRow.id;

  // Category links (replace).
  await query(`DELETE FROM synced_product_category WHERE product_id = $1`, [productId]);
  for (const cat of p.categories) {
    await query(
      `INSERT INTO synced_product_category (product_id, category_id, tenant_id, site_id)
         SELECT $1, sc.id, $2, $3 FROM synced_category sc
          WHERE sc.site_id = $3 AND sc.external_id = $4
       ON CONFLICT (product_id, category_id) DO NOTHING`,
      [productId, tenantId, siteId, cat.externalId],
    );
  }

  // Tag links (replace).
  await query(`DELETE FROM synced_product_tag WHERE product_id = $1`, [productId]);
  for (const tag of p.tags) {
    await query(
      `INSERT INTO synced_product_tag (product_id, tag_id, tenant_id, site_id)
         SELECT $1, st.id, $2, $3 FROM synced_tag st
          WHERE st.site_id = $3 AND st.external_id = $4
       ON CONFLICT (product_id, tag_id) DO NOTHING`,
      [productId, tenantId, siteId, tag.externalId],
    );
  }

  // Brand links (replace). Brands are best-effort (taxonomy may be absent).
  await query(`DELETE FROM synced_product_brand WHERE product_id = $1`, [productId]);
  for (const brand of p.brands) {
    await query(
      `INSERT INTO synced_product_brand (product_id, brand_id, tenant_id, site_id)
         SELECT $1, sb.id, $2, $3 FROM synced_brand sb
          WHERE sb.site_id = $3 AND sb.external_id = $4
       ON CONFLICT (product_id, brand_id) DO NOTHING`,
      [productId, tenantId, siteId, brand.externalId],
    );
  }

  // Per-product attributes (replace) — captures pa_size etc. with options + variation flag.
  await query(`DELETE FROM synced_product_attribute WHERE product_id = $1`, [productId]);
  for (const attr of p.productAttributes) {
    await query(
      `INSERT INTO synced_product_attribute (tenant_id, site_id, product_id, external_id, name, slug, options, is_variation, is_visible, position, raw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        tenantId, siteId, productId, attr.externalId, attr.name, attr.slug,
        JSON.stringify(attr.options), attr.isVariation, attr.isVisible, attr.position,
        JSON.stringify(attr.raw),
      ],
    );
  }

  // Images (replace, position-ordered).
  await query(`DELETE FROM synced_product_image WHERE product_id = $1`, [productId]);
  for (const img of p.images) {
    await query(
      `INSERT INTO synced_product_image (tenant_id, site_id, product_id, external_id, src, alt, position, raw)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [tenantId, siteId, productId, img.externalId, img.src, img.alt, img.position, null],
    );
  }

  // Variations (upsert; full variation meta preserved).
  for (const v of variations) {
    await query(
      `INSERT INTO synced_product_variant (tenant_id, site_id, product_id, external_id, sku, price_minor, currency, stock_status, stock_qty, attributes, meta, raw, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now())
       ON CONFLICT (site_id, external_id) DO UPDATE SET
         product_id = EXCLUDED.product_id, sku = EXCLUDED.sku, price_minor = EXCLUDED.price_minor,
         stock_status = EXCLUDED.stock_status, stock_qty = EXCLUDED.stock_qty,
         attributes = EXCLUDED.attributes, meta = EXCLUDED.meta, raw = EXCLUDED.raw, updated_at = now()`,
      [
        tenantId, siteId, productId, v.externalId, v.sku, v.priceMinor, v.currency,
        v.stockStatus, v.stockQty, JSON.stringify(v.attributes ?? null),
        JSON.stringify(v.meta ?? null), JSON.stringify(v.raw),
      ],
    );
  }

  return { variants: variations.length, images: p.images.length };
}

/** Fetch all variations of a variable product via REST (paginated). */
async function fetchAllVariations(
  creds: WooCredentials,
  productExternalId: string,
): Promise<NormalizedVariation[]> {
  const all: NormalizedVariation[] = [];
  await syncAllWooPages(
    (page) => listProductVariations(creds, productExternalId, { page, pageSize: 100 }),
    async (v) => {
      all.push(v);
    },
  );
  return all;
}

/** Re-pull one product (+ images/categories/tags/brands/attributes/variations) after a write. */
export async function resyncProduct(siteId: string, productExternalId: string): Promise<void> {
  const site = await getSite(siteId);
  if (!site) throw notFound('فروشگاه یافت نشد.');
  const creds = await getWooCredentials(siteId);
  if (!creds) return;
  const product = await getProduct(creds, productExternalId);
  const variations = product.type === 'variable' ? await fetchAllVariations(creds, productExternalId) : [];
  await upsertProductFull(siteId, site.tenant_id, product, variations);
}

/** Pull a normalized read-model from WooCommerce into the DB (idempotent upserts). */
export async function syncWooSite(siteId: string): Promise<SyncStats> {
  const site = await getSite(siteId);
  if (!site) throw notFound('فروشگاه یافت نشد.');
  const creds = await getWooCredentials(siteId);
  if (!creds) throw conflict('اعتبارنامه ووکامرس برای این فروشگاه ثبت نشده است.');

  const run = (
    await query<{ id: string }>(
      `INSERT INTO sync_run (site_id, tenant_id, source, status, phase, message, progress_percent)
         VALUES ($1, $2, 'woo_rest', 'running', 'orders', $3, 5) RETURNING id`,
      [siteId, site.tenant_id, 'شروع همگام‌سازی…'],
    )
  )[0];

  const stats: SyncStats = {
    products: 0, categories: 0, tags: 0, brands: 0, attributes: 0, variants: 0, images: 0,
    orders: 0, customers: 0, coupons: 0,
  };
  const pageSize = 100;

  // Granular progress writer: updates phase + percent + message + any per-entity counters in one
  // row write. percent is honest — when a total is known it tracks done/total within the phase's
  // allotted band; when unknown it holds the band's floor (indeterminate, never a fake number).
  type CounterCol =
    | 'products_total' | 'products_done' | 'orders_total' | 'orders_done'
    | 'customers_total' | 'customers_done' | 'coupons_total' | 'coupons_done'
    | 'media_total' | 'media_done';
  const setProgress = async (
    fields: { phase?: string; percent?: number; message?: string } & Partial<Record<CounterCol, number>>,
  ): Promise<void> => {
    const sets: string[] = [];
    const vals: unknown[] = [];
    const push = (col: string, val: unknown): void => {
      vals.push(val);
      sets.push(`${col} = $${vals.length + 1}`);
    };
    if (fields.phase !== undefined) push('phase', fields.phase);
    if (fields.percent !== undefined) push('progress_percent', Math.max(0, Math.min(100, Math.round(fields.percent))));
    if (fields.message !== undefined) push('message', fields.message);
    for (const col of [
      'products_total', 'products_done', 'orders_total', 'orders_done',
      'customers_total', 'customers_done', 'coupons_total', 'coupons_done',
      'media_total', 'media_done',
    ] as CounterCol[]) {
      if (fields[col] !== undefined) push(col, fields[col]); // CounterCol is a fixed enum (safe)
    }
    if (sets.length === 0) return;
    await query(`UPDATE sync_run SET ${sets.join(', ')} WHERE id = $1`, [run.id, ...vals]);
  };
  // Map progress within a phase to its allotted percent band; floor when the total is unknown.
  const band = (lo: number, hi: number, done: number, total: number): number =>
    total > 0 ? lo + (hi - lo) * Math.min(1, done / total) : lo;

  try {
    // PHASE 1 — ORDERS FIRST so the dashboard chart/revenue can populate quickly, before the
    // heavier product/variation/media pull. Orders do not depend on taxonomies. (band 5→35%)
    await setProgress({ phase: 'orders', percent: 5, message: 'همگام‌سازی سفارش‌ها…' });
    stats.orders = await syncAllWooPages(
      (page) => listOrders(creds, { page, pageSize }),
      async (o) => {
        await query(
          `INSERT INTO synced_order (site_id, tenant_id, external_id, number, status, total_minor, currency, customer_name, external_created_at, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
           ON CONFLICT (site_id, external_id) DO UPDATE SET
             number = EXCLUDED.number, status = EXCLUDED.status, total_minor = EXCLUDED.total_minor,
             customer_name = EXCLUDED.customer_name, external_created_at = EXCLUDED.external_created_at, updated_at = now()`,
          [siteId, site.tenant_id, o.externalId, o.number, o.status, o.totalMinor, o.currency, o.customerName, o.createdAt],
        );
      },
      async (done, total) => {
        await setProgress({
          phase: 'orders',
          orders_done: done,
          orders_total: total,
          percent: band(5, 35, done, total),
          message: total > 0 ? `همگام‌سازی سفارش‌ها (${done} از ${total})…` : `همگام‌سازی سفارش‌ها (${done})…`,
        });
      },
    );
    await setProgress({ phase: 'categories', percent: 38, message: 'همگام‌سازی دسته‌ها و برچسب‌ها…' });

    // PHASE 2 — taxonomies first so product→category links can resolve.
    stats.categories = await syncAllWooPages(
      (page) => listCategories(creds, { page, pageSize }),
      async (c) => {
        await query(
          `INSERT INTO synced_category (site_id, tenant_id, external_id, parent_external_id, name, slug, raw, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7, now())
           ON CONFLICT (site_id, external_id) DO UPDATE SET
             parent_external_id = EXCLUDED.parent_external_id, name = EXCLUDED.name,
             slug = EXCLUDED.slug, raw = EXCLUDED.raw, updated_at = now()`,
          [siteId, site.tenant_id, c.externalId, c.parentExternalId, c.name, c.slug, JSON.stringify(c.raw)],
        );
      },
    );

    // Tags.
    stats.tags = await syncAllWooPages(
      (page) => listTags(creds, { page, pageSize }),
      async (t) => {
        await query(
          `INSERT INTO synced_tag (site_id, tenant_id, external_id, name, slug, raw, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6, now())
           ON CONFLICT (site_id, external_id) DO UPDATE SET
             name = EXCLUDED.name, slug = EXCLUDED.slug, raw = EXCLUDED.raw, updated_at = now()`,
          [siteId, site.tenant_id, t.externalId, t.name, t.slug, JSON.stringify(t.raw)],
        );
      },
    );

    // Brands — best-effort: the product_brand taxonomy/endpoint may not exist on a store.
    try {
      stats.brands = await syncAllWooPages(
        (page) => listBrands(creds, { page, pageSize }),
        async (b) => {
          await query(
            `INSERT INTO synced_brand (site_id, tenant_id, external_id, name, slug, raw, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6, now())
             ON CONFLICT (site_id, external_id) DO UPDATE SET
               name = EXCLUDED.name, slug = EXCLUDED.slug, raw = EXCLUDED.raw, updated_at = now()`,
            [siteId, site.tenant_id, b.externalId, b.name, b.slug, JSON.stringify(b.raw)],
          );
        },
      );
    } catch {
      stats.brands = 0; // taxonomy absent → not an error
    }

    // Global attributes + their terms (e.g. pa_size → 1/2/3).
    try {
      const attributes = await listAttributes(creds);
      stats.attributes = attributes.length;
      for (const a of attributes) {
        await query(
          `INSERT INTO synced_attribute (site_id, tenant_id, external_id, name, slug, type, raw, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7, now())
           ON CONFLICT (site_id, external_id) DO UPDATE SET
             name = EXCLUDED.name, slug = EXCLUDED.slug, type = EXCLUDED.type, raw = EXCLUDED.raw, updated_at = now()`,
          [siteId, site.tenant_id, a.externalId, a.name, a.slug, a.type, JSON.stringify(a.raw)],
        );
        await syncAllWooPages(
          (page) => listAttributeTerms(creds, a.externalId, { page, pageSize }),
          async (term) => {
            await query(
              `INSERT INTO synced_attribute_term (site_id, tenant_id, attribute_external_id, external_id, name, slug, raw, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7, now())
               ON CONFLICT (site_id, attribute_external_id, external_id) DO UPDATE SET
                 name = EXCLUDED.name, slug = EXCLUDED.slug, raw = EXCLUDED.raw, updated_at = now()`,
              [siteId, site.tenant_id, term.attributeExternalId, term.externalId, term.name, term.slug, JSON.stringify(term.raw)],
            );
          },
        );
      }
    } catch {
      stats.attributes = 0; // attribute endpoint restricted → leave product-level attributes intact
    }

    // PHASE 3 — products (heavy; variations only for variable products). (band 45→88%)
    await setProgress({ phase: 'products', percent: 45, message: 'همگام‌سازی محصولات…' });
    stats.products = await syncAllWooPages(
      (page) => listProducts(creds, { page, pageSize }),
      async (p) => {
        const variations = p.type === 'variable' ? await fetchAllVariations(creds, p.externalId) : [];
        const counts = await upsertProductFull(siteId, site.tenant_id, p, variations);
        stats.variants += counts.variants;
        stats.images += counts.images;
      },
      async (done, total) => {
        await setProgress({
          phase: 'products',
          products_done: done,
          products_total: total,
          media_done: stats.images,
          percent: band(45, 88, done, total),
          message: total > 0 ? `همگام‌سازی محصولات (${done} از ${total})…` : `همگام‌سازی محصولات (${done})…`,
        });
      },
    );
    await setProgress({
      products_total: stats.products, products_done: stats.products,
      media_total: stats.images, media_done: stats.images,
    });
    await setProgress({ phase: 'customers', percent: 90, message: 'همگام‌سازی مشتریان…' });

    // PHASE 4 — customers.
    stats.customers = await syncAllWooPages(
      (page) => listCustomers(creds, { page, pageSize }),
      async (c) => {
        await query(
          `INSERT INTO synced_customer (site_id, tenant_id, external_id, display_name, orders_count, total_spent_minor, currency, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7, now())
           ON CONFLICT (site_id, external_id) DO UPDATE SET
             display_name = EXCLUDED.display_name, orders_count = EXCLUDED.orders_count,
             total_spent_minor = EXCLUDED.total_spent_minor, updated_at = now()`,
          [siteId, site.tenant_id, c.externalId, c.displayName, c.ordersCount, c.totalSpentMinor, c.currency],
        );
      },
    );
    await setProgress({ customers_total: stats.customers, customers_done: stats.customers });
    await setProgress({ phase: 'coupons', percent: 95, message: 'همگام‌سازی کوپن‌ها…' });

    try {
      stats.coupons = await syncAllWooPages(
        (page) => listCoupons(creds, { page, pageSize }),
        async (c) => {
          await query(
            `INSERT INTO synced_coupon (site_id, tenant_id, external_id, code, discount_type, amount_minor, currency, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7, now())
             ON CONFLICT (site_id, external_id) DO UPDATE SET
               code = EXCLUDED.code, discount_type = EXCLUDED.discount_type,
               amount_minor = EXCLUDED.amount_minor, updated_at = now()`,
            [siteId, site.tenant_id, c.externalId, c.code, c.discountType, c.amountMinor, c.currency],
          );
        },
      );
    } catch {
      /* coupons optional */
    }
    await setProgress({ coupons_total: stats.coupons, coupons_done: stats.coupons });

    await query(
      `UPDATE sync_run SET status = 'success', phase = 'done', progress_percent = 100,
              message = $2, stats = $3, finished_at = now() WHERE id = $1`,
      [run.id, 'همگام‌سازی کامل شد.', JSON.stringify(stats)],
    );
    await query(`UPDATE site SET last_synced_at = now(), last_error = NULL WHERE id = $1`, [siteId]);
    return stats;
  } catch (err) {
    const message = (err as Error).message?.slice(0, 300) ?? 'sync failed';
    await query(
      `UPDATE sync_run SET status = 'failed', error = $2, message = $2, finished_at = now() WHERE id = $1`,
      [run.id, message],
    );
    await query(`UPDATE site SET last_error = $2 WHERE id = $1`, [siteId, message]);
    throw err;
  }
}

/** Walk every WooCommerce list page (100 items/page) until exhausted. Reports per-page progress. */
async function syncAllWooPages<T>(
  fetchPage: (page: number) => Promise<WooPage<T>>,
  upsert: (item: T) => Promise<void>,
  onPage?: (done: number, total: number) => Promise<void>,
): Promise<number> {
  let page = 1;
  let synced = 0;
  let reportedTotal = 0;

  while (true) {
    const batch = await fetchPage(page);
    reportedTotal = Math.max(reportedTotal, batch.total);
    for (const item of batch.items) {
      await upsert(item);
      synced += 1;
    }
    // Report progress after each page so the UI shows continuous movement + a real "x of y"
    // (total comes from the Woo `x-wp-total` header), instead of sitting frozen at a boundary %.
    if (onPage) await onPage(synced, reportedTotal);
    if (batch.items.length === 0) break;
    if (batch.items.length < batch.pageSize) break;
    if (reportedTotal > 0 && synced >= reportedTotal) break;
    page += 1;
  }

  return synced;
}
