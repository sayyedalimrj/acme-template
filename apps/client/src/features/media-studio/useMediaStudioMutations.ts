/**
 * Media Studio mutation hooks (TanStack Query), mock-only and in-memory.
 *
 * Analyze (simulated), generate (placeholder variants), and review/approve/dismiss variants.
 * SECURITY: no provider/API, no upload, nothing published or applied to products.
 */
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { mediaStudioService, queryKeys } from '@/services';
import type {
  MediaStudioAnalyzeInput,
  MediaStudioAsset,
  MediaStudioGenerationInput,
  MediaStudioGenerationRequest,
  MediaStudioOutputVariant,
} from '@/domain/types';

export function useAnalyzeSourceAsset(): UseMutationResult<
  MediaStudioAsset,
  Error,
  MediaStudioAnalyzeInput
> {
  return useMutation({
    mutationFn: (input: MediaStudioAnalyzeInput) =>
      mediaStudioService.analyzeSourceAssetMock(input),
  });
}

export function useCreateGeneration(
  productId: string,
): UseMutationResult<MediaStudioGenerationRequest, Error, MediaStudioGenerationInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MediaStudioGenerationInput) =>
      mediaStudioService.createGenerationMock(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.mediaStudioVariants(productId),
      });
    },
  });
}

function useVariantMutation(
  productId: string,
  fn: (id: string) => Promise<MediaStudioOutputVariant[]>,
): UseMutationResult<MediaStudioOutputVariant[], Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (all) => {
      queryClient.setQueryData(
        queryKeys.mediaStudioVariants(productId),
        all.filter((v) => v.productId === productId),
      );
    },
  });
}

export function useMarkVariantReviewed(
  productId: string,
): UseMutationResult<MediaStudioOutputVariant[], Error, string> {
  return useVariantMutation(productId, (id) => mediaStudioService.markVariantReviewed(id));
}

export function useApproveVariant(
  productId: string,
): UseMutationResult<MediaStudioOutputVariant[], Error, string> {
  return useVariantMutation(productId, (id) => mediaStudioService.approveVariantMock(id));
}

export function useDismissVariant(
  productId: string,
): UseMutationResult<MediaStudioOutputVariant[], Error, string> {
  return useVariantMutation(productId, (id) => mediaStudioService.dismissVariantMock(id));
}
