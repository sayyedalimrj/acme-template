/**
 * Customer Intelligence service — thin wrapper over the active CustomerIntelligenceAdapter.
 *
 * Powers the mock intelligence screen: event stream, derived signals, summary, and
 * review-only recommendations. NO real tracking/analytics/cookies/external send (see
 * security-model.md). Screens/hooks call this, never the adapter directly.
 */
import { getAdapters } from '@/adapters';
import type {
  AbandonedCartSignal,
  BackInStockInterest,
  CampaignConversionSignal,
  CommerceEvent,
  EventProviderStatus,
  EventTrackingReadiness,
  IntelligenceRecommendation,
  IntelligenceSummary,
  ProductInterestSignal,
  RecordEventInput,
  SearchDemandInsight,
} from '@/domain/types';

export interface IntelligenceOverview {
  providerStatus: EventProviderStatus;
  readiness: EventTrackingReadiness;
  summary: IntelligenceSummary;
  search: SearchDemandInsight[];
  products: ProductInterestSignal[];
  backInStock: BackInStockInterest[];
  abandoned: AbandonedCartSignal[];
  campaigns: CampaignConversionSignal[];
}

export const customerIntelligenceService = {
  getIntelligenceSummary(siteId?: string): Promise<IntelligenceSummary> {
    return getAdapters().intelligence.getIntelligenceSummary(siteId);
  },
  listEvents(siteId?: string): Promise<CommerceEvent[]> {
    return getAdapters().intelligence.listEvents(siteId);
  },
  listSearchDemandInsights(siteId?: string): Promise<SearchDemandInsight[]> {
    return getAdapters().intelligence.listSearchDemandInsights(siteId);
  },
  listRecommendations(siteId?: string): Promise<IntelligenceRecommendation[]> {
    return getAdapters().intelligence.listRecommendations(siteId);
  },
  recordEventMock(input: RecordEventInput): Promise<CommerceEvent[]> {
    return getAdapters().intelligence.recordEventMock(input);
  },
  markRecommendationReviewed(id: string): Promise<IntelligenceRecommendation[]> {
    return getAdapters().intelligence.markRecommendationReviewed(id);
  },
  dismissRecommendationMock(id: string): Promise<IntelligenceRecommendation[]> {
    return getAdapters().intelligence.dismissRecommendationMock(id);
  },
  /** Single fetch for the static parts of the intelligence screen. */
  async getOverview(siteId?: string): Promise<IntelligenceOverview> {
    const intel = getAdapters().intelligence;
    const [
      providerStatus,
      readiness,
      summary,
      search,
      products,
      backInStock,
      abandoned,
      campaigns,
    ] = await Promise.all([
      intel.getProviderStatus(),
      intel.getReadiness(),
      intel.getIntelligenceSummary(siteId),
      intel.listSearchDemandInsights(siteId),
      intel.listProductInterestSignals(siteId),
      intel.listBackInStockInterests(siteId),
      intel.listAbandonedCartSignals(siteId),
      intel.listCampaignConversionSignals(siteId),
    ]);
    return {
      providerStatus,
      readiness,
      summary,
      search,
      products,
      backInStock,
      abandoned,
      campaigns,
    };
  },
};
