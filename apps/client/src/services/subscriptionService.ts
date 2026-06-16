/**
 * Subscription service — thin wrapper over the active BillingAdapter.
 *
 * Powers the pricing & plans module: plans, display-only pricing, the feature matrix, the
 * current (mock) subscription, and mock plan-change preview/request. Handles only
 * frontend-safe, display-only data; never payment methods, card data, provider secrets, or
 * real billing IDs (see security-model.md). Screens/hooks call this, never the adapter.
 */
import { getAdapters } from '@/adapters';
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

export interface SubscriptionOverview {
  plans: SubscriptionPlan[];
  pricing: PlanPricing[];
  features: PlanFeature[];
  current: CurrentSubscriptionSummary;
  providerStatus: BillingProviderStatus;
}

export const subscriptionService = {
  listPlans(): Promise<SubscriptionPlan[]> {
    return getAdapters().billing.listPlans();
  },
  getCurrentSubscription(): Promise<CurrentSubscriptionSummary> {
    return getAdapters().billing.getCurrentSubscription();
  },
  previewPlanChange(
    planId: SubscriptionPlanId,
    interval: BillingInterval,
  ): Promise<PlanChangePreview> {
    return getAdapters().billing.previewPlanChange(planId, interval);
  },
  requestPlanChangeMock(
    planId: SubscriptionPlanId,
    interval: BillingInterval,
  ): Promise<PlanChangeRequestResult> {
    return getAdapters().billing.requestPlanChangeMock(planId, interval);
  },
  /** Single fetch for everything the plans screen needs. */
  async getOverview(): Promise<SubscriptionOverview> {
    const billing = getAdapters().billing;
    const [plans, pricing, features, current, providerStatus] = await Promise.all([
      billing.listPlans(),
      billing.listPlanPricing(),
      billing.listPlanFeatures(),
      billing.getCurrentSubscription(),
      billing.getProviderStatus(),
    ]);
    return { plans, pricing, features, current, providerStatus };
  },
};
