/**
 * Customer Intelligence data hooks (TanStack Query). Account-level (mock), not site-scoped.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { customerIntelligenceService, queryKeys, type IntelligenceOverview } from '@/services';
import type { CommerceEvent, IntelligenceRecommendation } from '@/domain/types';

export function useIntelligenceOverview(): UseQueryResult<IntelligenceOverview, Error> {
  return useQuery({
    queryKey: queryKeys.intelligenceOverview(),
    queryFn: () => customerIntelligenceService.getOverview(),
  });
}

export function useIntelligenceRecommendations(): UseQueryResult<
  IntelligenceRecommendation[],
  Error
> {
  return useQuery({
    queryKey: queryKeys.intelligenceRecommendations(),
    queryFn: () => customerIntelligenceService.listRecommendations(),
  });
}

export function useIntelligenceEvents(): UseQueryResult<CommerceEvent[], Error> {
  return useQuery({
    queryKey: queryKeys.intelligenceEvents(),
    queryFn: () => customerIntelligenceService.listEvents(),
  });
}
