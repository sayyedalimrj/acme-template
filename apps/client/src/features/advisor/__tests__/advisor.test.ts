import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { advisorReply } from '@/features/advisor/advisorHelpers';
import { advisorProviderStatus } from '@/mock/data/aiAdvisor';
import { aiAdvisorService } from '@/services';

const FORBIDDEN_KEYS = ['apiKey', 'api_key', 'secret', 'openai', 'anthropic', 'modelConfig'];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('AI advisor service (mock)', () => {
  it('returns a grounded, frontend-safe store-context summary', async () => {
    const context = await aiAdvisorService.getStoreContextSummary();
    expect(context.ordersCount).toBeGreaterThan(0);
    expect(context.productsCount).toBeGreaterThan(0);
    expect(context.planId).toBeDefined();
    const json = JSON.stringify(context).toLowerCase();
    FORBIDDEN_KEYS.forEach((k) => expect(json).not.toContain(k.toLowerCase()));
  });

  it('confirms no real AI provider is connected', () => {
    expect(advisorProviderStatus).toBe('not_connected');
  });

  it('returns recommendations spanning campaign, product, inventory, and media ideas', async () => {
    const recs = await aiAdvisorService.listRecommendations();
    const types = new Set(recs.map((r) => r.type));
    expect(types.has('campaign_idea')).toBe(true);
    expect(types.has('product_copy')).toBe(true);
    expect(types.has('restock_action')).toBe(true);
    expect(types.has('media_studio_idea')).toBe(true);
    // Every recommendation starts as review-only "suggested".
    expect(recs.every((r) => r.status === 'suggested')).toBe(true);
  });

  it('returns a deterministic mock reply (no AI, no network)', async () => {
    const message = 'کدام محصولات نیاز به موجودی دارند؟';
    const conversation = await aiAdvisorService.sendAdvisorMessageMock(message);
    const last = conversation[conversation.length - 1];
    expect(last.role).toBe('assistant');
    expect(last.text).toBe(advisorReply(message));
  });

  it('marks a recommendation reviewed and dismisses another (mock-only)', async () => {
    const reviewed = await aiAdvisorService.markRecommendationReviewed('rec_restock');
    expect(reviewed.find((r) => r.id === 'rec_restock')?.status).toBe('reviewed');
    const dismissed = await aiAdvisorService.dismissRecommendationMock('rec_seo');
    expect(dismissed.find((r) => r.id === 'rec_seo')?.status).toBe('dismissed');
  });
});
