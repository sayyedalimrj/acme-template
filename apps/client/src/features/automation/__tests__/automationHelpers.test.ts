import { describe, expect, it } from '@jest/globals';

import { campaignDrafts } from '@/mock/data/automation';
import {
  OPT_OUT_TEXT,
  buildMessagePreview,
  consentMeta,
  groupDraftsByRuleType,
} from '@/features/automation/automationHelpers';

describe('automation helpers', () => {
  it('builds a consent-gated preview with an opt-out footer', () => {
    const draft = campaignDrafts[0];
    const preview = buildMessagePreview(draft);
    expect(preview.body).toBe(draft.messagePreview);
    expect(preview.charCount).toBe(draft.messagePreview.length);
    expect(preview.optOutText).toBe(OPT_OUT_TEXT);
    expect(preview.consentWarning.length).toBeGreaterThan(0);
    expect(preview.audienceSize).toBe(draft.audience.size);
  });

  it('warns when the audience is not fully opted in', () => {
    const pending = campaignDrafts.find((d) => d.audience.consentReadiness !== 'opted_in')!;
    expect(buildMessagePreview(pending).consentWarning).toContain('رضایت');
  });

  it('groups drafts by rule type with back-in-stock first', () => {
    const groups = groupDraftsByRuleType(campaignDrafts);
    expect(groups[0].ruleType).toBe('back_in_stock_alert');
    expect(groups.map((g) => g.ruleType)).toContain('abandoned_cart_followup');
  });

  it('maps consent status to tones', () => {
    expect(consentMeta('opted_in').tone).toBe('success');
    expect(consentMeta('pending').tone).toBe('warning');
  });
});
