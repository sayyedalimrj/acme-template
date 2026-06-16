/**
 * Mock Product adapter — list (with simple filters + pagination) and get-by-id.
 */
import { products } from '@/mock/data/catalog';
import type { Paged, Product, ProductListQuery } from '@/domain/types';

import type { ProductAdapter } from '../types';
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
      const filtered = applyFilters(products, query);
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
  };
}
