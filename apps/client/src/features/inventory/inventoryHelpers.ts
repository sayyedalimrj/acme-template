/**
 * Pure helpers for the Inventory workflow: which products need attention, their priority,
 * and presentation tones. Free of React for easy unit-testing. Reuses the Products module's
 * stock logic so "low stock" stays consistent app-wide.
 */
import type { Product } from '@/domain/types';

import { isLowStock } from '@/features/products/productHelpers';

export type InventoryPriority = 'critical' | 'high' | 'medium';

/** A product needs inventory attention when it is not freely sellable from stock. */
export function needsInventoryAttention(product: Product): boolean {
  return product.stockStatus !== 'instock' || isLowStock(product);
}

/** Out of stock = critical, on backorder = high, low stock = medium. */
export function inventoryPriority(product: Product): InventoryPriority {
  if (product.stockStatus === 'outofstock') {
    return 'critical';
  }
  if (product.stockStatus === 'onbackorder') {
    return 'high';
  }
  return 'medium';
}

const PRIORITY_RANK: Record<InventoryPriority, number> = { critical: 0, high: 1, medium: 2 };

/** Priority chip/icon tint: critical is danger, everything else is a warning. */
export function inventoryPriorityTint(priority: InventoryPriority): 'danger' | 'warning' {
  return priority === 'critical' ? 'danger' : 'warning';
}

/** Products needing attention, sorted by priority (critical first), then lowest stock. */
export function filterInventoryAlerts(products: Product[]): Product[] {
  return products.filter(needsInventoryAttention).sort((a, b) => {
    const byPriority = PRIORITY_RANK[inventoryPriority(a)] - PRIORITY_RANK[inventoryPriority(b)];
    if (byPriority !== 0) return byPriority;
    return (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0);
  });
}
