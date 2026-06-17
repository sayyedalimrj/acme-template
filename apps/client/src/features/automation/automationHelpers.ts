/**
 * Pure helpers for SMS/back-in-stock automation: presentation maps, draft grouping, and a
 * DETERMINISTIC message-preview builder. React-free for easy unit testing.
 *
 * SECURITY: all logic is local and frontend-safe. The preview never sends anything and always
 * includes a consent warning + opt-out footer; no provider/phone/secret is involved.
 */
import type { BadgeTone } from '@/components/ui';
import type {
  AutomationActionStatus,
  AutomationRuleType,
  CampaignConversionReadiness,
  CampaignDraft,
  CampaignMessagePreview,
  ConsentStatus,
  NotificationChannel,
  NotificationProviderStatus,
  ProviderReadinessState,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

interface Meta {
  labelKey: StringKey;
  tone: BadgeTone;
}

const CONSENT_META: Record<ConsentStatus, Meta> = {
  opted_in: { labelKey: 'automation.consent.opted_in', tone: 'success' },
  pending: { labelKey: 'automation.consent.pending', tone: 'warning' },
  not_collected: { labelKey: 'automation.consent.not_collected', tone: 'neutral' },
};
export function consentMeta(status: ConsentStatus): Meta {
  return CONSENT_META[status];
}

const ACTION_STATUS_META: Record<AutomationActionStatus, Meta> = {
  suggested: { labelKey: 'automation.status.suggested', tone: 'info' },
  reviewed: { labelKey: 'automation.status.reviewed', tone: 'warning' },
  approved: { labelKey: 'automation.status.approved', tone: 'success' },
  dismissed: { labelKey: 'automation.status.dismissed', tone: 'neutral' },
};
export function actionStatusMeta(status: AutomationActionStatus): Meta {
  return ACTION_STATUS_META[status];
}

const READINESS_META: Record<ProviderReadinessState, Meta> = {
  not_connected: { labelKey: 'automation.readiness.not_connected', tone: 'neutral' },
  planned: { labelKey: 'automation.readiness.planned', tone: 'info' },
  mock: { labelKey: 'automation.readiness.mock', tone: 'warning' },
  later: { labelKey: 'automation.readiness.later', tone: 'neutral' },
};
export function readinessMeta(state: ProviderReadinessState): Meta {
  return READINESS_META[state];
}

export function providerStatusMeta(status: NotificationProviderStatus): Meta {
  return status === 'mock'
    ? { labelKey: 'automation.readiness.mock', tone: 'warning' }
    : { labelKey: 'automation.readiness.not_connected', tone: 'neutral' };
}

const CONVERSION_META: Record<CampaignConversionReadiness, Meta> = {
  ready: { labelKey: 'automation.conversion.ready', tone: 'success' },
  warming: { labelKey: 'automation.conversion.warming', tone: 'warning' },
  low: { labelKey: 'automation.conversion.low', tone: 'neutral' },
};
export function conversionReadinessMeta(readiness: CampaignConversionReadiness): Meta {
  return CONVERSION_META[readiness];
}

export function channelLabelKey(channel: NotificationChannel): StringKey {
  return `automation.channel.${channel}` as StringKey;
}

export function ruleTypeLabelKey(type: AutomationRuleType): StringKey {
  return `automation.rule.${type}` as StringKey;
}

export const RULE_TYPE_ORDER: AutomationRuleType[] = [
  'back_in_stock_alert',
  'restock_announcement',
  'abandoned_cart_followup',
  'vip_customer_reactivation',
  'product_interest_followup',
  'search_demand_campaign',
  'low_stock_followup',
  'manual_campaign_draft',
];

export function groupDraftsByRuleType(
  drafts: CampaignDraft[],
): { ruleType: AutomationRuleType; drafts: CampaignDraft[] }[] {
  return RULE_TYPE_ORDER.map((ruleType) => ({
    ruleType,
    drafts: drafts.filter((d) => d.ruleType === ruleType),
  })).filter((group) => group.drafts.length > 0);
}

/** Persian opt-out footer placeholder appended to every preview. */
export const OPT_OUT_TEXT = 'برای لغو دریافت پیامک، عدد ۱ را ارسال کنید.';

/** Deterministic, send-free message preview for a draft (always consent-gated). */
export function buildMessagePreview(draft: CampaignDraft): CampaignMessagePreview {
  const consentWarning =
    draft.audience.consentReadiness === 'opted_in'
      ? 'مخاطبان رضایت داده‌اند؛ با این حال ارسال واقعی نیازمند تأیید نهایی شماست.'
      : 'هشدار: ارسال تنها پس از دریافت رضایت مخاطبان مجاز است.';
  return {
    channel: draft.channel,
    body: draft.messagePreview,
    charCount: draft.messagePreview.length,
    audienceSize: draft.audience.size,
    optOutText: OPT_OUT_TEXT,
    consentWarning,
  };
}
