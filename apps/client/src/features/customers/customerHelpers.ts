/**
 * Pure helpers for the Customers module: filtering, value derivation, and segmentation.
 */
import type { BadgeTone } from '@/components/ui';
import type { Customer } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

/** Lifetime spend (in store currency) at/above which a customer is treated as valuable. */
export const VIP_SPEND_THRESHOLD = 1000;
/** Orders count at/above which a customer is treated as a repeat buyer. */
export const REPEAT_ORDER_THRESHOLD = 2;
/** Days since last order before a repeat buyer needs follow-up. */
export const NEEDS_FOLLOWUP_DAYS = 60;

export type CustomerSegment = 'valuable' | 'repeat' | 'new' | 'needs_followup';
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

function daysSince(iso?: string): number | undefined {
  if (!iso) return undefined;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return undefined;
  return ms / 86_400_000;
}

/**
 * Mutually-exclusive segment: valuable spend → valuable; inactive repeat buyers → needs follow-up;
 * otherwise repeat or new.
 */
export function customerSegment(customer: Customer): CustomerSegment {
  const spent = Number.parseFloat(customer.totalSpent);
  if (Number.isFinite(spent) && spent >= VIP_SPEND_THRESHOLD) {
    return 'valuable';
  }
  if (customer.ordersCount >= REPEAT_ORDER_THRESHOLD) {
    const since = daysSince(customer.lastOrderDate);
    if (since !== undefined && since > NEEDS_FOLLOWUP_DAYS) {
      return 'needs_followup';
    }
    return 'repeat';
  }
  return 'new';
}

const SEGMENT_TONE: Record<CustomerSegment, BadgeTone> = {
  valuable: 'success',
  repeat: 'info',
  new: 'neutral',
  needs_followup: 'warning',
};

const SEGMENT_KEY: Record<CustomerSegment, StringKey> = {
  valuable: 'customers.segment.valuable',
  repeat: 'customers.segment.repeat',
  new: 'customers.segment.new',
  needs_followup: 'customers.segment.needsFollowup',
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
        `${customerFullName(customer)} ${customer.email} ${customer.username} ${customer.phone ?? ''}`.toLowerCase();
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
