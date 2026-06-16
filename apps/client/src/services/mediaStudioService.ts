/**
 * AI Product Media Studio service — thin wrapper over the active MediaStudioAdapter.
 *
 * Powers the mock media workflow: provider status, prompts, simulated source analysis,
 * output variants, mock generation, promo-video concepts, and review-only variant actions.
 * Calls NO provider/API, uploads NO files, publishes/mutates NOTHING (see security-model.md).
 */
import { getAdapters } from '@/adapters';
import type {
  MediaStudioAnalyzeInput,
  MediaStudioAsset,
  MediaStudioGenerationInput,
  MediaStudioGenerationRequest,
  MediaStudioOutputVariant,
  MediaStudioProviderStatus,
  MediaStudioPromptSuggestion,
  MediaStudioSafetyNotice,
  MediaStudioVideoConcept,
} from '@/domain/types';

export interface MediaStudioInfo {
  providerStatus: MediaStudioProviderStatus;
  prompts: MediaStudioPromptSuggestion[];
  videoConcepts: MediaStudioVideoConcept[];
  safetyNotices: MediaStudioSafetyNotice[];
}

export const mediaStudioService = {
  getProviderStatus(): Promise<MediaStudioProviderStatus> {
    return getAdapters().mediaStudio.getProviderStatus();
  },
  analyzeSourceAssetMock(input: MediaStudioAnalyzeInput): Promise<MediaStudioAsset> {
    return getAdapters().mediaStudio.analyzeSourceAssetMock(input);
  },
  listOutputVariants(productId: string): Promise<MediaStudioOutputVariant[]> {
    return getAdapters().mediaStudio.listOutputVariants(productId);
  },
  createGenerationMock(input: MediaStudioGenerationInput): Promise<MediaStudioGenerationRequest> {
    return getAdapters().mediaStudio.createGenerationMock(input);
  },
  getGenerationRequest(id: string): Promise<MediaStudioGenerationRequest> {
    return getAdapters().mediaStudio.getGenerationRequest(id);
  },
  markVariantReviewed(id: string): Promise<MediaStudioOutputVariant[]> {
    return getAdapters().mediaStudio.markVariantReviewed(id);
  },
  approveVariantMock(id: string): Promise<MediaStudioOutputVariant[]> {
    return getAdapters().mediaStudio.approveVariantMock(id);
  },
  dismissVariantMock(id: string): Promise<MediaStudioOutputVariant[]> {
    return getAdapters().mediaStudio.dismissVariantMock(id);
  },
  /** Single fetch for the static parts of the studio screen. */
  async getInfo(): Promise<MediaStudioInfo> {
    const studio = getAdapters().mediaStudio;
    const [providerStatus, prompts, videoConcepts, safetyNotices] = await Promise.all([
      studio.getProviderStatus(),
      studio.listPromptSuggestions(),
      studio.listVideoConcepts(),
      studio.listSafetyNotices(),
    ]);
    return { providerStatus, prompts, videoConcepts, safetyNotices };
  },
};
