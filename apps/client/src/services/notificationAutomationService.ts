/**
 * Notification / Automation service — thin wrapper over the active NotificationAutomationAdapter.
 *
 * Powers the mock SMS / back-in-stock automation screen: subscriptions, rules, review-only
 * campaign drafts, consent-gated previews, and draft actions. Sends NOTHING and uses no real
 * provider/phone/secret (see security-model.md). Screens/hooks call this, never the adapter.
 */
import { getAdapters } from '@/adapters';
import type {
  AutomationRule,
  AutomationSafetyNotice,
  BackInStockSubscription,
  CampaignDraft,
  CampaignMessagePreview,
  ConsentReadiness,
  NotificationProviderStatus,
  NotificationReadiness,
} from '@/domain/types';

export interface AutomationOverview {
  providerStatus: NotificationProviderStatus;
  readiness: NotificationReadiness;
  consent: ConsentReadiness;
  subscriptions: BackInStockSubscription[];
  rules: AutomationRule[];
  safetyNotices: AutomationSafetyNotice[];
}

export const notificationAutomationService = {
  listCampaignDrafts(siteId?: string): Promise<CampaignDraft[]> {
    return getAdapters().automation.listCampaignDrafts(siteId);
  },
  previewCampaignMessage(draftId: string): Promise<CampaignMessagePreview> {
    return getAdapters().automation.previewCampaignMessage(draftId);
  },
  createBackInStockDraftMock(productId: string): Promise<CampaignDraft> {
    return getAdapters().automation.createBackInStockDraftMock(productId);
  },
  markDraftReviewed(id: string): Promise<CampaignDraft[]> {
    return getAdapters().automation.markDraftReviewed(id);
  },
  approveDraftMock(id: string): Promise<CampaignDraft[]> {
    return getAdapters().automation.approveDraftMock(id);
  },
  dismissDraftMock(id: string): Promise<CampaignDraft[]> {
    return getAdapters().automation.dismissDraftMock(id);
  },
  /** Single fetch for the static parts of the automation screen. */
  async getOverview(siteId?: string): Promise<AutomationOverview> {
    const a = getAdapters().automation;
    const [providerStatus, readiness, consent, subscriptions, rules, safetyNotices] =
      await Promise.all([
        a.getProviderStatus(),
        a.getReadiness(),
        a.getConsentReadiness(),
        a.listBackInStockSubscriptions(siteId),
        a.listAutomationRules(siteId),
        a.listSafetyNotices(),
      ]);
    return { providerStatus, readiness, consent, subscriptions, rules, safetyNotices };
  },
};
