/**
 * AI advisor mutation hooks (TanStack Query), mock-only and in-memory.
 *
 * Sending a message appends a user message + a DETERMINISTIC mock reply (no AI/API).
 * Reviewing/dismissing a recommendation updates only the in-memory copy. Each writes the
 * returned data straight into the query cache.
 *
 * SECURITY: nothing is published, no store data is mutated, and no customer message is sent.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { aiAdvisorService, queryKeys } from '@/services';
import type { AIAdvisorConversationMessage, AIAdvisorRecommendation } from '@/domain/types';

export function useSendAdvisorMessage(): UseMutationResult<
  AIAdvisorConversationMessage[],
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => aiAdvisorService.sendAdvisorMessageMock(message),
    onSuccess: (conversation) => {
      queryClient.setQueryData(queryKeys.advisorConversation(), conversation);
    },
  });
}

function useRecommendationMutation(
  fn: (id: string) => Promise<AIAdvisorRecommendation[]>,
): UseMutationResult<AIAdvisorRecommendation[], Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (recommendations) => {
      queryClient.setQueryData(queryKeys.advisorRecommendations(), recommendations);
    },
  });
}

export function useMarkRecommendationReviewed(): UseMutationResult<
  AIAdvisorRecommendation[],
  Error,
  string
> {
  return useRecommendationMutation((id) => aiAdvisorService.markRecommendationReviewed(id));
}

export function useDismissRecommendation(): UseMutationResult<
  AIAdvisorRecommendation[],
  Error,
  string
> {
  return useRecommendationMutation((id) => aiAdvisorService.dismissRecommendationMock(id));
}
