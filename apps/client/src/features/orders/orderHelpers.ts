/**
 * Pure helpers for the Orders module: filtering, badge presentation, and operational flags.
 *
 * Free of React for easy unit-testing and reuse across list + detail. WooCommerce models
 * order lifecycle in `status` (payment + handling) and operational state in `fulfillment`;
 * the "payment" badge here is derived from `status` for at-a-glance payment visibility.
 */
import type { BadgeTone } from '@/components/ui';
import type { FulfillmentStatus, Order, OrderStatus } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

export type OrderStatusFilter = 'all' | OrderStatus;
export type FulfillmentFilter = 'all' | FulfillmentStatus;

export interface OrderFilterCriteria {
  search?: string;
  status?: OrderStatusFilter;
  fulfillment?: FulfillmentFilter;
}

export interface BadgeSpec {
  tone: BadgeTone;
  labelKey: StringKey;
}

function customerName(order: Order): string {
  return `${order.billing.firstName} ${order.billing.lastName}`.trim();
}

/** Filter by free-text (order number, customer name, email), status, and fulfillment. */
export function filterOrders(
  orders: Order[],
  { search, status = 'all', fulfillment = 'all' }: OrderFilterCriteria = {},
): Order[] {
  const query = search?.trim().toLowerCase() ?? '';
  return orders.filter((order) => {
    if (query) {
      const haystack =
        `${order.number} ${customerName(order)} ${order.billing.email}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    if (status !== 'all' && order.status !== status) {
      return false;
    }
    if (fulfillment !== 'all' && order.fulfillment !== fulfillment) {
      return false;
    }
    return true;
  });
}

const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  processing: 'info',
  'on-hold': 'neutral',
  completed: 'success',
  cancelled: 'neutral',
  refunded: 'danger',
  failed: 'danger',
};

const ORDER_STATUS_KEY: Record<OrderStatus, StringKey> = {
  pending: 'orders.status.pending',
  processing: 'orders.status.processing',
  'on-hold': 'orders.status.on-hold',
  completed: 'orders.status.completed',
  cancelled: 'orders.status.cancelled',
  refunded: 'orders.status.refunded',
  failed: 'orders.status.failed',
};

export function orderStatusBadge(status: OrderStatus): BadgeSpec {
  return { tone: ORDER_STATUS_TONE[status], labelKey: ORDER_STATUS_KEY[status] };
}

/** Payment badge derived from order status (no separate payment field in the model). */
export function paymentBadge(status: OrderStatus): BadgeSpec {
  switch (status) {
    case 'processing':
    case 'completed':
      return { tone: 'success', labelKey: 'orders.payment.paid' };
    case 'pending':
    case 'on-hold':
      return { tone: 'warning', labelKey: 'orders.payment.pending' };
    case 'refunded':
      return { tone: 'danger', labelKey: 'orders.payment.refunded' };
    case 'failed':
      return { tone: 'danger', labelKey: 'orders.payment.failed' };
    case 'cancelled':
    default:
      return { tone: 'neutral', labelKey: 'orders.payment.cancelled' };
  }
}

const FULFILLMENT_TONE: Record<FulfillmentStatus, BadgeTone> = {
  unfulfilled: 'warning',
  partial: 'info',
  fulfilled: 'success',
};

const FULFILLMENT_KEY: Record<FulfillmentStatus, StringKey> = {
  unfulfilled: 'orders.fulfillment.unfulfilled',
  partial: 'orders.fulfillment.partial',
  fulfilled: 'orders.fulfillment.fulfilled',
};

export function fulfillmentBadge(status: FulfillmentStatus): BadgeSpec {
  return { tone: FULFILLMENT_TONE[status], labelKey: FULFILLMENT_KEY[status] };
}

/**
 * Whether an order needs operator attention: awaiting payment/hold, or paid-but-unfulfilled.
 */
export function needsAttention(order: Order): boolean {
  if (order.status === 'pending' || order.status === 'on-hold') {
    return true;
  }
  return order.status === 'processing' && order.fulfillment !== 'fulfilled';
}

export function orderItemCount(order: Order): number {
  return order.lineItems.reduce((sum, item) => sum + item.quantity, 0);
}
