import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { mediaStudioService } from '@/services';

const FORBIDDEN_KEYS = [
  'apiKey',
  'api_key',
  'secret',
  'fileToken',
  'uploadUrl',
  'openai',
  'accessToken',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('media studio service (mock)', () => {
  it('reports no real provider connected', async () => {
    expect(await mediaStudioService.getProviderStatus()).toBe('not_connected');
  });

  it('analyzes a poor source preset and returns issues + fixes (mock, no upload)', async () => {
    const asset = await mediaStudioService.analyzeSourceAssetMock({
      productId: 'prod_1001',
      preset: 'damaged_or_dirty',
    });
    expect(asset.quality).toBe('poor');
    expect(asset.issues).toContain('damaged_or_dirty_product');
    expect(asset.recommendedFixes).toContain('repair_damaged_photo');
    const json = JSON.stringify(asset).toLowerCase();
    FORBIDDEN_KEYS.forEach((k) => expect(json).not.toContain(k.toLowerCase()));
  });

  it('creates deterministic mock output variants for a task', async () => {
    const request = await mediaStudioService.createGenerationMock({
      productId: 'prod_1001',
      taskType: 'create_white_background',
    });
    expect(request.status).toBe('mock_completed');
    expect(request.variants.length).toBeGreaterThan(0);
    expect(request.variants.every((v) => v.taskType === 'create_white_background')).toBe(true);
    expect(request.variants.every((v) => v.status === 'suggested')).toBe(true);

    // The created variants are listed for the product.
    const listed = await mediaStudioService.listOutputVariants('prod_1001');
    expect(listed.some((v) => v.id === request.variants[0].id)).toBe(true);
  });

  it('reviews/approves/dismisses a variant (mock-only)', async () => {
    const seeded = await mediaStudioService.listOutputVariants('prod_1001');
    expect(seeded.length).toBeGreaterThan(0);
    const id = seeded[0].id;

    const reviewed = await mediaStudioService.markVariantReviewed(id);
    expect(reviewed.find((v) => v.id === id)?.status).toBe('reviewed');
    const approved = await mediaStudioService.approveVariantMock(id);
    expect(approved.find((v) => v.id === id)?.status).toBe('approved');
    const dismissed = await mediaStudioService.dismissVariantMock(id);
    expect(dismissed.find((v) => v.id === id)?.status).toBe('dismissed');
  });

  it('exposes prompts, video concepts, and safety notices with no secrets', async () => {
    const info = await mediaStudioService.getInfo();
    expect(info.prompts.length).toBeGreaterThan(0);
    expect(info.videoConcepts.length).toBeGreaterThan(0);
    expect(info.safetyNotices.length).toBeGreaterThan(0);
    const json = JSON.stringify(info).toLowerCase();
    FORBIDDEN_KEYS.forEach((k) => expect(json).not.toContain(k.toLowerCase()));
  });
});
