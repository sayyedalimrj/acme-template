import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { notificationAutomationService } from '@/services';

const FORBIDDEN_KEYS = [
  'apiKey',
  'api_key',
  'secret',
  'senderId',
  'sender_id',
  'accessToken',
  'authToken',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('notification automation service (mock)', () => {
  it('reports no real SMS provider connected', async () => {
    const overview = await notificationAutomationService.getOverview();
    expect(overview.providerStatus).toBe('not_connected');
    expect(overview.readiness.smsProvider).toBe('not_connected');
    expect(overview.subscriptions.length).toBeGreaterThan(0);
    // Masked sample contacts only — no real phone numbers.
    expect(overview.subscriptions.every((s) => s.maskedExample.includes('*'))).toBe(true);
    const json = JSON.stringify(overview).toLowerCase();
    FORBIDDEN_KEYS.forEach((k) => expect(json).not.toContain(k.toLowerCase()));
  });

  it('returns campaign drafts incl. back-in-stock and abandoned-cart', async () => {
    const drafts = await notificationAutomationService.listCampaignDrafts();
    const ruleTypes = new Set(drafts.map((d) => d.ruleType));
    expect(ruleTypes.has('back_in_stock_alert')).toBe(true);
    expect(ruleTypes.has('abandoned_cart_followup')).toBe(true);
  });

  it('builds a preview with consent warning + opt-out (no send)', async () => {
    const preview = await notificationAutomationService.previewCampaignMessage('cd_bis');
    expect(preview.body.length).toBeGreaterThan(0);
    expect(preview.optOutText.length).toBeGreaterThan(0);
    expect(preview.consentWarning.length).toBeGreaterThan(0);
  });

  it('creates a back-in-stock draft for a product (mock-only)', async () => {
    const before = (await notificationAutomationService.listCampaignDrafts()).length;
    const draft = await notificationAutomationService.createBackInStockDraftMock('prod_1001');
    expect(draft.ruleType).toBe('back_in_stock_alert');
    expect((await notificationAutomationService.listCampaignDrafts()).length).toBe(before + 1);
  });

  it('reviews / approves / dismisses a draft (mock-only, nothing sent)', async () => {
    const reviewed = await notificationAutomationService.markDraftReviewed('cd_bis');
    expect(reviewed.find((d) => d.id === 'cd_bis')?.status).toBe('reviewed');
    const approved = await notificationAutomationService.approveDraftMock('cd_abandoned');
    expect(approved.find((d) => d.id === 'cd_abandoned')?.status).toBe('approved');
    const dismissed = await notificationAutomationService.dismissDraftMock('cd_vip');
    expect(dismissed.find((d) => d.id === 'cd_vip')?.status).toBe('dismissed');
  });
});
