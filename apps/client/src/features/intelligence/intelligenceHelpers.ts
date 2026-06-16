/**
 * Pure helpers for Customer Intelligence: presentation maps, recommendation grouping, and a
 * deterministic summary computed from the mock signals. React-free for easy unit testing.
 *
 * SECURITY: helpers only read frontend-safe, mock data; none touch tracking IDs or PII.
 */
import type { BadgeTone } from '@/components/ui';
import type {
  AbandonedCartSignal,
  BackInStockInterest,
  CampaignConversionSignal,
  CampaignReadiness,
  CommerceEvent,
  CommerceEventType,
  ConversionSignal,
  EventReadinessState,
  IntelligenceRecommendation,
  IntelligenceRecommendationCategory,
  IntelligenceSummary,
  IntentStrength,
  ProductInterestSignal,
  SearchDemandInsight,
  SearchOpportunity,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

interface Meta {
  labelKey: StringKey;
  tone: BadgeTone;
}

const INTENT_META: Record<IntentStrength, Meta> = {
  high: { labelKey: 'intel.intent.high', tone: 'danger' },
  medium: { labelKey: 'intel.intent.medium', tone: 'warning' },
  low: { labelKey: 'intel.intent.low', tone: 'neutral' },
};
export function intentMeta(strength: IntentStrength): Meta {
  return INTENT_META[strength];
}

const OPPORTUNITY_META: Record<SearchOpportunity, Meta> = {
  add_product: { labelKey: 'intel.opportunity.add_product', tone: 'info' },
  restock: { labelKey: 'intel.opportunity.restock', tone: 'warning' },
  improve_naming: { labelKey: 'intel.opportunity.improve_naming', tone: 'neutral' },
  campaign: { labelKey: 'intel.opportunity.campaign', tone: 'success' },
};
export function opportunityMeta(opportunity: SearchOpportunity): Meta {
  return OPPORTUNITY_META[opportunity];
}

const CONVERSION_META: Record<ConversionSignal, Meta> = {
  hot: { labelKey: 'intel.conversion.hot', tone: 'danger' },
  warm: { labelKey: 'intel.conversion.warm', tone: 'warning' },
  cold: { labelKey: 'intel.conversion.cold', tone: 'neutral' },
};
export function conversionMeta(signal: ConversionSignal): Meta {
  return CONVERSION_META[signal];
}

const READINESS_META: Record<EventReadinessState, Meta> = {
  not_connected: { labelKey: 'intel.readiness.not_connected', tone: 'neutral' },
  planned: { labelKey: 'intel.readiness.planned', tone: 'info' },
  mock: { labelKey: 'intel.readiness.mock', tone: 'warning' },
};
export function readinessMeta(state: EventReadinessState): Meta {
  return READINESS_META[state];
}

const CAMPAIGN_META: Record<CampaignReadiness, Meta> = {
  ready: { labelKey: 'intel.campaign.ready', tone: 'success' },
  warming: { labelKey: 'intel.campaign.warming', tone: 'warning' },
  low: { labelKey: 'intel.campaign.low', tone: 'neutral' },
};
export function campaignReadinessMeta(readiness: CampaignReadiness): Meta {
  return CAMPAIGN_META[readiness];
}

const REC_STATUS_META: Record<IntelligenceRecommendation['status'], Meta> = {
  suggested: { labelKey: 'intel.recStatus.suggested', tone: 'info' },
  reviewed: { labelKey: 'intel.recStatus.reviewed', tone: 'success' },
  dismissed: { labelKey: 'intel.recStatus.dismissed', tone: 'neutral' },
};
export function recStatusMeta(status: IntelligenceRecommendation['status']): Meta {
  return REC_STATUS_META[status];
}

export function eventTypeLabelKey(type: CommerceEventType): StringKey {
  return `intel.event.${type}` as StringKey;
}

export const INTEL_CATEGORY_ORDER: IntelligenceRecommendationCategory[] = [
  'search_demand',
  'restock',
  'abandoned_cart',
  'retention',
  'campaign',
  'content',
  'advisor',
];

export function categoryLabelKey(category: IntelligenceRecommendationCategory): StringKey {
  return `intel.category.${category}` as StringKey;
}

export function groupRecommendations(recs: IntelligenceRecommendation[]): {
  category: IntelligenceRecommendationCategory;
  recommendations: IntelligenceRecommendation[];
}[] {
  return INTEL_CATEGORY_ORDER.map((category) => ({
    category,
    recommendations: recs.filter((r) => r.category === category),
  })).filter((group) => group.recommendations.length > 0);
}

const INTENT_EVENTS: CommerceEventType[] = [
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'product_interest',
  'back_in_stock_subscribe',
];

/** Deterministic summary aggregated from the mock signals. */
export function computeSummary(
  events: CommerceEvent[],
  search: SearchDemandInsight[],
  products: ProductInterestSignal[],
  backInStock: BackInStockInterest[],
  abandoned: AbandonedCartSignal[],
  campaigns: CampaignConversionSignal[],
): IntelligenceSummary {
  const shoppers = new Set<string>();
  const interested = new Set<string>();
  for (const event of events) {
    if (event.actor.kind === 'customer' || event.actor.kind === 'anonymous') {
      shoppers.add(event.actor.label);
      if (INTENT_EVENTS.includes(event.type)) {
        interested.add(event.actor.label);
      }
    }
  }

  const topSearchTerms = [...search]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => ({ term: s.term, count: s.count }));

  const topViewedProducts = [...products]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map((p) => ({ productName: p.productName, views: p.views }));

  const conversionReady =
    products.filter((p) => p.conversionSignal === 'hot').length +
    campaigns.filter((c) => c.readiness === 'ready').length;

  return {
    totalEvents: events.length,
    activeShoppers: shoppers.size,
    interestedShoppers: interested.size,
    topSearchTerms,
    topViewedProducts,
    abandonedCarts: abandoned.length,
    backInStockInterests: backInStock.reduce((sum, b) => sum + b.subscribers, 0),
    campaignInteractions: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    conversionReady,
  };
}
