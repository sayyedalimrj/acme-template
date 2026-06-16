/**
 * Product hooks (TanStack Query), site-aware.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { useActiveSiteId } from '@/features/site/useSites';
import { productService, queryKeys } from '@/services';
import type { Paged, Product, ProductListQuery } from '@/domain/types';

export function useProducts(query?: ProductListQuery): UseQueryResult<Paged<Product>, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.products(siteId ?? 'none', query),
    queryFn: () => productService.listProducts(query),
    enabled: Boolean(siteId),
  });
}

export function useProduct(productId: string): UseQueryResult<Product, Error> {
  const siteId = useActiveSiteId();
  return useQuery({
    queryKey: queryKeys.product(siteId ?? 'none', productId),
    queryFn: () => productService.getProduct(productId),
    enabled: Boolean(siteId) && Boolean(productId),
  });
}
