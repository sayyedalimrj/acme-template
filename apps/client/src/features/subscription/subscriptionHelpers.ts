/**
 * Pure helpers for the subscription/pricing module: plan ranking, action state vs. the
 * current plan, feature-availability presentation, category ordering, and entitlement
 * derivation. React-free for easy unit testing.
 *
 * SECURITY: helpers only read frontend-safe, display-only data; none touch payment data.
 */
import type { BadgeTone } from '@/components/ui';
import type {
  BillingInterval,
  PlanEntitlement,
  PlanFeature,
  PlanFeatureAvailability,
  PlanFeatureCategory,
  PlanActionState,
  PlanPrice,
  PlanPricing,
  SubscriptionPlanId,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

export const BILLING_INTERVALS: BillingInterval[] = ['monthly', 'yearly'];

const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  starter: 1,
  growth: 2,
  pro: 3,
  managed: 4,
};

export function planRank(id: SubscriptionPlanId): number {
  return PLAN_RANK[id];
}

/** The action a plan card should offer relative to the current plan. */
export function planActionState(
  target: SubscriptionPlanId,
  current: SubscriptionPlanId,
): PlanActionState {
  if (target === current) return 'current';
  if (target === 'managed') return 'contact_support';
  return planRank(target) > planRank(current) ? 'upgrade' : 'downgrade';
}

export function planActionLabelKey(action: PlanActionState): StringKey {
  switch (action) {
    case 'current':
      return 'plans.action.current';
    case 'upgrade':
      return 'plans.action.upgrade';
    case 'downgrade':
      return 'plans.action.downgrade';
    case 'contact_support':
      return 'plans.action.contactSupport';
    case 'coming_soon':
    default:
      return 'plans.action.comingSoon';
  }
}

interface AvailabilityMeta {
  labelKey: StringKey;
  tone: BadgeTone;
}

const AVAILABILITY_META: Record<PlanFeatureAvailability, AvailabilityMeta> = {
  included: { labelKey: 'plans.avail.included', tone: 'success' },
  limited: { labelKey: 'plans.avail.limited', tone: 'info' },
  later: { labelKey: 'plans.avail.later', tone: 'warning' },
  none: { labelKey: 'plans.avail.none', tone: 'neutral' },
};

export function availabilityMeta(availability: PlanFeatureAvailability): AvailabilityMeta {
  return AVAILABILITY_META[availability];
}

export const FEATURE_CATEGORY_ORDER: PlanFeatureCategory[] = [
  'core',
  'operations',
  'growth',
  'managed',
  'support',
];

export function categoryLabelKey(category: PlanFeatureCategory): StringKey {
  switch (category) {
    case 'core':
      return 'plans.category.core';
    case 'operations':
      return 'plans.category.operations';
    case 'growth':
      return 'plans.category.growth';
    case 'managed':
      return 'plans.category.managed';
    case 'support':
    default:
      return 'plans.category.support';
  }
}

/** Features grouped by category, in canonical order. */
export function groupFeaturesByCategory(
  features: PlanFeature[],
): { category: PlanFeatureCategory; features: PlanFeature[] }[] {
  return FEATURE_CATEGORY_ORDER.map((category) => ({
    category,
    features: features.filter((f) => f.category === category),
  })).filter((group) => group.features.length > 0);
}

/** What a single plan actually includes (drops `none`), for "what's included" displays. */
export function entitlementsForPlan(
  features: PlanFeature[],
  planId: SubscriptionPlanId,
): PlanEntitlement[] {
  return features
    .map((f) => ({ featureId: f.id, label: f.label, availability: f.availability[planId] }))
    .filter((e) => e.availability !== 'none');
}

export function priceForInterval(pricing: PlanPricing, interval: BillingInterval): PlanPrice {
  return interval === 'monthly' ? pricing.monthly : pricing.yearly;
}

export function findPricing(
  all: PlanPricing[],
  planId: SubscriptionPlanId,
): PlanPricing | undefined {
  return all.find((p) => p.planId === planId);
}
