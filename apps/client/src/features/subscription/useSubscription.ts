/**
 * Subscription data hook (TanStack Query).
 *
 * Subscription/billing is account-level (mock), so this query is NOT site-scoped. It backs
 * the plans screen with a single fetch (plans + pricing + features + current + provider).
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { queryKeys, subscriptionService, type SubscriptionOverview } from '@/services';

export function useSubscriptionOverview(): UseQueryResult<SubscriptionOverview, Error> {
  return useQuery({
    queryKey: queryKeys.subscriptionOverview(),
    queryFn: () => subscriptionService.getOverview(),
  });
}
