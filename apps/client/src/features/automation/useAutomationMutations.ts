/**
 * Automation mutation hooks (TanStack Query), mock-only and in-memory.
 *
 * Create a back-in-stock draft and review/approve/dismiss drafts. SECURITY: nothing is sent;
 * approve is a mock review state only. Each writes the returned drafts into the cache.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { notificationAutomationService, queryKeys } from '@/services';
import type { CampaignDraft } from '@/domain/types';

export function useCreateBackInStockDraft(): UseMutationResult<CampaignDraft, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) =>
      notificationAutomationService.createBackInStockDraftMock(productId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.automationDrafts() });
    },
  });
}

function useDraftMutation(
  fn: (id: string) => Promise<CampaignDraft[]>,
): UseMutationResult<CampaignDraft[], Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (drafts) => {
      queryClient.setQueryData(queryKeys.automationDrafts(), drafts);
    },
  });
}

export function useMarkDraftReviewed(): UseMutationResult<CampaignDraft[], Error, string> {
  return useDraftMutation((id) => notificationAutomationService.markDraftReviewed(id));
}

export function useApproveDraft(): UseMutationResult<CampaignDraft[], Error, string> {
  return useDraftMutation((id) => notificationAutomationService.approveDraftMock(id));
}

export function useDismissDraft(): UseMutationResult<CampaignDraft[], Error, string> {
  return useDraftMutation((id) => notificationAutomationService.dismissDraftMock(id));
}
