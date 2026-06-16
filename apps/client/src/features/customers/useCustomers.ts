/**
 * Customer hooks (TanStack Query), site-aware.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useActiveSiteId } from '@/features/site/useSites';
import { customerService, queryKeys } from '@/services';
import type { Customer, CustomerListQuery, Paged } from '@/domain/types';

export function useCustomers(query?: CustomerListQuery): UseQueryResult<Paged<Customer>, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.customers(siteId ?? 'none', query),
    queryFn: () => customerService.listCustomers(query),
    enabled: Boolean(siteId),
  });
}

export function useCustomer(customerId: string): UseQueryResult<Customer, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.customer(siteId ?? 'none', customerId),
    queryFn: () => customerService.getCustomer(customerId),
    enabled: Boolean(siteId) && Boolean(customerId),
  });
}
