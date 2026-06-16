/**
 * Customer Intelligence mutation hooks (TanStack Query), mock-only and in-memory.
 *
 * Record a mock event (dev panel) and review/dismiss recommendations. SECURITY: no real
 * tracking, no external send; everything stays in memory.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { customerIntelligenceService, queryKeys } from '@/services';
import type { CommerceEvent, IntelligenceRecommendation, RecordEventInput } from '@/domain/types';

export function useRecordEvent(): UseMutationResult<CommerceEvent[], Error, RecordEventInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordEventInput) => customerIntelligenceService.recordEventMock(input),
    onSuccess: (events) => {
      queryClient.setQueryData(queryKeys.intelligenceEvents(), events);
      // Summary depends on the event stream — refresh the overview.
      void queryClient.invalidateQueries({ queryKey: queryKeys.intelligenceOverview() });
    },
  });
}

function useRecMutation(
  fn: (id: string) => Promise<IntelligenceRecommendation[]>,
): UseMutationResult<IntelligenceRecommendation[], Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (recs) => {
      queryClient.setQueryData(queryKeys.intelligenceRecommendations(), recs);
    },
  });
}

export function useMarkRecommendationReviewed(): UseMutationResult<
  IntelligenceRecommendation[],
  Error,
  string
> {
  return useRecMutation((id) => customerIntelligenceService.markRecommendationReviewed(id));
}

export function useDismissRecommendation(): UseMutationResult<
  IntelligenceRecommendation[],
  Error,
  string
> {
  return useRecMutation((id) => customerIntelligenceService.dismissRecommendationMock(id));
}
