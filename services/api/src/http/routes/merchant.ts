/**
 * Merchant routes (merchant portal). Everything is scoped to the caller's tenant + site, with
 * per-site access guards before every call. Reads are served from normalized read-models (fast,
 * paginated); details and reports can read live from WooCommerce (cached). WooCommerce credentials
 * are looked up + decrypted server-side and never leave the backend.
 */
import { Router, type Response } from 'express';
import { z } from 'zod';

import { env } from '../../env';
import { canManage, primaryTenantId } from '../../services/accessControl';
import { audit } from '../../services/audit';
import { query, queryOne } from '../../db';
import { cached, invalidate } from '../../util/cache';
import { parsePagination } from '../../util/pagination';
import { badRequest, forbidden, notFound } from '../../util/errors';
import {
  disconnectSite,
  getSite,
  getWooCredentials,
  listSites,
  resyncProduct,
  setWooWebhookSecret,
  startConnection,
  syncWooSite,
  verifyWooConnection,
  type SiteRow,
} from '../../services/sites';
import {
  getOrder,
  getProduct,
  getSalesReport,
  updateOrderStatus,
  updateProduct,
  updateProductStock,
} from '../../services/woocommerce/wooClient';
import { authenticate, requirePortal, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';

export const merchantRouter = Router();
merchantRouter.use(authenticate, requirePortal('merchant'));

/** Resolve the caller's tenant (from the token, else their membership). */
async function tenantFor(req: AuthedRequest): Promise<string> {
  const fromToken = req.auth?.tenantId;
  if (fromToken) return fromToken;
  const resolved = await primaryTenantId(req.auth!.sub);
  if (!resolved) throw notFound('فروشگاهی برای این حساب یافت نشد.');
  return resolved;
}

/** Resolve + access-guard a site that must belong to the caller's tenant. */
async function siteFor(req: AuthedRequest, siteId: string): Promise<SiteRow> {
  const tenantId = await tenantFor(req);
  const site = await getSite(siteId);
  if (!site || site.tenant_id !== tenantId) throw notFound('فروشگاه یافت نشد.');
  return site;
}

function ensureManage(req: AuthedRequest): void {
  if (!canManage(req.auth!.role)) throw forbidden('برای این عملیات دسترسی کافی ندارید.');
}

// ---- tenant overview ----

merchantRouter.get(
  '/overview',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const tenantId = await tenantFor(req);
    const overview = await cached(`merchant:overview:${tenantId}`, async () =>
      queryOne(
        `SELECT
           (SELECT count(*) FROM site WHERE tenant_id = $1 AND status = 'connected')::int AS connected_sites,
           (SELECT count(*) FROM site WHERE tenant_id = $1)::int AS total_sites,
           (SELECT count(*) FROM synced_product WHERE tenant_id = $1)::int AS products,
           (SELECT count(*) FROM synced_order WHERE tenant_id = $1)::int AS orders,
           (SELECT count(*) FROM synced_customer WHERE tenant_id = $1)::int AS customers,
           (SELECT COALESCE(sum(total_minor),0) FROM synced_order WHERE tenant_id = $1 AND status NOT IN ('cancelled','refunded','failed'))::bigint AS gross_minor`,
        [tenantId],
      ),
    );
    res.json({ overview });
  }),
);

// ---- site connection lifecycle ----

merchantRouter.get(
  '/sites',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const tenantId = await tenantFor(req);
    res.json({ sites: await listSites(tenantId) });
  }),
);

const startSchema = z.object({
  name: z.string().trim().min(1).max(160),
  url: z.string().trim().min(3).max(300),
  mode: z.enum(['woo_rest', 'plugin']).default('woo_rest'),
});

merchantRouter.post(
  '/sites/connect/start',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const parsed = startSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('نام و آدرس فروشگاه را درست وارد کنید.');
    const tenantId = await tenantFor(req);
    const result = await startConnection({ tenantId, ...parsed.data });
    await audit({
      actorUserId: req.auth!.sub,
      action: 'site.connect.start',
      targetType: 'site',
      targetId: result.siteId,
      requestIp: req.ip,
      meta: { mode: parsed.data.mode },
    });
    invalidate(`merchant:overview:${tenantId}`);
    // signingSecret (plugin mode) is returned EXACTLY ONCE here; it is never retrievable again.
    // tenantId + siteId + the delivery URL are what the merchant pastes into the WordPress plugin.
    res.json({
      siteId: result.siteId,
      tenantId,
      connectionId: result.connectionId,
      mode: parsed.data.mode,
      deliveryBaseUrl: `${env.PUBLIC_API_BASE_URL || ''}/plugin`,
      ...(result.signingSecret ? { signingSecret: result.signingSecret } : {}),
    });
  }),
);

const verifySchema = z.object({
  siteId: z.string().uuid(),
  consumerKey: z.string().trim().min(8).max(200),
  consumerSecret: z.string().trim().min(8).max(200),
});

merchantRouter.post(
  '/sites/connect/verify',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات اتصال ناقص است.');
    const site = await siteFor(req, parsed.data.siteId);
    const tenantId = site.tenant_id;
    const updated = await verifyWooConnection({
      siteId: site.id,
      tenantId,
      consumerKey: parsed.data.consumerKey,
      consumerSecret: parsed.data.consumerSecret,
    });
    await audit({
      actorUserId: req.auth!.sub,
      action: 'site.connect.verify',
      targetType: 'site',
      targetId: site.id,
      requestIp: req.ip,
      meta: { status: updated.status },
    });
    invalidate(`merchant:overview:${tenantId}`);
    res.json({ site: updated });
  }),
);

merchantRouter.get(
  '/sites/:siteId/status',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const plugin = await queryOne(
      `SELECT status, plugin_version, last_seen_at FROM plugin_connection WHERE site_id = $1`,
      [site.id],
    );
    const lastSync = await queryOne(
      `SELECT status, stats, error, started_at, finished_at FROM sync_run
         WHERE site_id = $1 ORDER BY started_at DESC LIMIT 1`,
      [site.id],
    );
    res.json({ site, plugin, lastSync });
  }),
);

merchantRouter.post(
  '/sites/:siteId/disconnect',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const site = await siteFor(req, req.params.siteId);
    await disconnectSite(site.id);
    await audit({
      actorUserId: req.auth!.sub,
      action: 'site.disconnect',
      targetType: 'site',
      targetId: site.id,
      requestIp: req.ip,
    });
    invalidate(`merchant:overview:${site.tenant_id}`);
    res.json({ ok: true });
  }),
);

merchantRouter.post(
  '/sites/:siteId/webhook-secret',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const site = await siteFor(req, req.params.siteId);
    const secret = await setWooWebhookSecret(site.id, site.tenant_id);
    await audit({
      actorUserId: req.auth!.sub,
      action: 'site.webhook_secret.rotate',
      targetType: 'site',
      targetId: site.id,
      requestIp: req.ip,
    });
    // Returned ONCE; configure this as the WooCommerce webhook "Secret".
    res.json({
      secret,
      deliveryUrl: `${env.PUBLIC_API_BASE_URL || ''}/webhooks/woocommerce/${site.id}`,
    });
  }),
);

merchantRouter.post(
  '/sites/:siteId/sync',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const site = await siteFor(req, req.params.siteId);
    if (site.connection_mode !== 'woo_rest') {
      throw badRequest('همگام‌سازی دستی فقط برای اتصال REST است؛ افزونه خودش داده می‌فرستد.');
    }
    const stats = await syncWooSite(site.id);
    invalidate(`merchant:overview:${site.tenant_id}`);
    invalidate(`site:overview:${site.id}`);
    res.json({ ok: true, stats });
  }),
);

// ---- site read-models ----

merchantRouter.get(
  '/sites/:siteId/overview',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const overview = await cached(`site:overview:${site.id}`, async () =>
      queryOne(
        `SELECT
           (SELECT count(*) FROM synced_product WHERE site_id = $1)::int AS products,
           (SELECT count(*) FROM synced_order WHERE site_id = $1)::int AS orders,
           (SELECT count(*) FROM synced_customer WHERE site_id = $1)::int AS customers,
           (SELECT count(*) FROM synced_coupon WHERE site_id = $1)::int AS coupons,
           (SELECT COALESCE(sum(total_minor),0) FROM synced_order WHERE site_id = $1 AND status = 'completed')::bigint AS completed_revenue_minor`,
        [site.id],
      ),
    );
    res.json({ site, overview });
  }),
);

merchantRouter.get(
  '/sites/:siteId/products',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const search = req.query.search ? `%${String(req.query.search)}%` : null;
    const items = await query(
      `SELECT p.external_id, p.name, p.sku, p.status, p.type, p.price_minor, p.currency,
              p.stock_status, p.stock_qty, p.updated_at,
              (SELECT src FROM synced_product_image i WHERE i.product_id = p.id
                 ORDER BY i.position ASC LIMIT 1) AS image_src
         FROM synced_product p
        WHERE p.site_id = $1 AND ($2::text IS NULL OR p.name ILIKE $2 OR p.sku ILIKE $2)
        ORDER BY p.updated_at DESC LIMIT $3 OFFSET $4`,
      [site.id, search, pageSize, offset],
    );
    const total = await queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM synced_product
         WHERE site_id = $1 AND ($2::text IS NULL OR name ILIKE $2 OR sku ILIKE $2)`,
      [site.id, search],
    );
    res.json({ items, page, pageSize, total: total?.count ?? 0 });
  }),
);

merchantRouter.get(
  '/sites/:siteId/products/:productId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const creds = await getWooCredentials(site.id);
    const adminEditUrl = `${site.url.replace(/\/+$/, '')}/wp-admin/post.php?post=${encodeURIComponent(req.params.productId)}&action=edit`;
    if (creds) {
      const p = await getProduct(creds, req.params.productId);
      res.json({
        product: {
          external_id: p.externalId,
          name: p.name,
          sku: p.sku,
          status: p.status,
          type: p.type,
          permalink: p.permalink,
          admin_edit_url: adminEditUrl,
          price_minor: p.priceMinor,
          regular_price_minor: p.regularPriceMinor,
          sale_price_minor: p.salePriceMinor,
          currency: p.currency,
          stock_status: p.stockStatus,
          stock_qty: p.stockQty,
          categories: p.categories.map((c) => ({ external_id: c.externalId, name: c.name })),
          tags: p.tags.map((tg) => ({ external_id: tg.externalId, name: tg.name })),
          images: p.images.map((i) => ({ src: i.src, alt: i.alt, position: i.position })),
        },
      });
      return;
    }
    const product = await queryOne<{ id: string }>(
      `SELECT id, external_id, name, sku, status, type, permalink, price_minor, currency, stock_status, stock_qty
         FROM synced_product WHERE site_id = $1 AND external_id = $2`,
      [site.id, req.params.productId],
    );
    if (!product) throw notFound('محصول یافت نشد.');
    const images = await query(
      `SELECT external_id, src, alt, position FROM synced_product_image
         WHERE product_id = $1 ORDER BY position ASC`,
      [(product as { id: string }).id],
    );
    const categories = await query(
      `SELECT c.external_id, c.name FROM synced_product_category pc
         JOIN synced_category c ON c.id = pc.category_id
        WHERE pc.product_id = $1`,
      [(product as { id: string }).id],
    );
    const tags = await query(
      `SELECT t.external_id, t.name FROM synced_product_tag pt
         JOIN synced_tag t ON t.id = pt.tag_id
        WHERE pt.product_id = $1`,
      [(product as { id: string }).id],
    );
    const variants = await query(
      `SELECT external_id, sku, price_minor, currency, stock_status, stock_qty, attributes
         FROM synced_product_variant WHERE product_id = $1 ORDER BY updated_at DESC`,
      [(product as { id: string }).id],
    );
    const { id: _id, ...productPublic } = product as { id: string } & Record<string, unknown>;
    void _id;
    res.json({ product: { ...productPublic, admin_edit_url: adminEditUrl, images, categories, tags, variants } });
  }),
);

merchantRouter.get(
  '/sites/:siteId/categories',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const items = await query(
      `SELECT external_id, parent_external_id, name, slug, updated_at
         FROM synced_category WHERE site_id = $1 ORDER BY name ASC LIMIT $2 OFFSET $3`,
      [site.id, pageSize, offset],
    );
    const total = await queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM synced_category WHERE site_id = $1`,
      [site.id],
    );
    res.json({ items, page, pageSize, total: total?.count ?? 0 });
  }),
);

merchantRouter.get(
  '/sites/:siteId/orders',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status ? String(req.query.status) : null;
    const items = await query(
      `SELECT external_id, number, status, total_minor, currency, customer_name, external_created_at
         FROM synced_order
        WHERE site_id = $1 AND ($2::text IS NULL OR status = $2)
        ORDER BY external_created_at DESC NULLS LAST LIMIT $3 OFFSET $4`,
      [site.id, status, pageSize, offset],
    );
    const total = await queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM synced_order
         WHERE site_id = $1 AND ($2::text IS NULL OR status = $2)`,
      [site.id, status],
    );
    res.json({ items, page, pageSize, total: total?.count ?? 0 });
  }),
);

merchantRouter.get(
  '/sites/:siteId/orders/:orderId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const creds = await getWooCredentials(site.id);
    if (creds) {
      const o = await getOrder(creds, req.params.orderId);
      res.json({
        order: {
          external_id: o.externalId,
          number: o.number,
          status: o.status,
          total_minor: o.totalMinor,
          currency: o.currency,
          customer_name: o.customerName,
          external_created_at: o.createdAt,
        },
      });
      return;
    }
    const order = await queryOne(
      `SELECT external_id, number, status, total_minor, currency, customer_name, external_created_at
         FROM synced_order WHERE site_id = $1 AND external_id = $2`,
      [site.id, req.params.orderId],
    );
    if (!order) throw notFound('سفارش یافت نشد.');
    res.json({ order });
  }),
);

merchantRouter.get(
  '/sites/:siteId/customers',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const items = await query(
      `SELECT external_id, display_name, orders_count, total_spent_minor, currency, updated_at
         FROM synced_customer WHERE site_id = $1 ORDER BY total_spent_minor DESC LIMIT $2 OFFSET $3`,
      [site.id, pageSize, offset],
    );
    const total = await queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM synced_customer WHERE site_id = $1`,
      [site.id],
    );
    res.json({ items, page, pageSize, total: total?.count ?? 0 });
  }),
);

merchantRouter.get(
  '/sites/:siteId/coupons',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const items = await query(
      `SELECT external_id, code, discount_type, amount_minor, currency, updated_at
         FROM synced_coupon WHERE site_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
      [site.id, pageSize, offset],
    );
    const total = await queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM synced_coupon WHERE site_id = $1`,
      [site.id],
    );
    res.json({ items, page, pageSize, total: total?.count ?? 0 });
  }),
);

merchantRouter.get(
  '/sites/:siteId/reports/sales',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await siteFor(req, req.params.siteId);
    const period = (['week', 'month', 'year'] as const).includes(req.query.period as never)
      ? (req.query.period as 'week' | 'month' | 'year')
      : 'week';
    const creds = await getWooCredentials(site.id);
    if (creds) {
      const report = await cached(`site:report:${site.id}:${period}`, () =>
        getSalesReport(creds, period),
      );
      res.json({ report });
      return;
    }
    // Fallback to read-model aggregation when no live credentials (e.g. plugin mode).
    const row = await queryOne(
      `SELECT COALESCE(sum(total_minor),0)::bigint AS total_sales_minor,
              count(*)::int AS total_orders
         FROM synced_order WHERE site_id = $1 AND status = 'completed'`,
      [site.id],
    );
    res.json({ report: { period, currency: site.currency, ...row } });
  }),
);

// ---- controlled writes ----

const stockSchema = z.object({ stockQuantity: z.number().int() });
merchantRouter.patch(
  '/sites/:siteId/products/:productId/stock',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const site = await siteFor(req, req.params.siteId);
    const parsed = stockSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('مقدار موجودی نامعتبر است.');
    const creds = await getWooCredentials(site.id);
    if (!creds) throw badRequest('این فروشگاه اتصال REST فعال ندارد.');
    const product = await updateProductStock(creds, req.params.productId, parsed.data.stockQuantity);
    await query(
      `UPDATE synced_product SET stock_qty = $3, stock_status = $4, updated_at = now()
         WHERE site_id = $1 AND external_id = $2`,
      [site.id, req.params.productId, product.stockQty, product.stockStatus],
    );
    await audit({
      actorUserId: req.auth!.sub,
      action: 'product.stock.update',
      targetType: 'product',
      targetId: req.params.productId,
      requestIp: req.ip,
      meta: { siteId: site.id, stockQuantity: parsed.data.stockQuantity },
    });
    res.json({ product });
  }),
);

const productUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(300).optional(),
    regularPrice: z.string().trim().regex(/^\d+(\.\d{1,4})?$/).max(20).optional(),
    salePrice: z.string().trim().regex(/^(\d+(\.\d{1,4})?)?$/).max(20).optional(),
    status: z.enum(['publish', 'draft', 'pending', 'private']).optional(),
    stockQuantity: z.number().int().optional(),
    stockStatus: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
    categoryExternalIds: z.array(z.string().trim().min(1).max(40)).max(50).optional(),
    // Images by EXISTING WooCommerce media id or already-hosted URL only (no binary upload).
    images: z
      .array(z.object({ id: z.string().trim().max(40).optional(), src: z.string().trim().url().max(2000).optional() }))
      .max(20)
      .optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'هیچ تغییری ارسال نشده است.' });

merchantRouter.patch(
  '/sites/:siteId/products/:productId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const site = await siteFor(req, req.params.siteId);
    const parsed = productUpdateSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('اطلاعات محصول نامعتبر است.');
    const creds = await getWooCredentials(site.id);
    if (!creds) throw badRequest('این فروشگاه اتصال REST فعال ندارد.');

    const product = await updateProduct(creds, req.params.productId, {
      name: parsed.data.name,
      regularPrice: parsed.data.regularPrice,
      salePrice: parsed.data.salePrice,
      status: parsed.data.status,
      stockQuantity: parsed.data.stockQuantity,
      manageStock: parsed.data.stockQuantity !== undefined ? true : undefined,
      stockStatus: parsed.data.stockStatus,
      categoryExternalIds: parsed.data.categoryExternalIds,
      images: parsed.data.images,
    });

    // Refresh the read-model (product + images + categories + variations) so the UI reloads real data.
    try {
      await resyncProduct(site.id, req.params.productId);
    } catch {
      /* read-model refresh is best-effort; the WooCommerce write already succeeded */
    }

    await audit({
      actorUserId: req.auth!.sub,
      action: 'product.update',
      targetType: 'product',
      targetId: req.params.productId,
      requestIp: req.ip,
      meta: {
        siteId: site.id,
        fields: Object.keys(parsed.data),
      },
    });
    res.json({
      product: {
        external_id: product.externalId,
        name: product.name,
        sku: product.sku,
        status: product.status,
        type: product.type,
        price_minor: product.priceMinor,
        currency: product.currency,
        stock_status: product.stockStatus,
        stock_qty: product.stockQty,
        categories: product.categories.map((c) => ({ external_id: c.externalId, name: c.name })),
        images: product.images.map((i) => ({ src: i.src, alt: i.alt, position: i.position })),
      },
    });
  }),
);

const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
    'failed',
  ]),
});
merchantRouter.patch(
  '/sites/:siteId/orders/:orderId/status',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    ensureManage(req);
    const site = await siteFor(req, req.params.siteId);
    const parsed = orderStatusSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('وضعیت سفارش نامعتبر است.');
    const creds = await getWooCredentials(site.id);
    if (!creds) throw badRequest('این فروشگاه اتصال REST فعال ندارد.');
    const order = await updateOrderStatus(creds, req.params.orderId, parsed.data.status);
    await query(
      `UPDATE synced_order SET status = $3, updated_at = now() WHERE site_id = $1 AND external_id = $2`,
      [site.id, req.params.orderId, order.status],
    );
    await audit({
      actorUserId: req.auth!.sub,
      action: 'order.status.update',
      targetType: 'order',
      targetId: req.params.orderId,
      requestIp: req.ip,
      meta: { siteId: site.id, status: parsed.data.status },
    });
    res.json({ order });
  }),
);
