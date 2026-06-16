/**
 * AI advisor data hooks (TanStack Query).
 *
 * The advisor is account-level (mock), so these queries are NOT site-scoped. The overview
 * (context + insights + prompts) is static; recommendations and the conversation are mutable.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { aiAdvisorService, queryKeys, type AdvisorOverview } from '@/services';
import type { AIAdvisorConversationMessage, AIAdvisorRecommendation } from '@/domain/types';

export function useAdvisorOverview(): UseQueryResult<AdvisorOverview, Error> {
  return useQuery({
    queryKey: queryKeys.advisorOverview(),
    queryFn: () => aiAdvisorService.getOverview(),
  });
}

export function useAdvisorRecommendations(): UseQueryResult<AIAdvisorRecommendation[], Error> {
  return useQuery({
    queryKey: queryKeys.advisorRecommendations(),
    queryFn: () => aiAdvisorService.listRecommendations(),
  });
}

export function useAdvisorConversation(): UseQueryResult<AIAdvisorConversationMessage[], Error> {
  return useQuery({
    queryKey: queryKeys.advisorConversation(),
    queryFn: () => aiAdvisorService.getConversation(),
  });
}
