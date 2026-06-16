import { describe, expect, it } from '@jest/globals';

import {
  analyzePreset,
  buildVariants,
  qualityMeta,
  variantStatusMeta,
} from '@/features/media-studio/mediaStudioHelpers';

describe('media studio helpers', () => {
  it('analyzes poor presets with issues and recommended fixes', () => {
    const blurry = analyzePreset('blurry');
    expect(blurry.quality).toBe('poor');
    expect(blurry.issues).toContain('blurry');
    expect(blurry.recommendedFixes).toContain('improve_low_quality_photo');

    const damaged = analyzePreset('damaged_or_dirty');
    expect(damaged.issues).toContain('damaged_or_dirty_product');
    expect(damaged.recommendedFixes).toContain('repair_damaged_photo');
  });

  it('treats a marketplace-ready preset as high quality with no issues', () => {
    const ready = analyzePreset('marketplace_ready');
    expect(ready.quality).toBe('marketplace_ready');
    expect(ready.issues).toHaveLength(0);
  });

  it('builds deterministic mock variants for a task', () => {
    const a = buildVariants('create_white_background', 'prod_1', 'Tee', 'gen_1');
    const b = buildVariants('create_white_background', 'prod_1', 'Tee', 'gen_1');
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a[0].taskType).toBe('create_white_background');
    expect(a[0].productId).toBe('prod_1');
    expect(a[0].status).toBe('suggested');
    expect(a[0].title).toContain('Tee');
  });

  it('maps quality and variant status to tones', () => {
    expect(qualityMeta('poor').tone).toBe('danger');
    expect(qualityMeta('marketplace_ready').tone).toBe('success');
    expect(variantStatusMeta('approved').tone).toBe('success');
  });
});
