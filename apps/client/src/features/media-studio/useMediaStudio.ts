/**
 * Media Studio data hooks (TanStack Query).
 *
 * Account-level (mock), not site-scoped. Static info (provider/prompts/video/safety) and the
 * per-product output variants.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { mediaStudioService, queryKeys, type MediaStudioInfo } from '@/services';
import type { MediaStudioOutputVariant } from '@/domain/types';

export function useMediaStudioInfo(): UseQueryResult<MediaStudioInfo, Error> {
  return useQuery({
    queryKey: queryKeys.mediaStudioInfo(),
    queryFn: () => mediaStudioService.getInfo(),
  });
}

export function useMediaStudioVariants(
  productId: string,
): UseQueryResult<MediaStudioOutputVariant[], Error> {
  return useQuery({
    queryKey: queryKeys.mediaStudioVariants(productId),
    queryFn: () => mediaStudioService.listOutputVariants(productId),
    enabled: Boolean(productId),
  });
}
