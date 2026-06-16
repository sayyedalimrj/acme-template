/**
 * Pure helpers for the Customers module: filtering, value derivation, and segmentation.
 *
 * Free of React for easy unit-testing and reuse across list + detail. Segmentation is a
 * lightweight, deterministic derivation (VIP / repeat / new) — a foundation for richer,
 * marketing-ready segments later. The Customer model carries no phone/address (those live
 * on orders), so those are intentionally absent here.
 */
import type { BadgeTone } from '@/components/ui';
import type { Customer } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

/** Lifetime spend (in store currency) at/above which a customer is treated as VIP. */
export const VIP_SPEND_THRESHOLD = 1000;
/** Orders count at/above which a customer is treated as a repeat buyer. */
export const REPEAT_ORDER_THRESHOLD = 2;

export type CustomerSegment = 'vip' | 'repeat' | 'new';
export type SegmentFilter = 'all' | CustomerSegment;

export interface CustomerFilterCriteria {
  search?: string;
  segment?: SegmentFilter;
}

export interface BadgeSpec {
  tone: BadgeTone;
  labelKey: StringKey;
}

export function customerFullName(customer: Customer): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

/** Average order value as a decimal string (store-currency convention). */
export function averageOrderValue(customer: Customer): string {
  if (customer.ordersCount <= 0) {
    return '0.00';
  }
  const total = Number.parseFloat(customer.totalSpent);
  const safe = Number.isFinite(total) ? total : 0;
  return (safe / customer.ordersCount).toFixed(2);
}

/**
 * Mutually-exclusive segment with a clear priority: high lifetime value → VIP, otherwise
 * multiple orders → repeat, otherwise new.
 */
export function customerSegment(customer: Customer): CustomerSegment {
  if (Number.parseFloat(customer.totalSpent) >= VIP_SPEND_THRESHOLD) {
    return 'vip';
  }
  if (customer.ordersCount >= REPEAT_ORDER_THRESHOLD) {
    return 'repeat';
  }
  return 'new';
}

const SEGMENT_TONE: Record<CustomerSegment, BadgeTone> = {
  vip: 'success',
  repeat: 'info',
  new: 'neutral',
};

const SEGMENT_KEY: Record<CustomerSegment, StringKey> = {
  vip: 'customers.segment.vip',
  repeat: 'customers.segment.repeat',
  new: 'customers.segment.new',
};

export function segmentBadge(segment: CustomerSegment): BadgeSpec {
  return { tone: SEGMENT_TONE[segment], labelKey: SEGMENT_KEY[segment] };
}

/** Filter by free-text (name, email, username) and segment. */
export function filterCustomers(
  customers: Customer[],
  { search, segment = 'all' }: CustomerFilterCriteria = {},
): Customer[] {
  const query = search?.trim().toLowerCase() ?? '';
  return customers.filter((customer) => {
    if (query) {
      const haystack =
        `${customerFullName(customer)} ${customer.email} ${customer.username}`.toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    if (segment !== 'all' && customerSegment(customer) !== segment) {
      return false;
    }
    return true;
  });
}
