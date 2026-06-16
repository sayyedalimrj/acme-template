import { describe, expect, it } from '@jest/globals';

import { orders } from '@/mock/data/orders';

import {
  filterFulfillmentQueue,
  fulfillmentPriority,
  needsFulfillment,
} from '@/features/fulfillment/fulfillmentHelpers';

describe('fulfillment helpers', () => {
  it('queues orders that are active and not fully fulfilled', () => {
    const queue = filterFulfillmentQueue(orders);
    expect(queue.length).toBeGreaterThan(0);
    expect(queue.every(needsFulfillment)).toBe(true);
    // Completed/refunded orders are excluded.
    expect(queue.every((o) => o.fulfillment !== 'fulfilled')).toBe(true);
    expect(queue.some((o) => o.status === 'cancelled' || o.status === 'refunded')).toBe(false);
  });

  it('prioritizes blocked (pending/on-hold) orders as high', () => {
    const pending = orders.find((o) => o.status === 'pending')!;
    const onHold = orders.find((o) => o.status === 'on-hold')!;
    expect(fulfillmentPriority(pending)).toBe('high');
    expect(fulfillmentPriority(onHold)).toBe('high');
  });

  it('excludes fully fulfilled orders', () => {
    const fulfilled = orders.find((o) => o.fulfillment === 'fulfilled')!;
    expect(needsFulfillment(fulfilled)).toBe(false);
  });
});
