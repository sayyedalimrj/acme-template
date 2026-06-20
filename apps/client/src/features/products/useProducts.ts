/**
 * Product hooks (TanStack Query), site-aware.
 */
import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';

import { useActiveSiteId } from '@/features/site/useSites';
import { productService, queryKeys } from '@/services';
import type {
  Paged,
  Product,
  ProductCreateInput,
  ProductListQuery,
  ProductUpdateInput,
} from '@/domain/types';

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

/**
 * Update a product (name/price/stock/status/categories). On success invalidates the active site's
 * product detail + list so the UI reloads the real (re-synced) data; scoped to the active site.
 */
export function useUpdateProduct(
  productId: string,
): UseMutationResult<Product, Error, ProductUpdateInput> {
  const siteId = useActiveSiteId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductUpdateInput) => productService.updateProduct(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.product(siteId ?? 'none', productId) });
      queryClient.invalidateQueries({ queryKey: ['site', siteId ?? 'none', 'products'] });
    },
  });
}

/**
 * Create a simple product. On success it invalidates the active site's product list so the new
 * product appears immediately. Returns the created product with its REAL status (publish/draft).
 */
export function useCreateProduct(): UseMutationResult<Product, Error, ProductCreateInput> {
  const siteId = useActiveSiteId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductCreateInput) => productService.createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId ?? 'none', 'products'] });
    },
  });
}
