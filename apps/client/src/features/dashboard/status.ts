/**
 * Maps WooCommerce order statuses to a Badge tone and a human label. Centralized so order
 * status presentation stays consistent across the dashboard and (later) the orders module.
 */
import type { BadgeTone } from '@/components/ui';
import type { OrderStatus } from '@/domain/types';

const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  processing: 'info',
  'on-hold': 'neutral',
  completed: 'success',
  cancelled: 'neutral',
  refunded: 'danger',
  failed: 'danger',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  'on-hold': 'On hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  failed: 'Failed',
};

export function orderStatusTone(status: OrderStatus): BadgeTone {
  return STATUS_TONE[status];
}

export function orderStatusLabel(status: OrderStatus): string {
  return STATUS_LABEL[status];
}
