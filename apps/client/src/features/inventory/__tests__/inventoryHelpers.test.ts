import { describe, expect, it } from '@jest/globals';

import { products } from '@/mock/data/catalog';

import {
  filterInventoryAlerts,
  inventoryPriority,
  needsInventoryAttention,
} from '@/features/inventory/inventoryHelpers';

describe('inventory helpers', () => {
  it('flags out-of-stock, backordered, and low-stock products', () => {
    const alerts = filterInventoryAlerts(products);
    // Healthy, well-stocked products are excluded.
    expect(alerts.every(needsInventoryAttention)).toBe(true);
    // Mock catalog has an out-of-stock, a backordered, and low-stock items.
    expect(alerts.some((p) => p.stockStatus === 'outofstock')).toBe(true);
    expect(alerts.some((p) => p.stockStatus === 'onbackorder')).toBe(true);
    expect(alerts.some((p) => p.stockStatus === 'instock')).toBe(true); // the low-stock ones
  });

  it('excludes well-stocked products', () => {
    const healthy = products.find(
      (p) => p.stockStatus === 'instock' && (p.stockQuantity ?? 0) > 50,
    );
    expect(healthy).toBeDefined();
    expect(needsInventoryAttention(healthy!)).toBe(false);
  });

  it('derives priority from stock status', () => {
    const out = products.find((p) => p.stockStatus === 'outofstock')!;
    const back = products.find((p) => p.stockStatus === 'onbackorder')!;
    expect(inventoryPriority(out)).toBe('critical');
    expect(inventoryPriority(back)).toBe('high');
  });

  it('sorts critical (out of stock) first', () => {
    const alerts = filterInventoryAlerts(products);
    expect(inventoryPriority(alerts[0])).toBe('critical');
  });
});
