/**
 * WooCommerce proxy contract (backend skeleton).
 *
 * INTERFACE ONLY. No real HTTP calls, no WooCommerce REST requests, no credentials. The
 * future backend signs/authorizes requests server-side and returns frontend-safe data. The
 * provided stub returns safe `not_implemented` errors. Every method requires a `siteId` and
 * a `RequestContext` (tenant/user/role). Mutations are reserved for a later phase and are
 * intentionally suffixed `Later`. See `security-model.md`.
 */
import type { RequestContext } from '../domain/permission';
import type { SiteId } from '../domain/site';
import { createSafeError, type Result } from '../security/errors';

/** A reporting period for proxied report reads (mirrors the client's report periods). */
export type ProxyReportPeriod = 'today' | 'last_7_days' | 'last_30_days' | 'this_month';

/** Minimal, frontend-safe product shape returned by the proxy (full DTOs land later). */
export interface ProxyProduct {
  id: string;
  name: string;
  sku?: string;
}

/** Minimal, frontend-safe order shape. */
export interface ProxyOrder {
  id: string;
  status: string;
  total?: string;
}

/** Minimal, frontend-safe customer shape (no unnecessary PII). */
export interface ProxyCustomer {
  id: string;
  displayName: string;
}

/** Minimal, frontend-safe report shape. */
export interface ProxyReport {
  period: ProxyReportPeriod;
  generatedAt: string;
}

/** A page of proxied results. */
export interface ProxyCollection<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Optional pagination input. */
export interface ProxyListQuery {
  page?: number;
  pageSize?: number;
}

/**
 * The WooCommerce proxy. All reads go through the backend; the client never calls the store
 * directly. Write methods are reserved (`*Later`) and not implemented in this skeleton.
 */
export interface WooCommerceProxy {
  listProducts(
    siteId: SiteId,
    context: RequestContext,
    query?: ProxyListQuery,
  ): Promise<Result<ProxyCollection<ProxyProduct>>>;
  getProduct(
    siteId: SiteId,
    productId: string,
    context: RequestContext,
  ): Promise<Result<ProxyProduct>>;
  listOrders(
    siteId: SiteId,
    context: RequestContext,
    query?: ProxyListQuery,
  ): Promise<Result<ProxyCollection<ProxyOrder>>>;
  getOrder(siteId: SiteId, orderId: string, context: RequestContext): Promise<Result<ProxyOrder>>;
  listCustomers(
    siteId: SiteId,
    context: RequestContext,
    query?: ProxyListQuery,
  ): Promise<Result<ProxyCollection<ProxyCustomer>>>;
  getCustomer(
    siteId: SiteId,
    customerId: string,
    context: RequestContext,
  ): Promise<Result<ProxyCustomer>>;
  getReports(
    siteId: SiteId,
    period: ProxyReportPeriod,
    context: RequestContext,
  ): Promise<Result<ProxyReport>>;
  /** Reserved for the controlled-mutation phase. */
  updateProductStockLater(
    siteId: SiteId,
    productId: string,
    context: RequestContext,
  ): Promise<Result<never>>;
  /** Reserved for the controlled-mutation phase. */
  updateOrderStatusLater(
    siteId: SiteId,
    orderId: string,
    context: RequestContext,
  ): Promise<Result<never>>;
}

/** Guard: every proxy call requires a non-empty siteId. */
function requireSiteId(siteId: SiteId): Result<never> | null {
  if (!siteId || siteId.trim().length === 0) {
    return { ok: false, error: createSafeError('validation_error', 'A siteId is required.') };
  }
  return null;
}

/**
 * A stub proxy that performs no network calls and returns safe errors. Validates that a
 * siteId is present, then returns `not_implemented`. Safe to wire into route handlers now.
 */
export function createNotImplementedWooCommerceProxy(): WooCommerceProxy {
  const reject = async <T>(siteId: SiteId, operation: string): Promise<Result<T>> => {
    const missing = requireSiteId(siteId);
    if (missing) {
      return missing;
    }
    return { ok: false, error: createSafeError('not_implemented', undefined, { operation }) };
  };

  return {
    listProducts: (siteId) => reject(siteId, 'listProducts'),
    getProduct: (siteId) => reject(siteId, 'getProduct'),
    listOrders: (siteId) => reject(siteId, 'listOrders'),
    getOrder: (siteId) => reject(siteId, 'getOrder'),
    listCustomers: (siteId) => reject(siteId, 'listCustomers'),
    getCustomer: (siteId) => reject(siteId, 'getCustomer'),
    getReports: (siteId) => reject(siteId, 'getReports'),
    updateProductStockLater: (siteId) => reject(siteId, 'updateProductStockLater'),
    updateOrderStatusLater: (siteId) => reject(siteId, 'updateOrderStatusLater'),
  };
}
