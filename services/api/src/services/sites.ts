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
  listCoupons,
  listCustomers,
  listOrders,
  listProducts,
  verifyWooCredentials,
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
  return query<SiteRow>(
    `SELECT id, tenant_id, name, url, connection_mode, status, woo_version, wp_version,
            currency, last_synced_at, last_error, created_at
       FROM site WHERE tenant_id = $1 ORDER BY created_at DESC`,
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

  // Best-effort initial sync (don't fail the connect if the first pull hiccups).
  try {
    await syncWooSite(input.siteId);
  } catch {
    /* sync errors are recorded on the site row by syncWooSite */
  }

  return (await getSite(input.siteId))!;
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
  orders: number;
  customers: number;
  coupons: number;
}

/** Pull a normalized read-model from WooCommerce into the DB (idempotent upserts). */
export async function syncWooSite(siteId: string): Promise<SyncStats> {
  const site = await getSite(siteId);
  if (!site) throw notFound('فروشگاه یافت نشد.');
  const creds = await getWooCredentials(siteId);
  if (!creds) throw conflict('اعتبارنامه ووکامرس برای این فروشگاه ثبت نشده است.');

  const run = (
    await query<{ id: string }>(
      `INSERT INTO sync_run (site_id, tenant_id, source, status) VALUES ($1, $2, 'woo_rest', 'running') RETURNING id`,
      [siteId, site.tenant_id],
    )
  )[0];

  const stats: SyncStats = { products: 0, orders: 0, customers: 0, coupons: 0 };
  const pageSize = 100;
  try {
    stats.products = await syncAllWooPages(
      (page) => listProducts(creds, { page, pageSize }),
      async (p) => {
        await query(
          `INSERT INTO synced_product (site_id, tenant_id, external_id, name, sku, status, price_minor, currency, stock_status, stock_qty, updated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
           ON CONFLICT (site_id, external_id) DO UPDATE SET
             name = EXCLUDED.name, sku = EXCLUDED.sku, status = EXCLUDED.status,
             price_minor = EXCLUDED.price_minor, stock_status = EXCLUDED.stock_status,
             stock_qty = EXCLUDED.stock_qty, updated_at = now()`,
          [siteId, site.tenant_id, p.externalId, p.name, p.sku, p.status, p.priceMinor, p.currency, p.stockStatus, p.stockQty],
        );
      },
    );

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
    );

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

    await query(
      `UPDATE sync_run SET status = 'success', stats = $2, finished_at = now() WHERE id = $1`,
      [run.id, JSON.stringify(stats)],
    );
    await query(`UPDATE site SET last_synced_at = now(), last_error = NULL WHERE id = $1`, [siteId]);
    return stats;
  } catch (err) {
    const message = (err as Error).message?.slice(0, 300) ?? 'sync failed';
    await query(`UPDATE sync_run SET status = 'failed', error = $2, finished_at = now() WHERE id = $1`, [
      run.id,
      message,
    ]);
    await query(`UPDATE site SET last_error = $2 WHERE id = $1`, [siteId, message]);
    throw err;
  }
}

/** Walk every WooCommerce list page (100 items/page) until exhausted. */
async function syncAllWooPages<T>(
  fetchPage: (page: number) => Promise<WooPage<T>>,
  upsert: (item: T) => Promise<void>,
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
    if (batch.items.length === 0) break;
    if (batch.items.length < batch.pageSize) break;
    if (reportedTotal > 0 && synced >= reportedTotal) break;
    page += 1;
  }

  return synced;
}
