/**
 * HTTP Product adapter — reads the active site's products from the backend read-model and maps
 * them onto the app's Product domain type (with safe defaults for fields the read-model omits).
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type { Paged, Product, ProductListQuery, ProductStatus, StockStatus } from '@/domain/types';

import type { ProductAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendProduct {
  external_id: string;
  name: string;
  sku: string | null;
  status: string | null;
  price_minor: number | string;
  currency: string;
  stock_status: string | null;
  stock_qty: number | null;
}

function toProduct(p: BackendProduct): Product {
  const money = minorToMoney(p.price_minor, p.currency);
  const status = (['publish', 'draft', 'pending', 'private'] as const).includes(
    p.status as ProductStatus,
  )
    ? (p.status as ProductStatus)
    : 'publish';
  const stockStatus = (['instock', 'outofstock', 'onbackorder'] as const).includes(
    p.stock_status as StockStatus,
  )
    ? (p.stock_status as StockStatus)
    : 'instock';
  const now = new Date().toISOString();
  return {
    id: p.external_id,
    name: p.name,
    slug: p.sku ?? p.external_id,
    sku: p.sku ?? '',
    type: 'simple',
    status,
    price: money,
    regularPrice: money,
    currency: p.currency,
    stockStatus,
    stockQuantity: p.stock_qty ?? undefined,
    manageStock: p.stock_qty !== null && p.stock_qty !== undefined,
    categories: [],
    images: [],
    dateCreated: now,
    dateModified: now,
  };
}

function siteId(): string {
  const id = getActiveHttpSiteId();
  if (!id) throw new Error('هیچ فروشگاهی انتخاب نشده است.');
  return id;
}

export function createHttpProductAdapter(): ProductAdapter {
  return {
    async listProducts(query: ProductListQuery = {}): Promise<Paged<Product>> {
      const res = await http.get<{ items: BackendProduct[]; page: number; pageSize: number; total: number }>(
        `/merchant/sites/${siteId()}/products${qs({ page: query.page, pageSize: query.pageSize, search: query.search })}`,
      );
      return {
        items: res.items.map(toProduct),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
      };
    },
    async getProduct(id: string): Promise<Product> {
      const res = await http.get<{ product: BackendProduct }>(
        `/merchant/sites/${siteId()}/products/${encodeURIComponent(id)}`,
      );
      return toProduct(res.product);
    },
  };
}
