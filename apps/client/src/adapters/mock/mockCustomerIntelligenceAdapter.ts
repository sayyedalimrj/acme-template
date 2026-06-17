/**
 * Mock Customer Intelligence / Event Tracking adapter.
 *
 * Serves a mock event stream + derived signals and computes a deterministic summary.
 * `recordEventMock` appends to the in-memory stream; recommendation review/dismiss mutate
 * the in-memory copy.
 *
 * SECURITY/PRIVACY (binding): MOCK-ONLY. NO real tracking, NO cookies/fingerprints, NO
 * analytics provider, NO external send, NO tracking/provider IDs/secrets. Actors are mock
 * customer labels or anonymous. See security-model.md.
 */
import { productById } from '@/mock/data/catalog';
import {
  abandonedCartSignals,
  backInStockInterests,
  campaignConversionSignals,
  commerceEvents,
  eventProviderStatus,
  eventTrackingReadiness,
  intelligenceRecommendations,
  productInterestSignals,
  searchDemandInsights,
} from '@/mock/data/intelligence';
import type {
  AbandonedCartSignal,
  BackInStockInterest,
  CampaignConversionSignal,
  CommerceEvent,
  CommerceEventSource,
  CommerceEventType,
  EventProviderStatus,
  EventTrackingReadiness,
  IntelligenceRecommendation,
  IntelligenceSummary,
  ProductInterestSignal,
  RecordEventInput,
  SearchDemandInsight,
} from '@/domain/types';
import { computeSummary } from '@/features/intelligence/intelligenceHelpers';

import type { CustomerIntelligenceAdapter } from '../types';
import { clone, delay } from './mockUtils';

const SOURCE_FOR_TYPE: Partial<Record<CommerceEventType, CommerceEventSource>> = {
  site_search: 'search',
  product_view: 'storefront',
  add_to_cart: 'cart',
  remove_from_cart: 'cart',
  begin_checkout: 'checkout',
  purchase: 'checkout',
  abandoned_cart: 'cart',
  back_in_stock_subscribe: 'storefront',
  sms_click: 'sms',
  campaign_click: 'campaign',
  campaign_conversion: 'campaign',
  page_view: 'storefront',
};

export function createMockCustomerIntelligenceAdapter(): CustomerIntelligenceAdapter {
  let events: CommerceEvent[] = clone(commerceEvents);
  let recommendations: IntelligenceRecommendation[] = clone(intelligenceRecommendations);
  let seq = 1;

  const updateRecStatus = (id: string, status: IntelligenceRecommendation['status']) => {
    recommendations = recommendations.map((r) => (r.id === id ? { ...r, status } : r));
    return clone(recommendations);
  };

  return {
    async getProviderStatus(): Promise<EventProviderStatus> {
      await delay(80);
      return eventProviderStatus;
    },
    async getReadiness(): Promise<EventTrackingReadiness> {
      await delay(80);
      return clone(eventTrackingReadiness);
    },
    async listEvents(): Promise<CommerceEvent[]> {
      await delay(160);
      return clone(events);
    },
    async getIntelligenceSummary(): Promise<IntelligenceSummary> {
      await delay(160);
      return computeSummary(
        events,
        searchDemandInsights,
        productInterestSignals,
        backInStockInterests,
        abandonedCartSignals,
        campaignConversionSignals,
      );
    },
    async listSearchDemandInsights(): Promise<SearchDemandInsight[]> {
      await delay(150);
      return clone(searchDemandInsights);
    },
    async listProductInterestSignals(): Promise<ProductInterestSignal[]> {
      await delay(150);
      return clone(productInterestSignals);
    },
    async listBackInStockInterests(): Promise<BackInStockInterest[]> {
      await delay(140);
      return clone(backInStockInterests);
    },
    async listAbandonedCartSignals(): Promise<AbandonedCartSignal[]> {
      await delay(140);
      return clone(abandonedCartSignals);
    },
    async listCampaignConversionSignals(): Promise<CampaignConversionSignal[]> {
      await delay(140);
      return clone(campaignConversionSignals);
    },
    async listRecommendations(): Promise<IntelligenceRecommendation[]> {
      await delay(150);
      return clone(recommendations);
    },

    async recordEventMock(input: RecordEventInput): Promise<CommerceEvent[]> {
      await delay(180);
      const now = new Date().toISOString();
      const product = input.productId ? productById(input.productId) : undefined;
      const event: CommerceEvent = {
        id: `evt_mock_${seq++}`,
        type: input.type,
        source: SOURCE_FOR_TYPE[input.type] ?? 'unknown',
        actor: { kind: 'anonymous', label: 'رویداد نمونه (توسعه)' },
        item:
          product || input.searchTerm
            ? {
                productId: product?.id,
                productName: product?.name,
                searchTerm: input.searchTerm,
              }
            : undefined,
        createdAt: now,
        note: 'رویداد نمونه ثبت‌شده از پنل توسعه (بدون ردیابی واقعی).',
      };
      events = [event, ...events];
      return clone(events);
    },

    async markRecommendationReviewed(id: string): Promise<IntelligenceRecommendation[]> {
      await delay(130);
      return updateRecStatus(id, 'reviewed');
    },
    async dismissRecommendationMock(id: string): Promise<IntelligenceRecommendation[]> {
      await delay(130);
      return updateRecStatus(id, 'dismissed');
    },
  };
}
