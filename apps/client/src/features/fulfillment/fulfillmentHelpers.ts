/**
 * Pure helpers for the Fulfillment workflow: which orders still need processing/shipping,
 * their priority, and ordering. Free of React for easy unit-testing. Reuses the Orders
 * module's fulfillment model.
 */
import type { Order } from '@/domain/types';

export type FulfillmentPriority = 'high' | 'medium' | 'low';

/** Statuses where no further fulfillment action is expected. */
const TERMINAL_STATUSES: readonly Order['status'][] = ['cancelled', 'refunded', 'failed'];

/** An order needs fulfillment when it is still active and not fully fulfilled. */
export function needsFulfillment(order: Order): boolean {
  return !TERMINAL_STATUSES.includes(order.status) && order.fulfillment !== 'fulfilled';
}

/**
 * Awaiting payment/hold = high (blocked), unfulfilled-but-paid = medium, partial = low.
 */
export function fulfillmentPriority(order: Order): FulfillmentPriority {
  if (order.status === 'pending' || order.status === 'on-hold') {
    return 'high';
  }
  if (order.fulfillment === 'partial') {
    return 'low';
  }
  return 'medium';
}

const PRIORITY_RANK: Record<FulfillmentPriority, number> = { high: 0, medium: 1, low: 2 };

export function fulfillmentPriorityTint(
  priority: FulfillmentPriority,
): 'danger' | 'warning' | 'info' {
  if (priority === 'high') return 'danger';
  if (priority === 'medium') return 'warning';
  return 'info';
}

/** Orders needing fulfillment, sorted by priority then most recent first. */
export function filterFulfillmentQueue(orders: Order[]): Order[] {
  return orders.filter(needsFulfillment).sort((a, b) => {
    const byPriority =
      PRIORITY_RANK[fulfillmentPriority(a)] - PRIORITY_RANK[fulfillmentPriority(b)];
    if (byPriority !== 0) return byPriority;
    return b.dateCreated.localeCompare(a.dateCreated);
  });
}
