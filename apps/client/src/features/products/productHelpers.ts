/**
 * Pure helpers for the Products module: filtering and badge presentation.
 *
 * Kept free of React so they are trivially unit-testable and reused by list + detail.
 * Inventory-first thinking: low-stock is derived from stock status + quantity.
 */
import type { BadgeTone } from '@/components/ui';
import type { Product, ProductStatus } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

export const LOW_STOCK_THRESHOLD = 10;

export type StockFilter = 'all' | 'instock' | 'low' | 'outofstock';
export type StatusFilter = 'all' | ProductStatus;

export interface ProductFilterCriteria {
  search?: string;
  stock?: StockFilter;
  status?: StatusFilter;
}

/** A managed, in-stock product at/under the threshold is "low stock". */
export function isLowStock(product: Product): boolean {
  return (
    product.stockStatus === 'instock' && (product.stockQuantity ?? Infinity) <= LOW_STOCK_THRESHOLD
  );
}

function matchesStock(product: Product, stock: StockFilter): boolean {
  switch (stock) {
    case 'instock':
      return product.stockStatus === 'instock';
    case 'low':
      return isLowStock(product);
    case 'outofstock':
      // Anything not sellable from stock: out of stock or on backorder.
      return product.stockStatus !== 'instock';
    case 'all':
    default:
      return true;
  }
}

/** Filter products by free-text (name or SKU), stock state, and product status. */
export function filterProducts(
  products: Product[],
  { search, stock = 'all', status = 'all' }: ProductFilterCriteria = {},
): Product[] {
  const query = search?.trim().toLowerCase() ?? '';
  return products.filter((product) => {
    if (query) {
      const haystack = `${product.name} ${product.sku}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    if (status !== 'all' && product.status !== status) {
      return false;
    }
    if (!matchesStock(product, stock)) {
      return false;
    }
    return true;
  });
}

export interface BadgeSpec {
  tone: BadgeTone;
  labelKey: StringKey;
}

/** Badge describing a product's effective stock state (out/backorder/low/in). */
export function stockBadge(product: Product): BadgeSpec {
  if (product.stockStatus === 'outofstock') {
    return { tone: 'danger', labelKey: 'product.stock.outofstock' };
  }
  if (product.stockStatus === 'onbackorder') {
    return { tone: 'warning', labelKey: 'product.stock.onbackorder' };
  }
  if (isLowStock(product)) {
    return { tone: 'warning', labelKey: 'product.stock.low' };
  }
  return { tone: 'success', labelKey: 'product.stock.instock' };
}

/** Badge describing a product's publication status. */
export function statusBadge(status: ProductStatus): BadgeSpec {
  switch (status) {
    case 'publish':
      return { tone: 'success', labelKey: 'product.status.publish' };
    case 'pending':
      return { tone: 'warning', labelKey: 'product.status.pending' };
    case 'draft':
      return { tone: 'neutral', labelKey: 'product.status.draft' };
    case 'private':
    default:
      return { tone: 'neutral', labelKey: 'product.status.private' };
  }
}
