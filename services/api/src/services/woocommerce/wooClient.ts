/**
 * WooCommerceClient — server-side WooCommerce REST client.
 *
 * The frontend NEVER calls WooCommerce and NEVER holds store keys. This client authenticates with
 * the store's consumer key/secret (decrypted from the vault per request), with a timeout, bounded
 * retries on transient errors, and response normalization to frontend-safe shapes (money as
 * integer minor units; PII minimized). Errors are wrapped so secrets never leak.
 */
import { env } from '../../env';
import { badGateway } from '../../util/errors';
import { assertSafeOutboundUrl, safeFetch } from '../../util/ssrf';
import { toMinorUnits } from '../money';

export interface WooCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface WooPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface NormalizedProductImage {
  externalId: string | null;
  src: string;
  alt: string | null;
  position: number;
}

export interface NormalizedProductCategoryRef {
  externalId: string;
  name: string | null;
}

export interface NormalizedProductRef {
  externalId: string;
  name: string | null;
  slug?: string | null;
}

export interface NormalizedProductAttribute {
  externalId: string | null;
  name: string;
  slug: string | null;
  options: string[];
  isVariation: boolean;
  isVisible: boolean;
  position: number;
  raw: Record<string, unknown>;
}

export interface NormalizedProduct {
  externalId: string;
  name: string;
  sku: string | null;
  status: string | null;
  type: string | null;
  permalink: string | null;
  priceMinor: number;
  regularPriceMinor: number;
  salePriceMinor: number | null;
  currency: string;
  stockStatus: string | null;
  stockQty: number | null;
  categories: NormalizedProductCategoryRef[];
  tags: NormalizedProductRef[];
  brands: NormalizedProductRef[];
  productAttributes: NormalizedProductAttribute[];
  images: NormalizedProductImage[];
  attributes: unknown;
  /** Full `meta_data`/postmeta — preserved losslessly (queryable JSONB), never shown raw in UI. */
  meta: unknown;
  /** Raw WooCommerce payload, preserved server-side for forward compatibility (never sent to UI). */
  raw: Record<string, unknown>;
}

export interface NormalizedCategory {
  externalId: string;
  parentExternalId: string | null;
  name: string;
  slug: string | null;
  raw: Record<string, unknown>;
}

/** Tag / brand taxonomy term (same shape). brands come from the optional product_brand taxonomy. */
export interface NormalizedTaxonomyTerm {
  externalId: string;
  name: string;
  slug: string | null;
  raw: Record<string, unknown>;
}

export interface NormalizedAttribute {
  externalId: string;
  name: string;
  slug: string | null;
  type: string | null;
  raw: Record<string, unknown>;
}

export interface NormalizedAttributeTerm {
  attributeExternalId: string;
  externalId: string;
  name: string;
  slug: string | null;
  raw: Record<string, unknown>;
}

export interface NormalizedVariation {
  externalId: string;
  sku: string | null;
  priceMinor: number;
  currency: string;
  stockStatus: string | null;
  stockQty: number | null;
  attributes: unknown;
  /** Full variation `meta_data` — preserved losslessly. */
  meta: unknown;
  raw: Record<string, unknown>;
}

export interface NormalizedOrder {
  externalId: string;
  number: string | null;
  status: string | null;
  totalMinor: number;
  currency: string;
  customerName: string | null;
  createdAt: string | null;
}

export interface NormalizedCustomer {
  externalId: string;
  displayName: string | null;
  ordersCount: number;
  totalSpentMinor: number;
  currency: string;
}

export interface NormalizedCoupon {
  externalId: string;
  code: string | null;
  discountType: string | null;
  amountMinor: number;
  currency: string;
}

function authHeader(creds: WooCredentials): string {
  const basic = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString('base64');
  return `Basic ${basic}`;
}

function baseUrl(storeUrl: string): string {
  return storeUrl.replace(/\/+$/, '');
}

async function wooFetch(
  creds: WooCredentials,
  path: string,
  query: Record<string, string | number | undefined> = {},
): Promise<{ json: unknown; total: number }> {
  await assertSafeOutboundUrl(baseUrl(creds.storeUrl));
  const url = new URL(`${baseUrl(creds.storeUrl)}/wp-json/wc/v3${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= env.WOO_MAX_RETRIES; attempt += 1) {
    try {
      const res = await safeFetch(url.href, {
        headers: { Authorization: authHeader(creds), Accept: 'application/json' },
        timeoutMs: env.WOO_HTTP_TIMEOUT_MS,
      });
      if (res.status === 401 || res.status === 403) {
        throw badGateway('اعتبارنامه ووکامرس نامعتبر است.', 'woo_auth_failed');
      }
      // Retry on 429/5xx.
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`woo ${res.status}`);
        if (attempt < env.WOO_MAX_RETRIES) {
          await delay(250 * (attempt + 1));
          continue;
        }
        throw badGateway('فروشگاه ووکامرس پاسخ نداد.', 'woo_unavailable');
      }
      if (!res.ok) {
        throw badGateway('درخواست به ووکامرس ناموفق بود.', 'woo_request_failed');
      }
      const total = Number(res.headers.get('x-wp-total') ?? '0') || 0;
      const json = await res.json().catch(() => null);
      return { json, total };
    } catch (err) {
      // AbortError or network error → retry, else rethrow safe errors.
      if ((err as { name?: string }).name === 'AbortError' || isNetworkError(err)) {
        lastErr = err;
        if (attempt < env.WOO_MAX_RETRIES) {
          await delay(250 * (attempt + 1));
          continue;
        }
        throw badGateway('ارتباط با فروشگاه ووکامرس برقرار نشد.', 'woo_unreachable');
      }
      throw err; // already a safe AppError
    }
  }
  // All retries exhausted.
  void lastErr;
  throw badGateway('ارتباط با فروشگاه ووکامرس برقرار نشد.', 'woo_unreachable');
}

function isNetworkError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? '';
  return /fetch failed|ECONN|ENOTFOUND|EAI_AGAIN|network/i.test(msg);
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

function pageParams(q: ListQuery): { page: number; per_page: number } {
  const page = Math.max(1, q.page ?? 1);
  const per_page = Math.min(100, Math.max(1, q.pageSize ?? 20));
  return { page, per_page };
}

/** Verify credentials by reading store system status / a cheap endpoint. Returns store meta. */
export async function verifyWooCredentials(
  creds: WooCredentials,
): Promise<{ ok: true; currency: string; wooVersion: string | null }> {
  // /data/currencies/current is lightweight and requires read auth.
  const { json } = await wooFetch(creds, '/data/currencies/current');
  const currency = (json as { code?: string })?.code ?? 'IRT';
  let wooVersion: string | null = null;
  try {
    const sys = await wooFetch(creds, '/system_status', {});
    wooVersion = ((sys.json as { environment?: { version?: string } })?.environment?.version) ?? null;
  } catch {
    // system_status may be restricted; currency check already proved auth works.
  }
  return { ok: true, currency, wooVersion };
}

export async function listProducts(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedProduct>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/products', {
    page,
    per_page,
    search: q.search,
    status: q.status,
  });
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((p) => normalizeProduct(p as Record<string, unknown>)),
  };
}

export async function getProduct(
  creds: WooCredentials,
  productId: string,
): Promise<NormalizedProduct> {
  const { json } = await wooFetch(creds, `/products/${encodeURIComponent(productId)}`);
  return normalizeProduct(json as Record<string, unknown>);
}

export async function listCategories(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedCategory>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/products/categories', { page, per_page });
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((c) => normalizeCategory(c as Record<string, unknown>)),
  };
}

export async function listProductVariations(
  creds: WooCredentials,
  productId: string,
  q: ListQuery = {},
): Promise<WooPage<NormalizedVariation>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(
    creds,
    `/products/${encodeURIComponent(productId)}/variations`,
    { page, per_page },
  );
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((v) => normalizeVariation(v as Record<string, unknown>)),
  };
}

export async function listTags(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedTaxonomyTerm>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/products/tags', { page, per_page });
  const rows = Array.isArray(json) ? json : [];
  return { page, pageSize: per_page, total, items: rows.map((t) => normalizeTaxonomyTerm(t as Record<string, unknown>)) };
}

/**
 * Brands come from the optional `product_brand` taxonomy (WooCommerce Brands / Woodmart / Perfect
 * Brands). The endpoint may not exist on a given store — callers treat a failure as "no brands".
 */
export async function listBrands(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedTaxonomyTerm>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/products/brands', { page, per_page });
  const rows = Array.isArray(json) ? json : [];
  return { page, pageSize: per_page, total, items: rows.map((b) => normalizeTaxonomyTerm(b as Record<string, unknown>)) };
}

export async function listAttributes(creds: WooCredentials): Promise<NormalizedAttribute[]> {
  const { json } = await wooFetch(creds, '/products/attributes', { per_page: 100 });
  const rows = Array.isArray(json) ? json : [];
  return rows.map((a) => {
    const r = a as Record<string, unknown>;
    return {
      externalId: String(r.id ?? ''),
      name: String(r.name ?? ''),
      slug: (r.slug as string) || null,
      type: (r.type as string) || null,
      raw: r,
    };
  });
}

export async function listAttributeTerms(
  creds: WooCredentials,
  attributeExternalId: string,
  q: ListQuery = {},
): Promise<WooPage<NormalizedAttributeTerm>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(
    creds,
    `/products/attributes/${encodeURIComponent(attributeExternalId)}/terms`,
    { page, per_page },
  );
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((t) => {
      const r = t as Record<string, unknown>;
      return {
        attributeExternalId,
        externalId: String(r.id ?? ''),
        name: String(r.name ?? ''),
        slug: (r.slug as string) || null,
        raw: r,
      };
    }),
  };
}

export async function listOrders(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedOrder>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/orders', {
    page,
    per_page,
    status: q.status,
    search: q.search,
  });
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((o) => normalizeOrder(o as Record<string, unknown>)),
  };
}

export async function getOrder(creds: WooCredentials, orderId: string): Promise<NormalizedOrder> {
  const { json } = await wooFetch(creds, `/orders/${encodeURIComponent(orderId)}`);
  return normalizeOrder(json as Record<string, unknown>);
}

export async function listCustomers(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedCustomer>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/customers', { page, per_page, search: q.search });
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((c) => normalizeCustomer(c as Record<string, unknown>)),
  };
}

export async function listCoupons(
  creds: WooCredentials,
  q: ListQuery = {},
): Promise<WooPage<NormalizedCoupon>> {
  const { page, per_page } = pageParams(q);
  const { json, total } = await wooFetch(creds, '/coupons', { page, per_page });
  const rows = Array.isArray(json) ? json : [];
  return {
    page,
    pageSize: per_page,
    total,
    items: rows.map((c) => normalizeCoupon(c as Record<string, unknown>)),
  };
}

export interface SalesReport {
  totalSalesMinor: number;
  netSalesMinor: number;
  totalOrders: number;
  totalItems: number;
  currency: string;
  period: string;
}

export async function getSalesReport(
  creds: WooCredentials,
  period: 'week' | 'month' | 'year' = 'week',
): Promise<SalesReport> {
  const { json } = await wooFetch(creds, '/reports/sales', { period });
  const row = Array.isArray(json) ? (json[0] as Record<string, unknown>) : {};
  const currency = 'IRT';
  return {
    period,
    currency,
    totalSalesMinor: toMinorUnits(String(row?.total_sales ?? '0'), currency),
    netSalesMinor: toMinorUnits(String(row?.net_sales ?? '0'), currency),
    totalOrders: Number(row?.total_orders ?? 0),
    totalItems: Number(row?.total_items ?? 0),
  };
}

// ---- write operations (controlled; require manage permission upstream) ----

export async function updateProductStock(
  creds: WooCredentials,
  productId: string,
  stockQuantity: number,
): Promise<NormalizedProduct> {
  const { json } = await wooPut(creds, `/products/${encodeURIComponent(productId)}`, {
    stock_quantity: stockQuantity,
    manage_stock: true,
  });
  return normalizeProduct(json as Record<string, unknown>);
}

export async function updateOrderStatus(
  creds: WooCredentials,
  orderId: string,
  status: string,
): Promise<NormalizedOrder> {
  const { json } = await wooPut(creds, `/orders/${encodeURIComponent(orderId)}`, { status });
  return normalizeOrder(json as Record<string, unknown>);
}

export interface ProductUpdateInput {
  name?: string;
  /** Major-unit price string (e.g. "120000"); WooCommerce stores prices as strings. */
  regularPrice?: string;
  /** Major-unit sale price string. Empty string clears the sale. */
  salePrice?: string;
  status?: string;
  manageStock?: boolean;
  stockQuantity?: number;
  stockStatus?: string;
  /** WooCommerce category external ids to assign. */
  categoryExternalIds?: ReadonlyArray<string>;
  /**
   * Images by EXISTING WooCommerce media id or already-hosted URL. No binary upload is performed
   * here — that is the only safe write path until a media-upload backend exists.
   */
  images?: ReadonlyArray<{ id?: string; src?: string }>;
}

/** Update a WooCommerce product (controlled fields only; requires manage permission upstream). */
export async function updateProduct(
  creds: WooCredentials,
  productId: string,
  input: ProductUpdateInput,
): Promise<NormalizedProduct> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name;
  if (input.regularPrice !== undefined) body.regular_price = input.regularPrice;
  if (input.salePrice !== undefined) body.sale_price = input.salePrice;
  if (input.status !== undefined) body.status = input.status;
  if (input.manageStock !== undefined) body.manage_stock = input.manageStock;
  if (input.stockQuantity !== undefined) body.stock_quantity = input.stockQuantity;
  if (input.stockStatus !== undefined) body.stock_status = input.stockStatus;
  if (input.categoryExternalIds !== undefined) {
    body.categories = input.categoryExternalIds.map((id) => ({ id: Number(id) || id }));
  }
  if (input.images !== undefined) {
    body.images = input.images.map((img) =>
      img.id !== undefined ? { id: Number(img.id) || img.id } : { src: img.src },
    );
  }
  const { json } = await wooPut(creds, `/products/${encodeURIComponent(productId)}`, body);
  return normalizeProduct(json as Record<string, unknown>);
}

export interface ProductCreateInput {
  name: string;
  sku?: string;
  /** Major-unit price string (e.g. "120000"). */
  regularPrice?: string;
  /** WooCommerce publication status. The created product is REALLY in this status. */
  status?: string;
  manageStock?: boolean;
  stockQuantity?: number;
  description?: string;
}

/**
 * Create a WooCommerce product and return its REAL resulting state (status, id, …). The caller
 * reports the truthful status — "publish" really publishes; "draft" really stays a draft. No
 * binary image upload is performed (images are added in WordPress), so no fake media is attached.
 */
export async function createProduct(
  creds: WooCredentials,
  input: ProductCreateInput,
): Promise<NormalizedProduct> {
  const body: Record<string, unknown> = { name: input.name, type: 'simple' };
  if (input.sku !== undefined && input.sku !== '') body.sku = input.sku;
  if (input.regularPrice !== undefined && input.regularPrice !== '') {
    body.regular_price = input.regularPrice;
  }
  if (input.status !== undefined) body.status = input.status;
  if (input.description !== undefined && input.description !== '') {
    body.description = input.description;
  }
  if (input.stockQuantity !== undefined) {
    body.manage_stock = input.manageStock ?? true;
    body.stock_quantity = input.stockQuantity;
  }
  const { json } = await wooPost(creds, `/products`, body);
  return normalizeProduct(json as Record<string, unknown>);
}

async function wooPut(
  creds: WooCredentials,
  path: string,
  body: Record<string, unknown>,
): Promise<{ json: unknown }> {
  return wooWrite(creds, 'PUT', path, body);
}

async function wooPost(
  creds: WooCredentials,
  path: string,
  body: Record<string, unknown>,
): Promise<{ json: unknown }> {
  return wooWrite(creds, 'POST', path, body);
}

async function wooWrite(
  creds: WooCredentials,
  method: 'PUT' | 'POST',
  path: string,
  body: Record<string, unknown>,
): Promise<{ json: unknown }> {
  const url = `${baseUrl(creds.storeUrl)}/wp-json/wc/v3${path}`;
  await assertSafeOutboundUrl(url);
  try {
    const res = await safeFetch(url, {
      method,
      headers: {
        Authorization: authHeader(creds),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      timeoutMs: env.WOO_HTTP_TIMEOUT_MS,
    });
    if (res.status === 401 || res.status === 403) {
      throw badGateway('اعتبارنامه ووکامرس اجازه این عملیات را ندارد.', 'woo_auth_failed');
    }
    if (!res.ok) throw badGateway('بروزرسانی در ووکامرس ناموفق بود.', 'woo_request_failed');
    return { json: await res.json().catch(() => null) };
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError' || isNetworkError(err)) {
      throw badGateway('ارتباط با فروشگاه ووکامرس برقرار نشد.', 'woo_unreachable');
    }
    throw err;
  }
}

// ---- normalizers ----

function normalizeProduct(p: Record<string, unknown>): NormalizedProduct {
  const currency = 'IRT';
  const rawCategories = Array.isArray(p.categories) ? (p.categories as Record<string, unknown>[]) : [];
  const rawTags = Array.isArray(p.tags) ? (p.tags as Record<string, unknown>[]) : [];
  const rawBrands = Array.isArray(p.brands) ? (p.brands as Record<string, unknown>[]) : [];
  const rawImages = Array.isArray(p.images) ? (p.images as Record<string, unknown>[]) : [];
  const rawAttributes = Array.isArray(p.attributes) ? (p.attributes as Record<string, unknown>[]) : [];
  const ref = (c: Record<string, unknown>): NormalizedProductRef => ({
    externalId: String(c.id ?? ''),
    name: (c.name as string) || null,
    slug: (c.slug as string) || null,
  });
  const sale = String(p.sale_price ?? '');
  return {
    externalId: String(p.id ?? ''),
    name: String(p.name ?? ''),
    sku: (p.sku as string) || null,
    status: (p.status as string) || null,
    type: (p.type as string) || null,
    permalink: (p.permalink as string) || null,
    priceMinor: toMinorUnits(String(p.price ?? '0'), currency),
    regularPriceMinor: toMinorUnits(String(p.regular_price ?? p.price ?? '0'), currency),
    salePriceMinor: sale ? toMinorUnits(sale, currency) : null,
    currency,
    stockStatus: (p.stock_status as string) || null,
    stockQty: p.stock_quantity === null || p.stock_quantity === undefined ? null : Number(p.stock_quantity),
    categories: rawCategories.map((c) => ({ externalId: String(c.id ?? ''), name: (c.name as string) || null })),
    tags: rawTags.map(ref),
    brands: rawBrands.map(ref),
    productAttributes: rawAttributes.map((a, i) => ({
      externalId: a.id === undefined || a.id === null || Number(a.id) === 0 ? null : String(a.id),
      name: String(a.name ?? ''),
      slug: (a.slug as string) || null,
      options: Array.isArray(a.options) ? (a.options as unknown[]).map((o) => String(o)) : [],
      isVariation: Boolean(a.variation),
      isVisible: a.visible === undefined ? true : Boolean(a.visible),
      position: typeof a.position === 'number' ? (a.position as number) : i,
      raw: a,
    })),
    images: rawImages.map((img, i) => ({
      externalId: img.id === undefined || img.id === null ? null : String(img.id),
      src: String(img.src ?? ''),
      alt: (img.alt as string) || null,
      position: typeof img.position === 'number' ? (img.position as number) : i,
    })).filter((img) => img.src.length > 0),
    attributes: p.attributes ?? null,
    meta: p.meta_data ?? null,
    raw: p,
  };
}

function normalizeCategory(c: Record<string, unknown>): NormalizedCategory {
  const parent = c.parent === undefined || c.parent === null || Number(c.parent) === 0
    ? null
    : String(c.parent);
  return {
    externalId: String(c.id ?? ''),
    parentExternalId: parent,
    name: String(c.name ?? ''),
    slug: (c.slug as string) || null,
    raw: c,
  };
}

function normalizeTaxonomyTerm(c: Record<string, unknown>): NormalizedTaxonomyTerm {
  return {
    externalId: String(c.id ?? ''),
    name: String(c.name ?? ''),
    slug: (c.slug as string) || null,
    raw: c,
  };
}

function normalizeVariation(v: Record<string, unknown>): NormalizedVariation {
  const currency = 'IRT';
  return {
    externalId: String(v.id ?? ''),
    sku: (v.sku as string) || null,
    priceMinor: toMinorUnits(String(v.price ?? '0'), currency),
    currency,
    stockStatus: (v.stock_status as string) || null,
    stockQty: v.stock_quantity === null || v.stock_quantity === undefined ? null : Number(v.stock_quantity),
    attributes: v.attributes ?? null,
    meta: v.meta_data ?? null,
    raw: v,
  };
}

function normalizeOrder(o: Record<string, unknown>): NormalizedOrder {
  const currency = (o.currency as string) || 'IRT';
  const billing = (o.billing as Record<string, unknown>) ?? {};
  const first = (billing.first_name as string) ?? '';
  const last = (billing.last_name as string) ?? '';
  const name = `${first} ${last}`.trim();
  return {
    externalId: String(o.id ?? ''),
    number: (o.number as string) || String(o.id ?? ''),
    status: (o.status as string) || null,
    totalMinor: toMinorUnits(String(o.total ?? '0'), currency),
    currency,
    customerName: name || null, // minimal PII (display name only; no email/phone/address)
    createdAt: (o.date_created_gmt as string) || (o.date_created as string) || null,
  };
}

function normalizeCustomer(c: Record<string, unknown>): NormalizedCustomer {
  const currency = 'IRT';
  const first = (c.first_name as string) ?? '';
  const last = (c.last_name as string) ?? '';
  const username = (c.username as string) ?? '';
  const display = `${first} ${last}`.trim() || username || null;
  return {
    externalId: String(c.id ?? ''),
    displayName: display,
    ordersCount: Number(c.orders_count ?? 0),
    totalSpentMinor: toMinorUnits(String(c.total_spent ?? '0'), currency),
    currency,
  };
}

function normalizeCoupon(c: Record<string, unknown>): NormalizedCoupon {
  const currency = 'IRT';
  return {
    externalId: String(c.id ?? ''),
    code: (c.code as string) || null,
    discountType: (c.discount_type as string) || null,
    amountMinor: toMinorUnits(String(c.amount ?? '0'), currency),
    currency,
  };
}
