import { describe, expect, it } from '@jest/globals';

import { products } from '@/mock/data/catalog';

import {
  filterProducts,
  isLowStock,
  statusBadge,
  stockBadge,
} from '@/features/products/productHelpers';

describe('filterProducts', () => {
  it('searches by product name (case-insensitive)', () => {
    const result = filterProducts(products, { search: 'آئورا' });
    expect(result).toHaveLength(1);
    expect(result[0].sku).toBe('APP-TEE-001');
  });

  it('searches by SKU', () => {
    const result = filterProducts(products, { search: 'out-btl-750' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('بطری');
  });

  it('filters by low stock', () => {
    const result = filterProducts(products, { stock: 'low' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(isLowStock)).toBe(true);
  });

  it('filters by out-of-stock (not sellable from stock)', () => {
    const result = filterProducts(products, { stock: 'outofstock' });
    expect(result.every((p) => p.stockStatus !== 'instock')).toBe(true);
  });

  it('filters by product status', () => {
    const result = filterProducts(products, { status: 'draft' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.status === 'draft')).toBe(true);
  });

  it('combines search and filters', () => {
    const result = filterProducts(products, { search: 'لومن', status: 'publish' });
    expect(result.every((p) => p.status === 'publish')).toBe(true);
    expect(result.every((p) => p.name.includes('لومن'))).toBe(true);
  });
});

describe('badge helpers', () => {
  it('maps stock states to tones', () => {
    const out = products.find((p) => p.stockStatus === 'outofstock')!;
    expect(stockBadge(out).tone).toBe('danger');
    const back = products.find((p) => p.stockStatus === 'onbackorder')!;
    expect(stockBadge(back).tone).toBe('warning');
  });

  it('maps publication status to tones', () => {
    expect(statusBadge('publish').tone).toBe('success');
    expect(statusBadge('draft').tone).toBe('neutral');
    expect(statusBadge('pending').tone).toBe('warning');
  });
});
