/**
 * Onboarding service — thin wrapper over the active OnboardingAdapter.
 *
 * Powers the "two front doors" onboarding platform: the template catalog + plan placeholders,
 * the request list/detail, and request creation for both paths. Handles only frontend-safe
 * data; never credentials (see security-model.md). Screens/hooks call this, never the adapter.
 */
import { getAdapters } from '@/adapters';
import type {
  ExistingOnboardingInput,
  ExistingSiteOnboardingRequest,
  NewLaunchInput,
  NewStoreLaunchRequest,
  OnboardingRequest,
  StoreTemplate,
  SubscriptionPlan,
} from '@/domain/types';

export const onboardingService = {
  listTemplates(): Promise<StoreTemplate[]> {
    return getAdapters().onboarding.listTemplates();
  },
  listPlans(): Promise<SubscriptionPlan[]> {
    return getAdapters().onboarding.listPlans();
  },
  listRequests(): Promise<OnboardingRequest[]> {
    return getAdapters().onboarding.listRequests();
  },
  getRequest(id: string): Promise<OnboardingRequest> {
    return getAdapters().onboarding.getRequest(id);
  },
  createExistingSiteRequest(
    input: ExistingOnboardingInput,
  ): Promise<ExistingSiteOnboardingRequest> {
    return getAdapters().onboarding.createExistingSiteRequest(input);
  },
  createStoreLaunchRequest(input: NewLaunchInput): Promise<NewStoreLaunchRequest> {
    return getAdapters().onboarding.createStoreLaunchRequest(input);
  },
};
