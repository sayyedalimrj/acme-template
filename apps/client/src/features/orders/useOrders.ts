/**
 * Order hooks (TanStack Query), site-aware.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useActiveSiteId } from '@/features/site/useSites';
import { orderService, queryKeys } from '@/services';
import type { Order, OrderListQuery, Paged } from '@/domain/types';

export function useOrders(query?: OrderListQuery): UseQueryResult<Paged<Order>, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.orders(siteId ?? 'none', query),
    queryFn: () => orderService.listOrders(query),
    enabled: Boolean(siteId),
  });
}

export function useOrder(orderId: string): UseQueryResult<Order, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.order(siteId ?? 'none', orderId),
    queryFn: () => orderService.getOrder(orderId),
    enabled: Boolean(siteId) && Boolean(orderId),
  });
}
