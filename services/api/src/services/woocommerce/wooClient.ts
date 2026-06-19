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

export interface NormalizedProduct {
  externalId: string;
  name: string;
  sku: string | null;
  status: string | null;
  priceMinor: number;
  currency: string;
  stockStatus: string | null;
  stockQty: number | null;
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
  const url = new URL(`${baseUrl(creds.storeUrl)}/wp-json/wc/v3${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= env.WOO_MAX_RETRIES; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.WOO_HTTP_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        headers: { Authorization: authHeader(creds), Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
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
      clearTimeout(timer);
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

async function wooPut(
  creds: WooCredentials,
  path: string,
  body: Record<string, unknown>,
): Promise<{ json: unknown }> {
  const url = `${baseUrl(creds.storeUrl)}/wp-json/wc/v3${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.WOO_HTTP_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: authHeader(creds),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status === 401 || res.status === 403) {
      throw badGateway('اعتبارنامه ووکامرس اجازه این عملیات را ندارد.', 'woo_auth_failed');
    }
    if (!res.ok) throw badGateway('بروزرسانی در ووکامرس ناموفق بود.', 'woo_request_failed');
    return { json: await res.json().catch(() => null) };
  } catch (err) {
    clearTimeout(timer);
    if ((err as { name?: string }).name === 'AbortError' || isNetworkError(err)) {
      throw badGateway('ارتباط با فروشگاه ووکامرس برقرار نشد.', 'woo_unreachable');
    }
    throw err;
  }
}

// ---- normalizers ----

function normalizeProduct(p: Record<string, unknown>): NormalizedProduct {
  const currency = 'IRT';
  return {
    externalId: String(p.id ?? ''),
    name: String(p.name ?? ''),
    sku: (p.sku as string) || null,
    status: (p.status as string) || null,
    priceMinor: toMinorUnits(String(p.price ?? '0'), currency),
    currency,
    stockStatus: (p.stock_status as string) || null,
    stockQty: p.stock_quantity === null || p.stock_quantity === undefined ? null : Number(p.stock_quantity),
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
