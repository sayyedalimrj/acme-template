/**
 * Mock Reports & Analytics adapter.
 *
 * Serves period-scaled reports built deterministically from the existing mock data
 * (dashboard/catalog/customers/orders/intelligence/automation). Each call clones its output
 * so callers can never mutate the shared fixtures.
 *
 * SECURITY/PRIVACY (binding): MOCK-ONLY. NO real analytics provider, NO GA4, NO WooCommerce
 * Reports API, NO tracking/cookies, NO external send, NO provider IDs/keys/secrets, NO export.
 * `period` only scales mock values — there is no real date engine. See security-model.md.
 */
import {
  analyticsProviderStatus,
  analyticsReadiness,
  buildCampaignReadinessReport,
  buildConversionFunnelReport,
  buildCustomerReport,
  buildExecutiveSummary,
  buildInventoryReport,
  buildProductPerformanceReport,
  buildSalesReport,
  buildSearchDemandReport,
  reportInsights,
  reportRecommendations,
} from '@/mock/data/reports';
import type {
  AnalyticsProviderStatus,
  AnalyticsReadiness,
  CampaignReadinessReport,
  ConversionFunnelReport,
  CustomerReport,
  ExecutiveSummary,
  InventoryReport,
  ProductPerformanceReport,
  ReportInsight,
  ReportPeriod,
  ReportRecommendation,
  SalesReport,
  SearchDemandReport,
} from '@/domain/types';

import type { ReportsAnalyticsAdapter } from '../types';
import { clone, delay } from './mockUtils';

export function createMockReportsAnalyticsAdapter(): ReportsAnalyticsAdapter {
  return {
    async getProviderStatus(): Promise<AnalyticsProviderStatus> {
      await delay(80);
      return analyticsProviderStatus;
    },
    async getReadiness(): Promise<AnalyticsReadiness> {
      await delay(80);
      return clone(analyticsReadiness);
    },
    async getExecutiveSummary(period: ReportPeriod): Promise<ExecutiveSummary> {
      await delay(160);
      return buildExecutiveSummary(period);
    },
    async getSalesReport(period: ReportPeriod): Promise<SalesReport> {
      await delay(150);
      return buildSalesReport(period);
    },
    async getProductPerformanceReport(period: ReportPeriod): Promise<ProductPerformanceReport> {
      await delay(150);
      return buildProductPerformanceReport(period);
    },
    async getCustomerReport(period: ReportPeriod): Promise<CustomerReport> {
      await delay(140);
      return buildCustomerReport(period);
    },
    async getInventoryReport(period: ReportPeriod): Promise<InventoryReport> {
      await delay(140);
      return buildInventoryReport(period);
    },
    async getSearchDemandReport(period: ReportPeriod): Promise<SearchDemandReport> {
      await delay(140);
      return buildSearchDemandReport(period);
    },
    async getCampaignReadinessReport(period: ReportPeriod): Promise<CampaignReadinessReport> {
      await delay(140);
      return buildCampaignReadinessReport(period);
    },
    async getConversionFunnelReport(period: ReportPeriod): Promise<ConversionFunnelReport> {
      await delay(150);
      return buildConversionFunnelReport(period);
    },
    async listReportInsights(): Promise<ReportInsight[]> {
      await delay(120);
      return clone(reportInsights);
    },
    async listReportRecommendations(): Promise<ReportRecommendation[]> {
      await delay(120);
      return clone(reportRecommendations);
    },
  };
}
