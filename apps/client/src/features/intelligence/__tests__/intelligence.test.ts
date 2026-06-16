import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { customerIntelligenceService } from '@/services';

const FORBIDDEN_KEYS = [
  'trackingId',
  'gaId',
  'ga4',
  'cookie',
  'fingerprint',
  'apiKey',
  'secret',
  'clientId',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('customer intelligence service (mock)', () => {
  it('reports no real tracking provider connected', async () => {
    const overview = await customerIntelligenceService.getOverview();
    expect(overview.providerStatus).toBe('not_connected');
    expect(overview.readiness.trackingProvider).toBe('not_connected');
  });

  it('includes the core event taxonomy in the mock stream', async () => {
    const events = await customerIntelligenceService.listEvents();
    const types = new Set(events.map((e) => e.type));
    ['site_search', 'product_view', 'add_to_cart', 'purchase', 'back_in_stock_subscribe'].forEach(
      (type) => expect(types.has(type as never)).toBe(true),
    );
  });

  it('identifies no-match and restock search opportunities', async () => {
    const overview = await customerIntelligenceService.getOverview();
    expect(overview.search.some((s) => !s.matched && s.opportunity === 'add_product')).toBe(true);
    expect(overview.search.some((s) => s.opportunity === 'restock')).toBe(true);
    expect(overview.summary.totalEvents).toBeGreaterThan(0);

    const json = JSON.stringify(overview).toLowerCase();
    FORBIDDEN_KEYS.forEach((k) => expect(json).not.toContain(k.toLowerCase()));
  });

  it('records a mock event (in-memory only)', async () => {
    const before = (await customerIntelligenceService.listEvents()).length;
    const after = await customerIntelligenceService.recordEventMock({ type: 'product_view' });
    expect(after.length).toBe(before + 1);
    expect(after[0].type).toBe('product_view');
  });

  it('reviews and dismisses recommendations (mock-only)', async () => {
    const reviewed = await customerIntelligenceService.markRecommendationReviewed('ir_restock');
    expect(reviewed.find((r) => r.id === 'ir_restock')?.status).toBe('reviewed');
    const dismissed = await customerIntelligenceService.dismissRecommendationMock('ir_advisor');
    expect(dismissed.find((r) => r.id === 'ir_advisor')?.status).toBe('dismissed');
  });
});
