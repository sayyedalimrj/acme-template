import { describe, expect, it } from '@jest/globals';

import { orders } from '@/mock/data/orders';

import {
  filterOrders,
  fulfillmentBadge,
  needsAttention,
  orderItemCount,
  orderStatusBadge,
  paymentBadge,
} from '@/features/orders/orderHelpers';

describe('filterOrders', () => {
  it('searches by order number', () => {
    const result = filterOrders(orders, { search: '5820' });
    expect(result).toHaveLength(1);
    expect(result[0].number).toBe('5820');
  });

  it('searches by customer name and email', () => {
    expect(filterOrders(orders, { search: 'priya' }).length).toBeGreaterThan(0);
    expect(filterOrders(orders, { search: 'maya.brennan@example.test' })).toHaveLength(1);
  });

  it('filters by order status', () => {
    const result = filterOrders(orders, { status: 'processing' });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((o) => o.status === 'processing')).toBe(true);
  });

  it('filters by fulfillment status', () => {
    const result = filterOrders(orders, { fulfillment: 'fulfilled' });
    expect(result.every((o) => o.fulfillment === 'fulfilled')).toBe(true);
  });
});

describe('order badges and flags', () => {
  it('maps order status to tones', () => {
    expect(orderStatusBadge('completed').tone).toBe('success');
    expect(orderStatusBadge('refunded').tone).toBe('danger');
    expect(orderStatusBadge('processing').tone).toBe('info');
  });

  it('derives payment badge from status', () => {
    expect(paymentBadge('completed').labelKey).toBe('orders.payment.paid');
    expect(paymentBadge('pending').labelKey).toBe('orders.payment.pending');
    expect(paymentBadge('failed').tone).toBe('danger');
  });

  it('maps fulfillment to tones', () => {
    expect(fulfillmentBadge('fulfilled').tone).toBe('success');
    expect(fulfillmentBadge('unfulfilled').tone).toBe('warning');
  });

  it('flags orders needing attention', () => {
    const pending = orders.find((o) => o.status === 'pending')!;
    expect(needsAttention(pending)).toBe(true);
    const completed = orders.find((o) => o.status === 'completed')!;
    expect(needsAttention(completed)).toBe(false);
  });

  it('counts line item quantities', () => {
    const multi = orders.find((o) => o.lineItems.length > 1)!;
    const expected = multi.lineItems.reduce((s, i) => s + i.quantity, 0);
    expect(orderItemCount(multi)).toBe(expected);
  });
});
