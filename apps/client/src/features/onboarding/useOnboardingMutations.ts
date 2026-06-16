/**
 * Onboarding mutation hooks (TanStack Query), mock-only.
 *
 * Create a Path A (existing-site) or Path B (new-store launch) request against the mock
 * OnboardingService. On success they invalidate the onboarding requests list so the index
 * screen reflects the new request immediately.
 *
 * SECURITY: inputs are frontend-safe only (no credentials). No real provisioning or store
 * connection happens here — that is a server-side concern handled in a later phase.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { onboardingService, queryKeys } from '@/services';
import type {
  ExistingOnboardingInput,
  ExistingSiteOnboardingRequest,
  NewLaunchInput,
  NewStoreLaunchRequest,
} from '@/domain/types';

function useInvalidateRequests(): () => Promise<void> {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.onboardingRequests() });
  };
}

export function useCreateExistingSiteRequest(): UseMutationResult<
  ExistingSiteOnboardingRequest,
  Error,
  ExistingOnboardingInput
> {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (input: ExistingOnboardingInput) =>
      onboardingService.createExistingSiteRequest(input),
    onSuccess: invalidate,
  });
}

export function useCreateStoreLaunchRequest(): UseMutationResult<
  NewStoreLaunchRequest,
  Error,
  NewLaunchInput
> {
  const invalidate = useInvalidateRequests();
  return useMutation({
    mutationFn: (input: NewLaunchInput) => onboardingService.createStoreLaunchRequest(input),
    onSuccess: invalidate,
  });
}
