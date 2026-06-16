import { describe, expect, it } from '@jest/globals';

import { planFeatures, planPricing } from '@/mock/data/subscriptionBilling';
import {
  availabilityMeta,
  entitlementsForPlan,
  findPricing,
  groupFeaturesByCategory,
  planActionState,
  planRank,
  priceForInterval,
} from '@/features/subscription/subscriptionHelpers';

describe('subscription helpers', () => {
  it('ranks plans starter < growth < pro < managed', () => {
    expect(planRank('starter')).toBeLessThan(planRank('growth'));
    expect(planRank('growth')).toBeLessThan(planRank('pro'));
    expect(planRank('pro')).toBeLessThan(planRank('managed'));
  });

  it('derives the plan action relative to the current plan', () => {
    expect(planActionState('growth', 'growth')).toBe('current');
    expect(planActionState('pro', 'growth')).toBe('upgrade');
    expect(planActionState('starter', 'growth')).toBe('downgrade');
    expect(planActionState('managed', 'growth')).toBe('contact_support');
  });

  it('maps feature availability to a label key and tone', () => {
    expect(availabilityMeta('included').tone).toBe('success');
    expect(availabilityMeta('later').labelKey).toBe('plans.avail.later');
  });

  it('groups features by category in canonical order', () => {
    const groups = groupFeaturesByCategory(planFeatures);
    expect(groups[0].category).toBe('core');
    expect(groups.map((g) => g.category)).toContain('managed');
  });

  it('derives a plan entitlement list excluding not-included features', () => {
    const starter = entitlementsForPlan(planFeatures, 'starter');
    expect(starter.every((e) => e.availability !== 'none')).toBe(true);
    expect(starter.some((e) => e.featureId === 'feat_dashboard')).toBe(true);
    // Managed has strictly more entitlements than starter.
    expect(entitlementsForPlan(planFeatures, 'managed').length).toBeGreaterThan(starter.length);
  });

  it('reads display-only price for an interval', () => {
    const growth = findPricing(planPricing, 'growth')!;
    expect(priceForInterval(growth, 'monthly').amountLabel).toContain('۴۹۰');
    expect(priceForInterval(growth, 'yearly').periodLabel).toBe('سالانه');
  });
});
