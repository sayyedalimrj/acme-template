/**
 * HTTP Reports adapter — sales + executive summary from synced/API data; other sections
 * delegate to mock until dedicated report endpoints exist.
 */
import { minorToMoney } from '@/domain/money';
import { http } from '@/services/httpClient';
import type {
  AnalyticsProviderStatus,
  AnalyticsReadiness,
  CustomerReport,
  ExecutiveSummary,
  MetricTrend,
  ReportPeriod,
  SalesReport,
} from '@/domain/types';

import type { ReportsAnalyticsAdapter } from '../types';
import { createMockReportsAnalyticsAdapter } from '../mock/mockReportsAnalyticsAdapter';
import { getActiveHttpSiteId } from './httpActiveSite';

const mock = createMockReportsAnalyticsAdapter();

function periodToApi(period: ReportPeriod): { period: 'week' | 'month' | 'year'; range: '7d' | '30d' | '90d' } {
  switch (period) {
    case 'today':
    case 'last_7_days':
      return { period: 'week', range: '7d' };
    case 'this_month':
      return { period: 'month', range: '30d' };
    case 'last_30_days':
    default:
      return { period: 'month', range: '30d' };
  }
}

function siteId(explicit?: string): string {
  const id = explicit ?? getActiveHttpSiteId();
  if (!id) throw new Error('هیچ فروشگاهی انتخاب نشده است.');
  return id;
}

export function createHttpReportsAnalyticsAdapter(): ReportsAnalyticsAdapter {
  return {
    getProviderStatus(): Promise<AnalyticsProviderStatus> {
      return Promise.resolve('mock');
    },
    async getReadiness(): Promise<AnalyticsReadiness> {
      return {
        analyticsProvider: 'mock',
        wooCommerceReports: 'mock',
        ga4: 'not_connected',
        backendPipeline: 'mock',
        webhooks: 'planned',
        export: 'not_available',
      };
    },
    async getExecutiveSummary(period: ReportPeriod, siteIdArg?: string): Promise<ExecutiveSummary> {
      const sid = siteId(siteIdArg);
      const { range } = periodToApi(period);
      const [overviewRes, seriesRes] = await Promise.all([
        http.get<{
          site: { currency: string };
          overview: { orders: number; customers: number; completed_revenue_minor: number | string };
        }>(`/merchant/sites/${sid}/overview`),
        http.get<{
          currency: string;
          totals?: { orders: number; revenue_minor: number | string; new_customers: number };
        }>(`/merchant/sites/${sid}/reports/overview-series?range=${range}`),
      ]);
      const currency = seriesRes.currency ?? overviewRes.site.currency;
      const totals = seriesRes.totals;
      const revenue = minorToMoney(
        totals?.revenue_minor ?? overviewRes.overview.completed_revenue_minor,
        currency,
      );
      const orders = totals?.orders ?? overviewRes.overview.orders;
      const aov =
        orders > 0
          ? minorToMoney(Number(totals?.revenue_minor ?? 0) / orders, currency)
          : minorToMoney(0, currency);
      const trend: MetricTrend = 'flat';
      return {
        period,
        currency,
        grossSales: revenue,
        ordersCount: orders,
        averageOrderValue: aov,
        returningCustomers: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        campaignReadyAudiences: 0,
        searchOpportunities: 0,
        metrics: [
          { id: 'gross_sales', label: 'فروش', value: revenue, trend },
          { id: 'orders', label: 'سفارش‌ها', value: String(orders), trend },
        ],
      };
    },
    async getSalesReport(period: ReportPeriod, siteIdArg?: string): Promise<SalesReport> {
      const sid = siteId(siteIdArg);
      const { period: apiPeriod, range } = periodToApi(period);
      const [salesRes, seriesRes] = await Promise.all([
        http.get<{
          report: { currency: string; total_sales_minor?: number | string; total_orders?: number };
        }>(`/merchant/sites/${sid}/reports/sales?period=${apiPeriod}`),
        http.get<{
          currency: string;
          sales: { day: string; orders: number; revenue_minor: number | string }[];
          totals?: { orders: number; revenue_minor: number | string };
        }>(`/merchant/sites/${sid}/reports/overview-series?range=${range}`),
      ]);
      const currency = salesRes.report.currency ?? seriesRes.currency;
      const totalMinor = seriesRes.totals?.revenue_minor ?? salesRes.report.total_sales_minor ?? 0;
      const orders = seriesRes.totals?.orders ?? salesRes.report.total_orders ?? 0;
      const totalSales = minorToMoney(totalMinor, currency);
      const aov =
        orders > 0 ? minorToMoney(Number(totalMinor) / orders, currency) : minorToMoney(0, currency);
      const trendPoints = seriesRes.sales.map((row) => ({
        label: String(row.day).slice(5, 10),
        value: minorToMoney(row.revenue_minor, currency),
      }));
      return {
        period,
        currency,
        totalSales,
        ordersCount: orders,
        averageOrderValue: aov,
        trend: 'flat',
        trendPoints,
        byStatus: [],
      };
    },
    getProductPerformanceReport(period, siteIdArg) {
      return mock.getProductPerformanceReport(period, siteIdArg);
    },
    async getCustomerReport(period: ReportPeriod, siteIdArg?: string): Promise<CustomerReport> {
      const sid = siteId(siteIdArg);
      const overview = await http.get<{ overview: { customers: number } }>(
        `/merchant/sites/${sid}/overview`,
      );
      return {
        period,
        totalCustomers: overview.overview.customers,
        newCustomers: 0,
        repeatCustomers: 0,
        vipCustomers: 0,
        inactiveCustomers: 0,
        repeatRatePercent: 0,
        retentionOpportunity: '',
      };
    },
    getInventoryReport(period, siteIdArg) {
      return mock.getInventoryReport(period, siteIdArg);
    },
    getSearchDemandReport(period, siteIdArg) {
      return mock.getSearchDemandReport(period, siteIdArg);
    },
    getCampaignReadinessReport(period, siteIdArg) {
      return mock.getCampaignReadinessReport(period, siteIdArg);
    },
    getConversionFunnelReport(period, siteIdArg) {
      return mock.getConversionFunnelReport(period, siteIdArg);
    },
    listReportInsights(period, siteIdArg) {
      return mock.listReportInsights(period, siteIdArg);
    },
    listReportRecommendations(period, siteIdArg) {
      return mock.listReportRecommendations(period, siteIdArg);
    },
  };
}
