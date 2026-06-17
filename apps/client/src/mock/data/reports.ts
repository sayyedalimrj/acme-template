/**
 * Mock Reports & Analytics data builders (Phase 7).
 *
 * Lightweight, deterministic reports derived from the EXISTING mock data (dashboard overview,
 * catalog, customers, orders, customer-intelligence signals, and automation drafts) so every
 * number stays self-consistent across the app. A small period factor scales flow metrics
 * (sales/orders/funnel) so changing the period updates values cheaply; store-state snapshots
 * (inventory, customers) stay stable.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real analytics provider, no GA4, no WooCommerce Reports API,
 * no tracking IDs/cookies, no API keys, no secrets, no export. Customer references use only
 * mock-safe labels — no extra PII. See security-model.md.
 */
import type {
  AnalyticsProviderStatus,
  AnalyticsReadiness,
  CampaignAudienceKind,
  CampaignReadinessAudience,
  CampaignReadinessReport,
  ConversionFunnelReport,
  CustomerReport,
  ExecutiveSummary,
  FunnelStep,
  InventoryReport,
  InventoryRestockEntry,
  Product,
  ProductPerformanceEntry,
  ProductPerformanceReport,
  ReportInsight,
  ReportMetric,
  ReportPeriod,
  ReportRecommendation,
  RestockPriority,
  SalesByStatusEntry,
  SalesReport,
  SearchDemandReport,
} from '@/domain/types';
import { formatCurrency, formatNumber } from '@/utils/format';

import { campaignDrafts } from './automation';
import { products } from './catalog';
import { customers } from './customers';
import { dashboardOverview } from './dashboard';
import { abandonedCartSignals, searchDemandInsights } from './intelligence';

/** No real analytics provider is wired — everything here is mock. */
export const analyticsProviderStatus: AnalyticsProviderStatus = 'not_connected';

export const analyticsReadiness: AnalyticsReadiness = {
  analyticsProvider: 'not_connected',
  wooCommerceReports: 'later',
  ga4: 'not_connected',
  backendPipeline: 'not_connected',
  webhooks: 'planned',
  export: 'planned',
};

const CURRENCY = dashboardOverview.currency;

// --- Period scaling --------------------------------------------------------

/** Flow-metric scale per period (snapshots like inventory/customers are not scaled). */
const PERIOD_FACTOR: Record<ReportPeriod, number> = {
  today: 0.04,
  last_7_days: 0.24,
  last_30_days: 1,
  this_month: 0.82,
  custom_later: 1,
};

/** Deterministic period-over-period change label + trend used on headline sales. */
const PERIOD_CHANGE: Record<ReportPeriod, { trend: 'up' | 'down' | 'flat'; label: string }> = {
  today: { trend: 'up', label: '+۸٪' },
  last_7_days: { trend: 'up', label: '+۱۲٪' },
  last_30_days: { trend: 'up', label: '+۹٪' },
  this_month: { trend: 'up', label: '+۶٪' },
  custom_later: { trend: 'flat', label: '۰٪' },
};

const scaleInt = (base: number, period: ReportPeriod): number =>
  Math.max(period === 'today' ? 0 : 1, Math.round(base * PERIOD_FACTOR[period]));

const scaleMoney = (base: number, period: ReportPeriod): string =>
  (base * PERIOD_FACTOR[period]).toFixed(2);

const money = (value: string): string => formatCurrency(value, CURRENCY);
const num = (value: number): string => formatNumber(value);

// --- Base figures (last_30_days reference) ---------------------------------

const BASE_GROSS = Number.parseFloat(dashboardOverview.salesTotal); // 48217.65
const BASE_ORDERS = dashboardOverview.ordersCount; // 1284
const aovValue = (gross: number, orders: number): string =>
  orders > 0 ? (gross / orders).toFixed(2) : '0.00';

// Customer segmentation derived from the mock customer book.
const repeatCustomers = customers.filter((c) => c.ordersCount > 1).length;
const vipCustomers = customers.filter((c) => Number.parseFloat(c.totalSpent) >= 600).length;
const newCustomers = customers.filter((c) => c.ordersCount <= 1).length;
const inactiveCustomers = customers.filter(
  (c) => !!c.lastOrderDate && c.lastOrderDate < '2026-06-12T00:00:00Z',
).length;

// Inventory snapshots from the dashboard overview + catalog.
const backorderCount = products.filter((p) => p.stockStatus === 'onbackorder').length;

// --- Helpers ---------------------------------------------------------------

const PERSIAN_STOCK_LABEL: Record<Product['stockStatus'], string> = {
  instock: 'کم‌موجودی',
  outofstock: 'ناموجود',
  onbackorder: 'سفارش معوق',
};

const stockRiskOf = (p: Product): 'none' | 'low' | 'out' => {
  if (p.stockStatus === 'outofstock' || p.stockStatus === 'onbackorder') return 'out';
  if (p.stockStatus === 'instock' && (p.stockQuantity ?? 0) <= 10) return 'low';
  return 'none';
};

const toPerformanceEntry = (
  p: Product,
  unitsSold: number,
  revenue: string,
  totalRevenue: number,
): ProductPerformanceEntry => ({
  productId: p.id,
  productName: p.name,
  sku: p.sku,
  unitsSold,
  revenue,
  revenueSharePercent:
    totalRevenue > 0 ? Math.round((Number.parseFloat(revenue) / totalRevenue) * 100) : 0,
  stockRisk: stockRiskOf(p),
  href: `/products/${p.id}`,
});

// --- Builders --------------------------------------------------------------

export function buildExecutiveSummary(period: ReportPeriod): ExecutiveSummary {
  const gross = scaleMoney(BASE_GROSS, period);
  const orders = scaleInt(BASE_ORDERS, period);
  const aov = aovValue(BASE_GROSS, BASE_ORDERS);
  const topProductName = dashboardOverview.topProducts[0]?.product.name;
  const campaignReadyAudiences = campaignDrafts.filter((d) => d.readiness === 'ready').length;
  const searchOpportunities = searchDemandInsights.filter(
    (s) => s.opportunity === 'add_product' || s.opportunity === 'restock',
  ).length;
  const change = PERIOD_CHANGE[period];

  const metrics: ReportMetric[] = [
    {
      id: 'gross_sales',
      label: 'فروش ناخالص',
      value: money(gross),
      trend: change.trend,
      changeLabel: change.label,
    },
    { id: 'orders', label: 'تعداد سفارش', value: num(orders), trend: change.trend },
    { id: 'aov', label: 'میانگین ارزش سفارش', value: money(aov), trend: 'flat' },
    {
      id: 'top_product',
      label: 'پرفروش‌ترین محصول',
      value: topProductName ?? '—',
      trend: 'up',
    },
    {
      id: 'returning_customers',
      label: 'مشتریان بازگشتی',
      value: num(repeatCustomers),
      trend: 'up',
    },
    {
      id: 'low_stock',
      label: 'کم‌موجودی/ناموجود',
      value: num(dashboardOverview.lowStockCount + dashboardOverview.outOfStockCount),
      trend: dashboardOverview.outOfStockCount > 0 ? 'down' : 'flat',
    },
    {
      id: 'campaign_ready',
      label: 'مخاطبان آماده کمپین',
      value: num(campaignReadyAudiences),
      trend: 'up',
    },
    {
      id: 'search_opportunities',
      label: 'فرصت‌های جستجو',
      value: num(searchOpportunities),
      trend: 'up',
    },
  ];

  return {
    period,
    currency: CURRENCY,
    grossSales: gross,
    ordersCount: orders,
    averageOrderValue: aov,
    topProductName,
    returningCustomers: repeatCustomers,
    lowStockCount: dashboardOverview.lowStockCount,
    outOfStockCount: dashboardOverview.outOfStockCount,
    campaignReadyAudiences,
    searchOpportunities,
    metrics,
  };
}

const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
// Daily revenue shape (sums to ~1) used to render the lightweight trend rows.
const DAILY_SHAPE = [0.11, 0.13, 0.12, 0.15, 0.14, 0.21, 0.14];

const STATUS_SHARES: { status: SalesByStatusEntry['status']; share: number }[] = [
  { status: 'completed', share: 0.63 },
  { status: 'processing', share: 0.22 },
  { status: 'on-hold', share: 0.05 },
  { status: 'pending', share: 0.045 },
  { status: 'refunded', share: 0.032 },
  { status: 'cancelled', share: 0.023 },
];

export function buildSalesReport(period: ReportPeriod): SalesReport {
  const grossNum = BASE_GROSS * PERIOD_FACTOR[period];
  const orders = scaleInt(BASE_ORDERS, period);
  const change = PERIOD_CHANGE[period];

  const trendPoints = WEEKDAYS.map((label, i) => ({
    label,
    value: (grossNum * DAILY_SHAPE[i]).toFixed(2),
  }));
  const bestIndex = DAILY_SHAPE.indexOf(Math.max(...DAILY_SHAPE));

  const byStatus: SalesByStatusEntry[] = STATUS_SHARES.map(({ status, share }) => ({
    status,
    orders: Math.max(0, Math.round(orders * share)),
    revenue: (grossNum * share).toFixed(2),
  }));

  return {
    period,
    currency: CURRENCY,
    totalSales: grossNum.toFixed(2),
    ordersCount: orders,
    averageOrderValue: aovValue(BASE_GROSS, BASE_ORDERS),
    trend: change.trend,
    changeLabel: change.label,
    bestDayLabel: WEEKDAYS[bestIndex],
    bestDaySales: (grossNum * DAILY_SHAPE[bestIndex]).toFixed(2),
    trendPoints,
    byStatus,
  };
}

export function buildProductPerformanceReport(period: ReportPeriod): ProductPerformanceReport {
  const factor = PERIOD_FACTOR[period];

  // Top products from the dashboard overview (already revenue-sorted).
  const topRaw = dashboardOverview.topProducts.map((entry) => ({
    product: entry.product,
    unitsSold: scaleInt(entry.unitsSold, period),
    revenue: (Number.parseFloat(entry.revenue) * factor).toFixed(2),
  }));
  const totalTopRevenue = topRaw.reduce((sum, e) => sum + Number.parseFloat(e.revenue), 0);
  const topProducts = topRaw.map((e) =>
    toPerformanceEntry(e.product, e.unitsSold, e.revenue, totalTopRevenue),
  );

  // Low performers: lowest lifetime sales (still published catalog items).
  const lowPerformers = [...products]
    .sort((a, b) => (a.totalSales ?? 0) - (b.totalSales ?? 0))
    .slice(0, 3)
    .map((p) => {
      const units = scaleInt(p.totalSales ?? 0, period);
      const revenue = (units * Number.parseFloat(p.price)).toFixed(2);
      return toPerformanceEntry(p, units, revenue, totalTopRevenue);
    });

  // Stock-risk products (out of stock / backorder / low).
  const stockRisk = products
    .filter((p) => stockRiskOf(p) !== 'none')
    .slice(0, 5)
    .map((p) => {
      const units = scaleInt(p.totalSales ?? 0, period);
      const revenue = (units * Number.parseFloat(p.price)).toFixed(2);
      return toPerformanceEntry(p, units, revenue, totalTopRevenue);
    });

  return { period, currency: CURRENCY, topProducts, lowPerformers, stockRisk };
}

export function buildCustomerReport(period: ReportPeriod): CustomerReport {
  const total = customers.length;
  const repeatRatePercent = total > 0 ? Math.round((repeatCustomers / total) * 100) : 0;
  return {
    period,
    totalCustomers: total,
    newCustomers,
    repeatCustomers,
    vipCustomers,
    inactiveCustomers,
    repeatRatePercent,
    retentionOpportunity:
      'مشتریان ارزشمند با خرید تکراری را با پیشنهاد قدردانی و کمپین بازگشت حفظ کنید.',
  };
}

export function buildInventoryReport(period: ReportPeriod): InventoryReport {
  const restockPriority: InventoryRestockEntry[] = dashboardOverview.inventoryAlerts.map((p) => {
    const risk = stockRiskOf(p);
    const priority: RestockPriority = risk === 'out' ? 'high' : 'medium';
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      stockStatus: PERSIAN_STOCK_LABEL[p.stockStatus],
      priority,
      href: `/products/${p.id}`,
    };
  });

  return {
    period,
    lowStock: dashboardOverview.lowStockCount,
    outOfStock: dashboardOverview.outOfStockCount,
    backorder: backorderCount,
    restockPriority,
  };
}

export function buildSearchDemandReport(period: ReportPeriod): SearchDemandReport {
  const topTerms = [...searchDemandInsights].sort((a, b) => b.count - a.count).slice(0, 5);
  const noMatchTerms = searchDemandInsights.filter((s) => !s.matched);
  const restockTerms = searchDemandInsights.filter((s) => s.opportunity === 'restock');
  return { period, topTerms, noMatchTerms, restockTerms };
}

const RULE_TO_AUDIENCE_KIND: Record<string, CampaignAudienceKind> = {
  back_in_stock_alert: 'back_in_stock',
  restock_announcement: 'back_in_stock',
  abandoned_cart_followup: 'abandoned_cart',
  vip_customer_reactivation: 'vip_reactivation',
  search_demand_campaign: 'search_demand',
  product_interest_followup: 'product_interest',
  low_stock_followup: 'product_interest',
  manual_campaign_draft: 'product_interest',
};

export function buildCampaignReadinessReport(period: ReportPeriod): CampaignReadinessReport {
  const audiences: CampaignReadinessAudience[] = campaignDrafts.map((d) => ({
    id: d.id,
    kind: RULE_TO_AUDIENCE_KIND[d.ruleType] ?? 'product_interest',
    label: d.audience.label,
    size: d.audience.size,
    consent: d.audience.consentReadiness,
    readiness: d.readiness,
  }));

  return {
    period,
    backInStockAudiences: audiences.filter((a) => a.kind === 'back_in_stock').length,
    abandonedCartCandidates: abandonedCartSignals.length,
    vipReactivationCandidates: vipCustomers,
    consentReadiness: 'planned',
    draftsReadyForReview: campaignDrafts.filter((d) => d.readiness === 'ready').length,
    audiences,
  };
}

// Base funnel shape for last_30_days (views ≫ purchase ⇒ ~3% conversion).
const BASE_FUNNEL: { step: FunnelStep['step']; label: string; count: number }[] = [
  { step: 'product_views', label: 'بازدید محصول', count: 42600 },
  { step: 'add_to_cart', label: 'افزودن به سبد', count: 9800 },
  { step: 'begin_checkout', label: 'شروع پرداخت', count: 3200 },
  { step: 'purchase', label: 'خرید', count: BASE_ORDERS },
  { step: 'abandoned_cart', label: 'سبد رهاشده', count: 1916 },
];

export function buildConversionFunnelReport(period: ReportPeriod): ConversionFunnelReport {
  const top = BASE_FUNNEL[0].count;
  const steps: FunnelStep[] = BASE_FUNNEL.map((s) => ({
    step: s.step,
    label: s.label,
    count: scaleInt(s.count, period),
    conversionPercent: top > 0 ? Math.round((s.count / top) * 1000) / 10 : 0,
  }));
  const purchase = BASE_FUNNEL.find((s) => s.step === 'purchase')?.count ?? 0;
  const abandoned = BASE_FUNNEL.find((s) => s.step === 'abandoned_cart')?.count ?? 0;
  return {
    period,
    steps,
    overallConversionPercent: top > 0 ? Math.round((purchase / top) * 1000) / 10 : 0,
    abandonedCartCount: scaleInt(abandoned, period),
  };
}

export const reportInsights: ReportInsight[] = [
  {
    id: 'rin_sales_up',
    category: 'sales',
    title: 'رشد فروش نسبت به دوره قبل',
    summary: 'فروش این دوره روند صعودی دارد؛ کمپین‌های مؤثر را ادامه دهید.',
    trend: 'up',
  },
  {
    id: 'rin_top_product',
    category: 'product',
    title: 'تمرکز فروش روی چند محصول',
    summary: 'سهم زیادی از درآمد از چند محصول پرفروش می‌آید؛ موجودی آن‌ها را تضمین کنید.',
    trend: 'up',
  },
  {
    id: 'rin_stock_risk',
    category: 'inventory',
    title: 'ریسک موجودی محصولات پرتقاضا',
    summary: 'چند محصول پرتقاضا کم‌موجودی یا ناموجود هستند و فروش از دست می‌رود.',
    trend: 'down',
  },
  {
    id: 'rin_search_gap',
    category: 'search',
    title: 'تقاضای جستجوی بی‌پاسخ',
    summary: 'برخی جستجوها به محصولی نمی‌رسند؛ فرصت افزودن یا نام‌گذاری بهتر وجود دارد.',
  },
  {
    id: 'rin_funnel_drop',
    category: 'funnel',
    title: 'افت در مرحله پرداخت',
    summary: 'بخش قابل‌توجهی از سبدها به خرید نمی‌رسند؛ تجربه پرداخت را بهبود دهید.',
    trend: 'down',
  },
  {
    id: 'rin_campaign_ready',
    category: 'campaign',
    title: 'مخاطبان آماده کمپین',
    summary: 'چند مخاطب آماده پیام‌رسانی هستند (با رعایت رضایت).',
    trend: 'up',
  },
];

export const reportRecommendations: ReportRecommendation[] = [
  {
    id: 'rr_restock',
    type: 'restock',
    title: 'شارژ مجدد محصولات پرتقاضا',
    summary: 'محصولات کم‌موجودی و ناموجود با تقاضای بالا را در اولویت شارژ قرار دهید.',
    priority: 'high',
    suggestedStep: 'فهرست موجودی را بررسی و سفارش شارژ ثبت کنید.',
    href: '/inventory',
  },
  {
    id: 'rr_campaign',
    type: 'run_campaign',
    title: 'اجرای کمپین برای تقاضای جستجو',
    summary: 'برای جستجوهای پرتکرار و مخاطبان آماده، کمپین هدفمند اجرا کنید.',
    priority: 'high',
    suggestedStep: 'پیش‌نویس‌های کمپین را بازبینی کنید.',
    href: '/automations',
  },
  {
    id: 'rr_abandoned',
    type: 'review_abandoned',
    title: 'پیگیری سبدهای رهاشده',
    summary: 'سبدهای رهاشده ارزشمند آماده پیگیری‌اند (با رضایت مشتری).',
    priority: 'medium',
    suggestedStep: 'سیگنال‌های سبد رهاشده را در هوش مشتریان ببینید.',
    href: '/intelligence',
  },
  {
    id: 'rr_copy',
    type: 'rewrite_copy',
    title: 'بازنویسی محتوای محصولات کم‌فروش',
    summary: 'توضیح و عنوان محصولات کم‌فروش را برای بهبود تبدیل بازنویسی کنید.',
    priority: 'low',
    suggestedStep: 'برای محصولات کلیدی توضیح بهتر آماده کنید.',
    href: '/advisor',
  },
  {
    id: 'rr_media',
    type: 'improve_media',
    title: 'بهبود رسانه محصولات ضعیف',
    summary: 'کیفیت عکس محصولات کم‌تبدیل را در استودیوی رسانه بهبود دهید.',
    priority: 'low',
    suggestedStep: 'محصولات با عکس ضعیف را در استودیوی رسانه بسازید.',
    href: '/media-studio',
  },
  {
    id: 'rr_fulfillment',
    type: 'prioritize_fulfillment',
    title: 'اولویت‌بندی پردازش سفارش‌ها',
    summary: 'سفارش‌های در انتظار را برای رضایت مشتری زودتر پردازش کنید.',
    priority: 'medium',
    suggestedStep: 'صف آماده‌سازی ارسال را بررسی کنید.',
    href: '/fulfillment',
  },
];
