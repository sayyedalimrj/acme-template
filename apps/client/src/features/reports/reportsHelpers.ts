/**
 * Pure presentation helpers for Reports & Analytics: period options, badge/tone maps for
 * trends, readiness states, priorities, stock risk, and i18n key mappers. React-free so they
 * are trivial to unit test.
 *
 * SECURITY: helpers only read frontend-safe, mock-derived values; none touch provider IDs,
 * analytics keys, or PII.
 */
import type { BadgeTone } from '@/components/ui';
import type {
  CampaignAudienceKind,
  CampaignConversionReadiness,
  ConsentStatus,
  IntentStrength,
  MetricTrend,
  ReportInsightCategory,
  ReportPeriod,
  ReportRecommendationType,
  ProductStockRisk,
  RestockPriority,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

interface Meta {
  labelKey: StringKey;
  tone: BadgeTone;
}

/** Ordered period tabs shown on the screen. */
export const PERIOD_OPTIONS: { period: ReportPeriod; labelKey: StringKey }[] = [
  { period: 'today', labelKey: 'reports.period.today' },
  { period: 'last_7_days', labelKey: 'reports.period.last_7_days' },
  { period: 'last_30_days', labelKey: 'reports.period.last_30_days' },
  { period: 'this_month', labelKey: 'reports.period.this_month' },
  { period: 'custom_later', labelKey: 'reports.period.custom_later' },
];

const TREND_META: Record<MetricTrend, { tone: BadgeTone; symbol: string }> = {
  up: { tone: 'success', symbol: '▲' },
  down: { tone: 'danger', symbol: '▼' },
  flat: { tone: 'neutral', symbol: '◆' },
};
export function trendMeta(trend: MetricTrend): { tone: BadgeTone; symbol: string } {
  return TREND_META[trend];
}

/** Maps any analytics-readiness/export state to a badge label + tone. */
const READINESS_META: Record<string, Meta> = {
  not_connected: { labelKey: 'reports.readiness.not_connected', tone: 'neutral' },
  planned: { labelKey: 'reports.readiness.planned', tone: 'info' },
  mock: { labelKey: 'reports.readiness.mock', tone: 'warning' },
  later: { labelKey: 'reports.readiness.later', tone: 'info' },
  not_available: { labelKey: 'reports.readiness.not_available', tone: 'neutral' },
};
export function readinessMeta(state: string): Meta {
  return READINESS_META[state] ?? READINESS_META.not_connected;
}

const PRIORITY_META: Record<IntentStrength, Meta> = {
  high: { labelKey: 'reports.priority.high', tone: 'danger' },
  medium: { labelKey: 'reports.priority.medium', tone: 'warning' },
  low: { labelKey: 'reports.priority.low', tone: 'neutral' },
};
export function priorityMeta(priority: IntentStrength): Meta {
  return PRIORITY_META[priority];
}

const RESTOCK_PRIORITY_META: Record<RestockPriority, Meta> = {
  high: { labelKey: 'reports.priority.high', tone: 'danger' },
  medium: { labelKey: 'reports.priority.medium', tone: 'warning' },
  low: { labelKey: 'reports.priority.low', tone: 'neutral' },
};
export function restockPriorityMeta(priority: RestockPriority): Meta {
  return RESTOCK_PRIORITY_META[priority];
}

const STOCK_RISK_META: Record<ProductStockRisk, Meta> = {
  out: { labelKey: 'reports.stockRisk.out', tone: 'danger' },
  low: { labelKey: 'reports.stockRisk.low', tone: 'warning' },
  none: { labelKey: 'reports.stockRisk.none', tone: 'success' },
};
export function stockRiskMeta(risk: ProductStockRisk): Meta {
  return STOCK_RISK_META[risk];
}

export function audienceKindLabelKey(kind: CampaignAudienceKind): StringKey {
  return `reports.audience.${kind}` as StringKey;
}

const CONSENT_META: Record<ConsentStatus, Meta> = {
  opted_in: { labelKey: 'reports.consent.opted_in', tone: 'success' },
  pending: { labelKey: 'reports.consent.pending', tone: 'warning' },
  not_collected: { labelKey: 'reports.consent.not_collected', tone: 'neutral' },
};
export function consentMeta(consent: ConsentStatus): Meta {
  return CONSENT_META[consent];
}

const CAMPAIGN_READINESS_META: Record<CampaignConversionReadiness, Meta> = {
  ready: { labelKey: 'reports.campaignReadiness.ready', tone: 'success' },
  warming: { labelKey: 'reports.campaignReadiness.warming', tone: 'warning' },
  low: { labelKey: 'reports.campaignReadiness.low', tone: 'neutral' },
};
export function campaignReadinessMeta(readiness: CampaignConversionReadiness): Meta {
  return CAMPAIGN_READINESS_META[readiness];
}

export function insightCategoryLabelKey(category: ReportInsightCategory): StringKey {
  return `reports.insightCategory.${category}` as StringKey;
}

export function recommendationTypeLabelKey(type: ReportRecommendationType): StringKey {
  return `reports.recType.${type}` as StringKey;
}
