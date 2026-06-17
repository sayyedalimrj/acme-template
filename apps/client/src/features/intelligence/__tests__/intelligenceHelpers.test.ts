import { describe, expect, it } from '@jest/globals';

import {
  abandonedCartSignals,
  backInStockInterests,
  campaignConversionSignals,
  commerceEvents,
  intelligenceRecommendations,
  productInterestSignals,
  searchDemandInsights,
} from '@/mock/data/intelligence';
import {
  computeSummary,
  conversionMeta,
  groupRecommendations,
  opportunityMeta,
} from '@/features/intelligence/intelligenceHelpers';

describe('intelligence helpers', () => {
  it('computes a deterministic summary from the mock signals', () => {
    const summary = computeSummary(
      commerceEvents,
      searchDemandInsights,
      productInterestSignals,
      backInStockInterests,
      abandonedCartSignals,
      campaignConversionSignals,
    );
    expect(summary.totalEvents).toBe(commerceEvents.length);
    expect(summary.abandonedCarts).toBe(abandonedCartSignals.length);
    expect(summary.backInStockInterests).toBe(19); // 14 + 5
    expect(summary.activeShoppers).toBeGreaterThan(0);
    expect(summary.topSearchTerms.length).toBeGreaterThan(0);
    expect(summary.topSearchTerms.length).toBeLessThanOrEqual(5);
  });

  it('maps opportunity and conversion to tones', () => {
    expect(opportunityMeta('add_product').tone).toBe('info');
    expect(opportunityMeta('restock').tone).toBe('warning');
    expect(conversionMeta('hot').tone).toBe('danger');
  });

  it('groups recommendations by category in canonical order', () => {
    const groups = groupRecommendations(intelligenceRecommendations);
    expect(groups[0].category).toBe('search_demand');
    expect(groups.map((g) => g.category)).toContain('advisor');
  });
});
