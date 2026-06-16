/**
 * Onboarding data hooks (TanStack Query).
 *
 * Onboarding is account-level (pre-/cross-site), so these queries are NOT site-scoped. They
 * back the template catalog, plan placeholders, and the request list/detail.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { onboardingService, queryKeys } from '@/services';
import type { OnboardingRequest, StoreTemplate, SubscriptionPlan } from '@/domain/types';

export function useStoreTemplates(): UseQueryResult<StoreTemplate[], Error> {
  return useQuery({
    queryKey: queryKeys.onboardingTemplates(),
    queryFn: () => onboardingService.listTemplates(),
  });
}

export function useSubscriptionPlans(): UseQueryResult<SubscriptionPlan[], Error> {
  return useQuery({
    queryKey: queryKeys.onboardingPlans(),
    queryFn: () => onboardingService.listPlans(),
  });
}

export function useOnboardingRequests(): UseQueryResult<OnboardingRequest[], Error> {
  return useQuery({
    queryKey: queryKeys.onboardingRequests(),
    queryFn: () => onboardingService.listRequests(),
  });
}

export function useOnboardingRequest(id: string): UseQueryResult<OnboardingRequest, Error> {
  return useQuery({
    queryKey: queryKeys.onboardingRequest(id),
    queryFn: () => onboardingService.getRequest(id),
    enabled: Boolean(id),
  });
}
