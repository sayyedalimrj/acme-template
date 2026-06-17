/**
 * Reports & Analytics service — thin wrapper over the active ReportsAnalyticsAdapter.
 *
 * Powers the lightweight, mock reports screen: provider/readiness status, executive summary,
 * and the sales/product/customer/inventory/search/campaign/funnel reports plus review-only
 * insights and recommendations. Screens/hooks call this, never the adapter directly.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real analytics provider, no GA4, no WooCommerce Reports API,
 * no tracking/cookies, no external send, no provider IDs/keys/secrets, no export. `period`
 * only scales mock values — no real date filtering (see security-model.md).
 */
import { getAdapters } from '@/adapters';
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

export interface ReportsOverview {
  period: ReportPeriod;
  providerStatus: AnalyticsProviderStatus;
  readiness: AnalyticsReadiness;
  executiveSummary: ExecutiveSummary;
  sales: SalesReport;
  productPerformance: ProductPerformanceReport;
  customers: CustomerReport;
  inventory: InventoryReport;
  searchDemand: SearchDemandReport;
  campaignReadiness: CampaignReadinessReport;
  funnel: ConversionFunnelReport;
  insights: ReportInsight[];
  recommendations: ReportRecommendation[];
}

export const reportsAnalyticsService = {
  getProviderStatus(): Promise<AnalyticsProviderStatus> {
    return getAdapters().reports.getProviderStatus();
  },
  getReadiness(): Promise<AnalyticsReadiness> {
    return getAdapters().reports.getReadiness();
  },
  getExecutiveSummary(period: ReportPeriod, siteId?: string): Promise<ExecutiveSummary> {
    return getAdapters().reports.getExecutiveSummary(period, siteId);
  },
  getSalesReport(period: ReportPeriod, siteId?: string): Promise<SalesReport> {
    return getAdapters().reports.getSalesReport(period, siteId);
  },
  getProductPerformanceReport(
    period: ReportPeriod,
    siteId?: string,
  ): Promise<ProductPerformanceReport> {
    return getAdapters().reports.getProductPerformanceReport(period, siteId);
  },
  getCustomerReport(period: ReportPeriod, siteId?: string): Promise<CustomerReport> {
    return getAdapters().reports.getCustomerReport(period, siteId);
  },
  getInventoryReport(period: ReportPeriod, siteId?: string): Promise<InventoryReport> {
    return getAdapters().reports.getInventoryReport(period, siteId);
  },
  getSearchDemandReport(period: ReportPeriod, siteId?: string): Promise<SearchDemandReport> {
    return getAdapters().reports.getSearchDemandReport(period, siteId);
  },
  getCampaignReadinessReport(
    period: ReportPeriod,
    siteId?: string,
  ): Promise<CampaignReadinessReport> {
    return getAdapters().reports.getCampaignReadinessReport(period, siteId);
  },
  getConversionFunnelReport(
    period: ReportPeriod,
    siteId?: string,
  ): Promise<ConversionFunnelReport> {
    return getAdapters().reports.getConversionFunnelReport(period, siteId);
  },
  listReportInsights(period: ReportPeriod, siteId?: string): Promise<ReportInsight[]> {
    return getAdapters().reports.listReportInsights(period, siteId);
  },
  listReportRecommendations(
    period: ReportPeriod,
    siteId?: string,
  ): Promise<ReportRecommendation[]> {
    return getAdapters().reports.listReportRecommendations(period, siteId);
  },
  /** Single fetch for everything the reports screen needs for a period. */
  async getOverview(period: ReportPeriod, siteId?: string): Promise<ReportsOverview> {
    const reports = getAdapters().reports;
    const [
      providerStatus,
      readiness,
      executiveSummary,
      sales,
      productPerformance,
      customers,
      inventory,
      searchDemand,
      campaignReadiness,
      funnel,
      insights,
      recommendations,
    ] = await Promise.all([
      reports.getProviderStatus(),
      reports.getReadiness(),
      reports.getExecutiveSummary(period, siteId),
      reports.getSalesReport(period, siteId),
      reports.getProductPerformanceReport(period, siteId),
      reports.getCustomerReport(period, siteId),
      reports.getInventoryReport(period, siteId),
      reports.getSearchDemandReport(period, siteId),
      reports.getCampaignReadinessReport(period, siteId),
      reports.getConversionFunnelReport(period, siteId),
      reports.listReportInsights(period, siteId),
      reports.listReportRecommendations(period, siteId),
    ]);
    return {
      period,
      providerStatus,
      readiness,
      executiveSummary,
      sales,
      productPerformance,
      customers,
      inventory,
      searchDemand,
      campaignReadiness,
      funnel,
      insights,
      recommendations,
    };
  },
};
