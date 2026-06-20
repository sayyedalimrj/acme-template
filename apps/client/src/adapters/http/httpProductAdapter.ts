/**
 * HTTP Product adapter — reads the active site's products from the backend read-model and maps
 * them onto the app's Product domain type. The backend serves real WooCommerce-synced data
 * (images, categories, variants, price/stock/status); fields the read-model omits get safe
 * defaults. Writes go through the controlled `PATCH /merchant/sites/:siteId/products/:id` route.
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type {
  Paged,
  Product,
  ProductCategory,
  ProductImage,
  ProductListQuery,
  ProductStatus,
  ProductUpdateInput,
  StockStatus,
} from '@/domain/types';

import type { ProductAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendCategory {
  external_id: string;
  name: string | null;
}

interface BackendImage {
  src: string;
  alt: string | null;
  position: number;
}

interface BackendProduct {
  external_id: string;
  name: string;
  sku: string | null;
  status: string | null;
  type?: string | null;
  price_minor: number | string;
  currency: string;
  stock_status: string | null;
  stock_qty: number | null;
  image_src?: string | null;
  images?: BackendImage[];
  categories?: BackendCategory[];
  permalink?: string | null;
  admin_edit_url?: string | null;
}

function toCategories(rows: BackendCategory[] | undefined): ProductCategory[] {
  return (rows ?? [])
    .filter((c) => c.external_id)
    .map((c) => ({ id: c.external_id, name: c.name ?? '', slug: c.external_id }));
}

function toImages(p: BackendProduct): ProductImage[] {
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images
      .filter((i) => i.src)
      .map((i, idx) => ({
        id: `${p.external_id}-${idx}`,
        src: i.src,
        alt: i.alt ?? p.name,
      }));
  }
  // List view only carries the primary image src.
  if (p.image_src) {
    return [{ id: `${p.external_id}-0`, src: p.image_src, alt: p.name }];
  }
  return [];
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
    type: p.type === 'variable' ? 'variable' : 'simple',
    status,
    price: money,
    regularPrice: money,
    currency: p.currency,
    stockStatus,
    stockQuantity: p.stock_qty ?? undefined,
    manageStock: p.stock_qty !== null && p.stock_qty !== undefined,
    categories: toCategories(p.categories),
    images: toImages(p),
    permalink: p.permalink ?? undefined,
    adminEditUrl: p.admin_edit_url ?? undefined,
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
    async updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
      // Map domain input to the backend's controlled update contract. WooCommerce stores prices
      // as major-unit strings; the form provides a major-unit number.
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.regularPrice !== undefined) body.regularPrice = String(input.regularPrice);
      if (input.status !== undefined) body.status = input.status;
      if (input.stockQuantity !== undefined) body.stockQuantity = input.stockQuantity;
      if (input.stockStatus !== undefined) body.stockStatus = input.stockStatus;
      if (input.categoryIds !== undefined) body.categoryExternalIds = input.categoryIds;
      const res = await http.patch<{ product: BackendProduct }>(
        `/merchant/sites/${siteId()}/products/${encodeURIComponent(id)}`,
        body,
      );
      return toProduct(res.product);
    },
  };
}
