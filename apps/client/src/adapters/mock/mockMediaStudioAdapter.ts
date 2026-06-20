/**
 * Mock AI Product Media Studio adapter.
 *
 * Analyzes a SIMULATED source image (preset-driven), lists/creates placeholder output
 * variants, and serves promo-video concepts + safety notices. Variant review/approve/dismiss
 * and generation mutate only the in-memory copy.
 *
 * SECURITY (binding): NO media/AI provider, NO external API, NO file upload/storage, NO
 * provider keys/tokens/secrets. Nothing is generated for real, no product image is sent
 * anywhere, and NOTHING is published or applied to products. "Repair" is a suggested
 * improvement only — never a guaranteed restoration. See security-model.md.
 */
import { productById } from '@/mock/data/catalog';
import {
  mediaPromptSuggestions,
  mediaProviderStatus,
  mediaSafetyNotices,
  mediaVideoConcepts,
  seedOutputVariants,
} from '@/mock/data/mediaStudio';
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
import { analyzePreset, buildVariants } from '@/features/media-studio/mediaStudioHelpers';

import type { MediaStudioAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockMediaStudioAdapter(): MediaStudioAdapter {
  let variants: MediaStudioOutputVariant[] = clone(seedOutputVariants);
  const generations = new Map<string, MediaStudioGenerationRequest>();
  let seq = 1;

  const updateStatus = (id: string, status: MediaStudioOutputVariant['status']) => {
    variants = variants.map((v) => (v.id === id ? { ...v, status } : v));
    return clone(variants);
  };

  return {
    async getProviderStatus(): Promise<MediaStudioProviderStatus> {
      await delay(80);
      return mediaProviderStatus;
    },

    async listPromptSuggestions(): Promise<MediaStudioPromptSuggestion[]> {
      await delay(100);
      return clone(mediaPromptSuggestions);
    },

    async listVideoConcepts(): Promise<MediaStudioVideoConcept[]> {
      await delay(140);
      return clone(mediaVideoConcepts);
    },

    async listSafetyNotices(): Promise<MediaStudioSafetyNotice[]> {
      await delay(80);
      return clone(mediaSafetyNotices);
    },

    async analyzeSourceAssetMock(input: MediaStudioAnalyzeInput): Promise<MediaStudioAsset> {
      await delay(240);
      const analysis = analyzePreset(input.preset);
      const product = productById(input.productId);
      return {
        id: `asset_${input.productId}_${input.preset}`,
        productId: input.productId,
        preset: input.preset,
        label: `تصویر «${product.name}»`,
        quality: analysis.quality,
        qualityScore: analysis.score,
        issues: analysis.issues,
        recommendedFixes: analysis.recommendedFixes,
        note: analysis.note,
      };
    },

    async listOutputVariants(productId: string): Promise<MediaStudioOutputVariant[]> {
      await delay(150);
      return clone(variants.filter((v) => v.productId === productId));
    },

    async createGenerationMock(
      input: MediaStudioGenerationInput,
    ): Promise<MediaStudioGenerationRequest> {
      await delay(300);
      const product = productById(input.productId);
      const idPrefix = `gen_${seq++}`;
      const created = buildVariants(input.taskType, input.productId, product.name, idPrefix);
      variants = [...created, ...variants];
      const request: MediaStudioGenerationRequest = {
        id: idPrefix,
        productId: input.productId,
        taskType: input.taskType,
        preset: input.preset,
        promptText: input.promptText,
        status: 'mock_completed',
        createdAt: new Date().toISOString(),
        variants: clone(created),
      };
      generations.set(request.id, request);
      return clone(request);
    },

    async getGenerationRequest(id: string): Promise<MediaStudioGenerationRequest> {
      await delay(120);
      const found = generations.get(id);
      if (!found) {
        throw new Error(`Media generation request not found: ${id}`);
      }
      return clone(found);
    },

    async markVariantReviewed(id: string): Promise<MediaStudioOutputVariant[]> {
      await delay(130);
      return updateStatus(id, 'reviewed');
    },

    async approveVariantMock(id: string): Promise<MediaStudioOutputVariant[]> {
      await delay(130);
      // Mock-only: marks the variant approved for review purposes; nothing is published.
      return updateStatus(id, 'approved');
    },

    async dismissVariantMock(id: string): Promise<MediaStudioOutputVariant[]> {
      await delay(130);
      return updateStatus(id, 'dismissed');
    },
  };
}
