import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { reportsAnalyticsService } from '@/services';

// No real analytics/provider IDs, keys, or secrets may ever appear in reports output.
const FORBIDDEN_KEYS = [
  'measurementid',
  'trackingid',
  'apikey',
  'api_key',
  'secret',
  'consumerkey',
  'consumersecret',
  'clientid',
  'accesstoken',
  'gtag',
];

beforeEach(() => {
  resetAdaptersForTests();
});

describe('reports & analytics service (mock)', () => {
  it('reports no real analytics provider connected (no GA4)', async () => {
    const status = await reportsAnalyticsService.getProviderStatus();
    const readiness = await reportsAnalyticsService.getReadiness();
    expect(status).toBe('not_connected');
    expect(readiness.analyticsProvider).toBe('not_connected');
    expect(readiness.ga4).toBe('not_connected');
    expect(readiness.export).toBe('planned');
  });

  it('returns an executive summary with headline KPIs', async () => {
    const summary = await reportsAnalyticsService.getExecutiveSummary('last_30_days');
    expect(Number.parseFloat(summary.grossSales)).toBeGreaterThan(0);
    expect(summary.ordersCount).toBeGreaterThan(0);
    expect(summary.metrics.length).toBeGreaterThan(0);
    expect(summary.metrics.some((m) => m.id === 'gross_sales')).toBe(true);
  });

  it('builds a conversion funnel with the expected ordered steps', async () => {
    const funnel = await reportsAnalyticsService.getConversionFunnelReport('last_30_days');
    expect(funnel.steps.map((s) => s.step)).toEqual([
      'product_views',
      'add_to_cart',
      'begin_checkout',
      'purchase',
      'abandoned_cart',
    ]);
    // Views are the top of the funnel; purchases are fewer than views.
    const views = funnel.steps[0].count;
    const purchases = funnel.steps.find((s) => s.step === 'purchase')?.count ?? 0;
    expect(purchases).toBeLessThan(views);
    expect(funnel.overallConversionPercent).toBeGreaterThan(0);
  });

  it('includes no-match and restock opportunities in the search demand report', async () => {
    const search = await reportsAnalyticsService.getSearchDemandReport('last_30_days');
    expect(search.noMatchTerms.length).toBeGreaterThan(0);
    expect(search.noMatchTerms.every((s) => !s.matched)).toBe(true);
    expect(search.restockTerms.some((s) => s.opportunity === 'restock')).toBe(true);
  });

  it('includes back-in-stock and abandoned-cart readiness in the campaign report', async () => {
    const campaign = await reportsAnalyticsService.getCampaignReadinessReport('last_30_days');
    expect(campaign.backInStockAudiences).toBeGreaterThan(0);
    expect(campaign.abandonedCartCandidates).toBeGreaterThan(0);
    expect(campaign.audiences.some((a) => a.kind === 'back_in_stock')).toBe(true);
    // Consent is never auto-collected — it is only planned.
    expect(campaign.consentReadiness).toBe('planned');
  });

  it('scales flow metrics down for a shorter period', async () => {
    const month = await reportsAnalyticsService.getSalesReport('last_30_days');
    const today = await reportsAnalyticsService.getSalesReport('today');
    expect(Number.parseFloat(today.totalSales)).toBeLessThan(Number.parseFloat(month.totalSales));
  });

  it('exposes no real analytics IDs, API keys, or secrets', async () => {
    const overview = await reportsAnalyticsService.getOverview('last_30_days');
    const json = JSON.stringify(overview).toLowerCase();
    FORBIDDEN_KEYS.forEach((k) => expect(json).not.toContain(k));
  });
});
