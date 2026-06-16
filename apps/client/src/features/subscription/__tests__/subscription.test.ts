import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { subscriptionService } from '@/services';

const FORBIDDEN_BILLING_KEYS = [
  'card',
  'cardNumber',
  'cvv',
  'cvc',
  'paymentMethod',
  'stripeId',
  'stripeCustomerId',
  'secretKey',
  'apiKey',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('subscription service (mock)', () => {
  it('returns the four platform plans', async () => {
    const plans = await subscriptionService.listPlans();
    expect(plans.map((p) => p.id)).toEqual(['starter', 'growth', 'pro', 'managed']);
  });

  it('returns a complete, frontend-safe overview', async () => {
    const overview = await subscriptionService.getOverview();
    expect(overview.plans).toHaveLength(4);
    expect(overview.pricing).toHaveLength(4);
    expect(overview.features.length).toBeGreaterThan(0);
    expect(overview.current.planId).toBeDefined();
    expect(overview.providerStatus).toBe('not_connected');

    // No payment/billing-secret fields anywhere in the overview.
    const json = JSON.stringify(overview);
    FORBIDDEN_BILLING_KEYS.forEach((k) => expect(json).not.toContain(k));
  });

  it('returns the current subscription summary without billing IDs', async () => {
    const current = await subscriptionService.getCurrentSubscription();
    expect(current.planName).toBeTruthy();
    expect(['monthly', 'yearly']).toContain(current.interval);
    const keys = Object.keys(current);
    FORBIDDEN_BILLING_KEYS.forEach((k) => expect(keys).not.toContain(k));
  });

  it('previews a plan change without any real charge', async () => {
    const preview = await subscriptionService.previewPlanChange('pro', 'yearly');
    expect(preview.toPlanId).toBe('pro');
    expect(preview.interval).toBe('yearly');
    expect(['upgrade', 'downgrade', 'current', 'contact_support']).toContain(preview.action);
  });

  it('acknowledges a mock plan-change request (no backend, no charge)', async () => {
    const result = await subscriptionService.requestPlanChangeMock('pro', 'monthly');
    expect(result.acknowledged).toBe(true);
    expect(result.toPlanId).toBe('pro');
  });
});
