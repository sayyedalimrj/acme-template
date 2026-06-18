import { describe, expect, it } from '@jest/globals';

import { customers } from '@/mock/data/customers';

import {
  averageOrderValue,
  customerSegment,
  filterCustomers,
  segmentBadge,
} from '@/features/customers/customerHelpers';

describe('filterCustomers', () => {
  it('searches by customer name', () => {
    const result = filterCustomers(customers, { search: 'نیلوفر' });
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe('نیلوفر');
  });

  it('searches by email', () => {
    const result = filterCustomers(customers, { search: 'devon.lee@example.test' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('cust_287');
  });

  it('filters by segment', () => {
    const vip = filterCustomers(customers, { segment: 'vip' });
    expect(vip.every((c) => customerSegment(c) === 'vip')).toBe(true);
    const isNew = filterCustomers(customers, { segment: 'new' });
    expect(isNew.every((c) => customerSegment(c) === 'new')).toBe(true);
  });
});

describe('customer value helpers', () => {
  it('segments by lifetime value and order count', () => {
    // Priya: spent 1284.75 → VIP.
    expect(customerSegment(customers.find((c) => c.id === 'cust_142')!)).toBe('vip');
    // Maya: 7 orders, < threshold spend → repeat.
    expect(customerSegment(customers.find((c) => c.id === 'cust_310')!)).toBe('repeat');
    // Aiko: 1 order → new.
    expect(customerSegment(customers.find((c) => c.id === 'cust_409')!)).toBe('new');
  });

  it('derives average order value (and handles zero orders)', () => {
    const devon = customers.find((c) => c.id === 'cust_287')!; // 214.00 / 3
    expect(averageOrderValue(devon)).toBe('71.33');
    const noOrders = customers.find((c) => c.ordersCount === 0)!;
    expect(averageOrderValue(noOrders)).toBe('0.00');
  });

  it('maps segments to badge tones', () => {
    expect(segmentBadge('vip').tone).toBe('success');
    expect(segmentBadge('repeat').tone).toBe('info');
    expect(segmentBadge('new').tone).toBe('neutral');
  });
});
