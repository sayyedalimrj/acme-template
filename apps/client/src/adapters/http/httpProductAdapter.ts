/**
 * HTTP Product adapter — reads the active site's products from the backend read-model and maps
 * them onto the app's Product domain type.
 */
import { http, qs } from '@/services/httpClient';
import { minorToMoney } from '@/domain/money';
import type {
  Paged,
  Product,
  ProductAttribute,
  ProductCategory,
  ProductImage,
  ProductListQuery,
  ProductStatus,
  ProductCreateInput,
  ProductSyncSource,
  ProductSyncStatus,
  ProductTag,
  ProductUpdateInput,
  ProductVariation,
  StockStatus,
} from '@/domain/types';

import type { ProductAdapter } from '../types';
import { getActiveHttpSiteId } from './httpActiveSite';

interface BackendCategory {
  external_id: string;
  name: string | null;
}

interface BackendTag {
  external_id: string;
  name: string | null;
}

interface BackendAttribute {
  external_id: string;
  name: string | null;
  options?: string[] | null;
  is_visible?: boolean;
  is_variation?: boolean;
}

interface BackendVariant {
  external_id: string;
  sku: string | null;
  price_minor: number | string;
  regular_price_minor?: number | string | null;
  sale_price_minor?: number | string | null;
  currency: string;
  stock_status: string | null;
  stock_qty: number | null;
  attributes?: Record<string, string> | null;
}

interface BackendImage {
  src: string;
  alt: string | null;
  position: number;
  width?: number | null;
  height?: number | null;
}

interface BackendProduct {
  external_id: string;
  name: string;
  sku: string | null;
  status: string | null;
  type?: string | null;
  price_minor: number | string;
  regular_price_minor?: number | string | null;
  sale_price_minor?: number | string | null;
  currency: string;
  stock_status: string | null;
  stock_qty: number | null;
  image_src?: string | null;
  images?: BackendImage[];
  categories?: BackendCategory[];
  tags?: BackendTag[];
  attributes?: BackendAttribute[];
  variants?: BackendVariant[];
  variations_count?: number | null;
  images_count?: number | null;
  total_sales?: number | null;
  average_rating?: number | null;
  rating_count?: number | null;
  permalink?: string | null;
  admin_edit_url?: string | null;
  sync_source?: string | null;
  sync_status?: string | null;
  last_synced_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
}

function toCategories(rows: BackendCategory[] | undefined): ProductCategory[] {
  return (rows ?? [])
    .filter((c) => c.external_id)
    .map((c) => ({ id: c.external_id, name: c.name ?? '', slug: c.external_id }));
}

function toTags(rows: BackendTag[] | undefined): ProductTag[] {
  return (rows ?? [])
    .filter((t) => t.external_id)
    .map((t) => ({ id: t.external_id, name: t.name ?? '' }));
}

function toAttributes(rows: BackendAttribute[] | undefined): ProductAttribute[] {
  return (rows ?? []).map((a) => ({
    id: a.external_id,
    name: a.name ?? '',
    options: a.options ?? [],
    visible: a.is_visible ?? true,
    variation: a.is_variation ?? false,
  }));
}

function toVariations(rows: BackendVariant[] | undefined): ProductVariation[] {
  return (rows ?? []).map((v) => ({
    id: v.external_id,
    sku: v.sku ?? '',
    price: minorToMoney(v.price_minor, v.currency),
    regularPrice: v.regular_price_minor
      ? minorToMoney(v.regular_price_minor, v.currency)
      : undefined,
    salePrice: v.sale_price_minor ? minorToMoney(v.sale_price_minor, v.currency) : undefined,
    stockStatus: (['instock', 'outofstock', 'onbackorder'] as const).includes(
      v.stock_status as StockStatus,
    )
      ? (v.stock_status as StockStatus)
      : 'instock',
    stockQuantity: v.stock_qty ?? undefined,
    attributes: v.attributes ?? {},
  }));
}

function toImages(p: BackendProduct): ProductImage[] {
  if (Array.isArray(p.images) && p.images.length > 0) {
    return p.images
      .filter((i) => i.src)
      .map((i, idx) => ({
        id: `${p.external_id}-${idx}`,
        src: i.src,
        alt: i.alt ?? p.name,
        width: i.width ?? undefined,
        height: i.height ?? undefined,
      }));
  }
  if (p.image_src) {
    return [{ id: `${p.external_id}-0`, src: p.image_src, alt: p.name }];
  }
  return [];
}

function mapProductType(type: string | null | undefined): Product['type'] {
  if (type === 'variable' || type === 'grouped' || type === 'external') return type;
  return 'simple';
}

function mapSyncSource(source: string | null | undefined): ProductSyncSource | undefined {
  if (source === 'plugin' || source === 'woo_rest') return source;
  return undefined;
}

function mapSyncStatus(status: string | null | undefined): ProductSyncStatus | undefined {
  if (status === 'synced' || status === 'stale' || status === 'error' || status === 'pending') {
    return status;
  }
  return undefined;
}

function toProduct(p: BackendProduct): Product {
  const money = minorToMoney(p.price_minor, p.currency);
  const regular = p.regular_price_minor
    ? minorToMoney(p.regular_price_minor, p.currency)
    : money;
  const sale = p.sale_price_minor ? minorToMoney(p.sale_price_minor, p.currency) : undefined;
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
    type: mapProductType(p.type),
    status,
    price: sale ?? money,
    regularPrice: regular,
    salePrice: sale,
    currency: p.currency,
    stockStatus,
    stockQuantity: p.stock_qty ?? undefined,
    manageStock: p.stock_qty !== null && p.stock_qty !== undefined,
    categories: toCategories(p.categories),
    tags: toTags(p.tags),
    attributes: toAttributes(p.attributes),
    variations: toVariations(p.variants),
    variationsCount: p.variations_count ?? p.variants?.length,
    imagesCount: p.images_count ?? p.images?.length,
    images: toImages(p),
    permalink: p.permalink ?? undefined,
    adminEditUrl: p.admin_edit_url ?? undefined,
    totalSales: p.total_sales ?? undefined,
    averageRating: p.average_rating ?? undefined,
    ratingCount: p.rating_count ?? undefined,
    syncSource: mapSyncSource(p.sync_source),
    syncStatus: mapSyncStatus(p.sync_status),
    lastSyncedAt: p.last_synced_at ?? undefined,
    dateCreated: p.created_at ?? now,
    dateModified: p.updated_at ?? p.last_synced_at ?? now,
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
      const res = await http.get<{
        items: BackendProduct[];
        page: number;
        pageSize: number;
        total: number;
        hasNext?: boolean;
      }>(
        `/merchant/sites/${siteId()}/products${qs({
          page: query.page,
          pageSize: query.pageSize,
          search: query.search,
          stockStatus: query.stockStatus,
          status: query.status,
        })}`,
      );
      return {
        items: res.items.map(toProduct),
        total: res.total,
        page: res.page,
        pageSize: res.pageSize,
        hasNext: res.hasNext ?? res.page * res.pageSize < res.total,
      };
    },
    async getProduct(id: string): Promise<Product> {
      const res = await http.get<{ product: BackendProduct }>(
        `/merchant/sites/${siteId()}/products/${encodeURIComponent(id)}`,
      );
      return toProduct(res.product);
    },
    async updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
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
    async deleteProduct(id: string): Promise<void> {
      await http.del<{ ok: boolean }>(
        `/merchant/sites/${siteId()}/products/${encodeURIComponent(id)}`,
      );
    },
    async createProduct(input: ProductCreateInput): Promise<Product> {
      const body: Record<string, unknown> = { name: input.name, status: input.status ?? 'draft' };
      if (input.sku !== undefined && input.sku !== '') body.sku = input.sku;
      if (input.regularPrice !== undefined) body.regularPrice = String(input.regularPrice);
      if (input.stockQuantity !== undefined) body.stockQuantity = input.stockQuantity;
      if (input.description !== undefined && input.description !== '') {
        body.description = input.description;
      }
      const res = await http.post<{ product: BackendProduct }>(
        `/merchant/sites/${siteId()}/products`,
        body,
      );
      return toProduct(res.product);
    },
  };
}
