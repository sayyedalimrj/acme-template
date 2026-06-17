/**
 * Mock Notification / Automation adapter.
 *
 * Serves back-in-stock subscriptions, automation rules, review-only campaign drafts, and a
 * consent-gated message preview. Draft review/approve/dismiss and creation mutate only the
 * in-memory copy.
 *
 * SECURITY/PRIVACY (binding): NO SMS/email/WhatsApp provider, NO Kavenegar/Twilio/Klaviyo, NO
 * messages sent, NO real phone numbers (masked placeholders only), NO sender IDs/provider
 * keys/secrets, NO real consent/opt-out storage, NO scheduler. `approveDraftMock` only marks
 * a draft approved for review — it sends nothing. See security-model.md.
 */
import {
  automationRules,
  automationSafetyNotices,
  backInStockSubscriptions,
  campaignDrafts,
  consentReadiness,
  notificationProviderStatus,
  notificationReadiness,
} from '@/mock/data/automation';
import { productById } from '@/mock/data/catalog';
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
import { buildMessagePreview } from '@/features/automation/automationHelpers';

import type { NotificationAutomationAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockNotificationAutomationAdapter(): NotificationAutomationAdapter {
  let drafts: CampaignDraft[] = clone(campaignDrafts);
  let seq = 1;

  const find = (id: string): CampaignDraft => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) {
      throw new Error(`Campaign draft not found: ${id}`);
    }
    return draft;
  };

  const updateStatus = (id: string, status: CampaignDraft['status']) => {
    drafts = drafts.map((d) => (d.id === id ? { ...d, status } : d));
    return clone(drafts);
  };

  return {
    async getProviderStatus(): Promise<NotificationProviderStatus> {
      await delay(80);
      return notificationProviderStatus;
    },
    async getReadiness(): Promise<NotificationReadiness> {
      await delay(80);
      return clone(notificationReadiness);
    },
    async getConsentReadiness(): Promise<ConsentReadiness> {
      await delay(80);
      return clone(consentReadiness);
    },
    async listBackInStockSubscriptions(): Promise<BackInStockSubscription[]> {
      await delay(150);
      return clone(backInStockSubscriptions);
    },
    async listAutomationRules(): Promise<AutomationRule[]> {
      await delay(150);
      return clone(automationRules);
    },
    async listCampaignDrafts(): Promise<CampaignDraft[]> {
      await delay(160);
      return clone(drafts);
    },
    async listSafetyNotices(): Promise<AutomationSafetyNotice[]> {
      await delay(80);
      return clone(automationSafetyNotices);
    },

    async previewCampaignMessage(draftId: string): Promise<CampaignMessagePreview> {
      await delay(150);
      return buildMessagePreview(find(draftId));
    },

    async createBackInStockDraftMock(productId: string): Promise<CampaignDraft> {
      await delay(220);
      const product = productById(productId);
      const subscribers =
        backInStockSubscriptions.find((s) => s.productId === productId)?.interestedShoppers ?? 1;
      const draft: CampaignDraft = {
        id: `cd_bis_new_${seq++}`,
        ruleType: 'back_in_stock_alert',
        title: 'اعلام موجودی مجدد',
        reason: `${subscribers} مشتری منتظر موجود شدن «${product.name}» هستند.`,
        channel: 'sms',
        audience: {
          label: `مشترکین موجودی «${product.name}»`,
          size: subscribers,
          channel: 'sms',
          consentReadiness: 'pending',
        },
        messagePreview: `خبر خوب! «${product.name}» دوباره موجود شد. تا تمام نشده سفارش دهید.`,
        readiness: 'ready',
        status: 'suggested',
      };
      drafts = [draft, ...drafts];
      return clone(draft);
    },

    async markDraftReviewed(id: string): Promise<CampaignDraft[]> {
      await delay(130);
      return updateStatus(id, 'reviewed');
    },
    async approveDraftMock(id: string): Promise<CampaignDraft[]> {
      await delay(130);
      // Mock-only: marks the draft approved for review. NOTHING is sent.
      return updateStatus(id, 'approved');
    },
    async dismissDraftMock(id: string): Promise<CampaignDraft[]> {
      await delay(130);
      return updateStatus(id, 'dismissed');
    },
  };
}
