/**
 * Mock Product adapter — list (with simple filters + pagination) and get-by-id.
 */
import { products } from '@/mock/data/catalog';
import type {
  Paged,
  Product,
  ProductCreateInput,
  ProductListQuery,
  ProductUpdateInput,
} from '@/domain/types';

import type { ProductAdapter } from '../types';
import { siteScopedView } from './mockActiveSite';
import { clone, delay, paginate } from './mockUtils';

function applyFilters(items: Product[], query: ProductListQuery): Product[] {
  let result = items;
  if (query.search) {
    const q = query.search.toLowerCase();
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  }
  if (query.status) {
    result = result.filter((p) => p.status === query.status);
  }
  if (query.stockStatus) {
    result = result.filter((p) => p.stockStatus === query.stockStatus);
  }
  if (query.categoryId) {
    result = result.filter((p) => p.categories.some((c) => c.id === query.categoryId));
  }
  if (query.brandId) {
    result = result.filter((p) => p.brand?.id === query.brandId);
  }
  return result;
}

export function createMockProductAdapter(): ProductAdapter {
  return {
    async listProducts(query: ProductListQuery = {}): Promise<Paged<Product>> {
      await delay();
      // Per-store view so switching the active site changes the products list.
      const filtered = applyFilters(siteScopedView(products), query);
      return clone(paginate(filtered, query.page, query.pageSize));
    },
    async getProduct(id: string): Promise<Product> {
      await delay();
      const found = products.find((p) => p.id === id);
      if (!found) {
        throw new Error(`Product not found: ${id}`);
      }
      return clone(found);
    },
    async updateProduct(id: string, input: ProductUpdateInput): Promise<Product> {
      await delay();
      const found = products.find((p) => p.id === id);
      if (!found) {
        throw new Error(`Product not found: ${id}`);
      }
      // Apply the controlled fields in-memory (mock has no real store).
      if (input.name !== undefined) found.name = input.name;
      if (input.status !== undefined) found.status = input.status;
      if (input.stockStatus !== undefined) found.stockStatus = input.stockStatus;
      if (input.stockQuantity !== undefined) {
        found.stockQuantity = input.stockQuantity;
        found.manageStock = true;
      }
      if (input.regularPrice !== undefined) {
        const money = String(input.regularPrice);
        found.regularPrice = money;
        found.price = money;
      }
      if (input.categoryIds !== undefined) {
        found.categories = input.categoryIds.map((cid) => {
          const existing = found.categories.find((c) => c.id === cid);
          return existing ?? { id: cid, name: cid, slug: cid };
        });
      }
      found.dateModified = new Date().toISOString();
      return clone(found);
    },
    async deleteProduct(id: string): Promise<void> {
      await delay();
      const idx = products.findIndex((p) => p.id === id);
      if (idx === -1) {
        throw new Error(`Product not found: ${id}`);
      }
      products.splice(idx, 1);
    },
    async createProduct(input: ProductCreateInput): Promise<Product> {
      await delay();
      const now = new Date().toISOString();
      const money = input.regularPrice !== undefined ? String(input.regularPrice) : '0';
      // Truthful mock: the product is created in exactly the chosen status (no fake "review").
      const created: Product = {
        id: `mock-${Date.now()}`,
        name: input.name,
        slug: input.sku || `mock-${Date.now()}`,
        sku: input.sku ?? '',
        type: 'simple',
        status: input.status ?? 'draft',
        price: money,
        regularPrice: money,
        currency: 'IRT',
        stockStatus: 'instock',
        stockQuantity: input.stockQuantity,
        manageStock: input.stockQuantity !== undefined,
        categories: [],
        images: [],
        dateCreated: now,
        dateModified: now,
      };
      products.unshift(created);
      return clone(created);
    },
  };
}
