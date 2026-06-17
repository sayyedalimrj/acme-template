/**
 * Automation data hooks (TanStack Query). Account-level (mock), not site-scoped.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { notificationAutomationService, queryKeys, type AutomationOverview } from '@/services';
import type { CampaignDraft } from '@/domain/types';

export function useAutomationOverview(): UseQueryResult<AutomationOverview, Error> {
  return useQuery({
    queryKey: queryKeys.automationOverview(),
    queryFn: () => notificationAutomationService.getOverview(),
  });
}

export function useCampaignDrafts(): UseQueryResult<CampaignDraft[], Error> {
  return useQuery({
    queryKey: queryKeys.automationDrafts(),
    queryFn: () => notificationAutomationService.listCampaignDrafts(),
  });
}
