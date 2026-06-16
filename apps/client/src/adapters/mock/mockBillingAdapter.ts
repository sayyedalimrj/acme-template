/**
 * Mock Billing/subscription adapter.
 *
 * Serves the plans, display-only pricing, feature matrix, and the (mock) current
 * subscription, and previews/acknowledges plan changes WITHOUT any real charge.
 *
 * SECURITY (binding): everything here is frontend-safe and display-only. No payment method,
 * no card data, no provider secrets, no real billing IDs, no real charge or subscription
 * mutation. `requestPlanChangeMock` is a no-op acknowledgement. Real billing is a future
 * backend + provider concern, gated on a security review (see security-model.md).
 */
import { subscriptionPlans } from '@/mock/data/onboardingCatalog';
import {
  billingProviderStatus,
  currentSubscription,
  planFeatures,
  planPricing,
} from '@/mock/data/subscriptionBilling';
import type {
  BillingInterval,
  BillingProviderStatus,
  CurrentSubscriptionSummary,
  PlanChangePreview,
  PlanChangeRequestResult,
  PlanFeature,
  PlanPricing,
  SubscriptionPlan,
  SubscriptionPlanId,
} from '@/domain/types';
import {
  findPricing,
  planActionState,
  priceForInterval,
} from '@/features/subscription/subscriptionHelpers';

import type { BillingAdapter } from '../types';
import { clone, delay } from './mockUtils';

function priceLabel(planId: SubscriptionPlanId, interval: BillingInterval): string {
  const pricing = findPricing(planPricing, planId);
  if (!pricing) return '';
  const price = priceForInterval(pricing, interval);
  return `${price.amountLabel} / ${price.periodLabel}`;
}

export function createMockBillingAdapter(): BillingAdapter {
  return {
    async listPlans(): Promise<SubscriptionPlan[]> {
      await delay(140);
      return clone(subscriptionPlans);
    },

    async listPlanPricing(): Promise<PlanPricing[]> {
      await delay(140);
      return clone(planPricing);
    },

    async listPlanFeatures(): Promise<PlanFeature[]> {
      await delay(160);
      return clone(planFeatures);
    },

    async getCurrentSubscription(): Promise<CurrentSubscriptionSummary> {
      await delay(140);
      return clone(currentSubscription);
    },

    async getProviderStatus(): Promise<BillingProviderStatus> {
      await delay(80);
      return billingProviderStatus;
    },

    async previewPlanChange(
      planId: SubscriptionPlanId,
      interval: BillingInterval,
    ): Promise<PlanChangePreview> {
      await delay(160);
      const action = planActionState(planId, currentSubscription.planId);
      return {
        fromPlanId: currentSubscription.planId,
        toPlanId: planId,
        interval,
        action,
        priceLabel: priceLabel(planId, interval),
        note: 'پیش‌نمایش نمونه است؛ هیچ پرداخت یا تغییر واقعی انجام نمی‌شود.',
      };
    },

    async requestPlanChangeMock(
      planId: SubscriptionPlanId,
      interval: BillingInterval,
    ): Promise<PlanChangeRequestResult> {
      await delay(200);
      // Mock no-op: acknowledge only. No charge, no backend, no state change.
      return {
        acknowledged: true,
        toPlanId: planId,
        interval,
        message: 'درخواست شما ثبت شد (نمونه). صورت‌حساب واقعی بعداً فعال می‌شود.',
      };
    },
  };
}
