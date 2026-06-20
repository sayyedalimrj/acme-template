/**
 * Mock Customer Intelligence / event data.
 *
 * Realistic events + derived signals built from the existing mock catalog. Search terms
 * include both matches (existing products) and no-matches (demand for products you don't
 * sell yet); back-in-stock interest targets low/out-of-stock products.
 *
 * SECURITY/PRIVACY: no real tracking IDs, no cookies, no fingerprints, no analytics provider,
 * no external send, no secrets. Actors are mock customer labels or "anonymous" only.
 */
import type {
  AbandonedCartSignal,
  BackInStockInterest,
  CampaignConversionSignal,
  CommerceEvent,
  EventProviderStatus,
  EventTrackingReadiness,
  IntelligenceRecommendation,
  ProductInterestSignal,
  SearchDemandInsight,
} from '@/domain/types';

import { products } from './catalog';

/** No real tracking/analytics provider is wired — everything here is mock. */
export const eventProviderStatus: EventProviderStatus = 'not_connected';

export const eventTrackingReadiness: EventTrackingReadiness = {
  trackingProvider: 'not_connected',
  wordpressPlugin: 'not_connected',
  backendPipeline: 'not_connected',
  consentModel: 'planned',
  webhooks: 'planned',
};

const p = (i: number) => products[i % products.length];
const ANON = { kind: 'anonymous' as const, label: 'خریدار ناشناس' };
const SHOPPER_A = { kind: 'customer' as const, id: 'cust_201', label: 'مهدی رضایی' };
const SHOPPER_B = { kind: 'customer' as const, id: 'cust_202', label: 'سارا احمدی' };

export const commerceEvents: CommerceEvent[] = [
  {
    id: 'evt_1',
    type: 'site_search',
    source: 'search',
    actor: ANON,
    item: { searchTerm: p(0).name },
    createdAt: '2026-06-15T09:00:00Z',
  },
  {
    id: 'evt_2',
    type: 'site_search',
    source: 'search',
    actor: SHOPPER_A,
    item: { searchTerm: 'کفش پاشنه‌بلند مجلسی' },
    createdAt: '2026-06-15T09:05:00Z',
    note: 'بدون نتیجه — محصول موجود نیست.',
  },
  {
    id: 'evt_3',
    type: 'product_view',
    source: 'storefront',
    actor: SHOPPER_A,
    item: { productId: p(0).id, productName: p(0).name, sku: p(0).sku },
    createdAt: '2026-06-15T09:06:00Z',
  },
  {
    id: 'evt_4',
    type: 'add_to_cart',
    source: 'cart',
    actor: SHOPPER_A,
    item: { productId: p(0).id, productName: p(0).name, quantity: 1 },
    createdAt: '2026-06-15T09:07:00Z',
  },
  {
    id: 'evt_5',
    type: 'product_view',
    source: 'storefront',
    actor: SHOPPER_B,
    item: { productId: p(1).id, productName: p(1).name },
    createdAt: '2026-06-15T10:10:00Z',
  },
  {
    id: 'evt_6',
    type: 'add_to_cart',
    source: 'cart',
    actor: SHOPPER_B,
    item: { productId: p(1).id, productName: p(1).name, quantity: 2 },
    createdAt: '2026-06-15T10:12:00Z',
  },
  {
    id: 'evt_7',
    type: 'remove_from_cart',
    source: 'cart',
    actor: SHOPPER_B,
    item: { productId: p(1).id, productName: p(1).name, quantity: 1 },
    createdAt: '2026-06-15T10:13:00Z',
  },
  {
    id: 'evt_8',
    type: 'begin_checkout',
    source: 'checkout',
    actor: SHOPPER_A,
    createdAt: '2026-06-15T09:08:00Z',
  },
  {
    id: 'evt_9',
    type: 'purchase',
    source: 'checkout',
    actor: SHOPPER_A,
    item: { productId: p(0).id, productName: p(0).name, quantity: 1 },
    createdAt: '2026-06-15T09:10:00Z',
  },
  {
    id: 'evt_10',
    type: 'abandoned_cart',
    source: 'cart',
    actor: SHOPPER_B,
    item: { productId: p(1).id, productName: p(1).name },
    createdAt: '2026-06-15T10:40:00Z',
  },
  {
    id: 'evt_11',
    type: 'back_in_stock_subscribe',
    source: 'storefront',
    actor: ANON,
    item: { productId: p(2).id, productName: p(2).name },
    createdAt: '2026-06-15T11:00:00Z',
  },
  {
    id: 'evt_12',
    type: 'back_in_stock_subscribe',
    source: 'storefront',
    actor: SHOPPER_B,
    item: { productId: p(2).id, productName: p(2).name },
    createdAt: '2026-06-15T11:05:00Z',
  },
  {
    id: 'evt_13',
    type: 'campaign_click',
    source: 'campaign',
    actor: ANON,
    createdAt: '2026-06-15T12:00:00Z',
    note: 'کلیک روی کمپین تخفیف فصلی.',
  },
  {
    id: 'evt_14',
    type: 'campaign_conversion',
    source: 'campaign',
    actor: SHOPPER_A,
    item: { productId: p(3).id, productName: p(3).name },
    createdAt: '2026-06-15T12:20:00Z',
  },
  {
    id: 'evt_15',
    type: 'sms_click',
    source: 'sms',
    actor: SHOPPER_B,
    createdAt: '2026-06-15T13:00:00Z',
    note: 'پیشنهاد بازاریابی بر اساس رفتار خریداران.',
  },
  {
    id: 'evt_16',
    type: 'page_view',
    source: 'storefront',
    actor: ANON,
    createdAt: '2026-06-15T13:30:00Z',
  },
];

export const searchDemandInsights: SearchDemandInsight[] = [
  {
    id: 'sd_1',
    term: p(0).name,
    count: 42,
    matched: true,
    matchedProductId: p(0).id,
    matchedProductName: p(0).name,
    opportunity: 'campaign',
    suggestedAction: 'برای این محصول پرجستجو یک کمپین هدفمند اجرا کنید.',
  },
  {
    id: 'sd_2',
    term: 'کفش پاشنه‌بلند مجلسی',
    count: 28,
    matched: false,
    opportunity: 'add_product',
    suggestedAction: 'تقاضا برای محصولی که ندارید؛ افزودن آن را بررسی کنید.',
  },
  {
    id: 'sd_3',
    term: p(2).name,
    count: 19,
    matched: true,
    matchedProductId: p(2).id,
    matchedProductName: p(2).name,
    opportunity: 'restock',
    suggestedAction: 'محصول پرجستجو اما کم‌موجودی است؛ شارژ مجدد را در اولویت بگذارید.',
  },
  {
    id: 'sd_4',
    term: 'تیشرت نخی مردانه',
    count: 15,
    matched: false,
    opportunity: 'improve_naming',
    suggestedAction: 'احتمالاً محصول مشابه دارید؛ نام/برچسب محصول را بهبود دهید.',
  },
  {
    id: 'sd_5',
    term: 'ست هدیه',
    count: 12,
    matched: false,
    opportunity: 'add_product',
    suggestedAction: 'تقاضای ست هدیه؛ ساخت بسته پیشنهادی را بررسی کنید.',
  },
];

export const productInterestSignals: ProductInterestSignal[] = products
  .slice(0, 5)
  .map((product, index) => ({
    id: `pi_${product.id}`,
    productId: product.id,
    productName: product.name,
    views: [120, 96, 78, 54, 33][index] ?? 20,
    cartAdds: [34, 22, 11, 7, 3][index] ?? 1,
    backInStockSubscribers: index === 2 ? 14 : index === 4 ? 5 : 0,
    conversionSignal: index === 0 ? 'hot' : index < 3 ? 'warm' : 'cold',
  }));

export const backInStockInterests: BackInStockInterest[] = [
  {
    id: 'bis_1',
    productId: p(2).id,
    productName: p(2).name,
    subscribers: 14,
    stockStatus: 'ناموجود',
  },
  {
    id: 'bis_2',
    productId: p(4).id,
    productName: p(4).name,
    subscribers: 5,
    stockStatus: 'کم‌موجودی',
  },
];

export const abandonedCartSignals: AbandonedCartSignal[] = [
  {
    id: 'ac_1',
    actor: SHOPPER_B,
    items: [{ productId: p(1).id, productName: p(1).name, quantity: 1 }],
    estimatedValue: '۱,۲۵۰,۰۰۰',
    currency: 'تومان',
    lastActivity: '2026-06-15T10:40:00Z',
    recommendedFollowUp: 'یادآوری سبد خرید با پیشنهاد ارسال رایگان (نیازمند رضایت مشتری).',
  },
  {
    id: 'ac_2',
    actor: ANON,
    items: [
      { productId: p(3).id, productName: p(3).name, quantity: 1 },
      { productId: p(0).id, productName: p(0).name, quantity: 1 },
    ],
    estimatedValue: '۲,۱۰۰,۰۰۰',
    currency: 'تومان',
    lastActivity: '2026-06-14T18:20:00Z',
    recommendedFollowUp: 'کمپین بازگشت سبد برای خریداران ناشناس از طریق ریتارگتینگ (آینده).',
  },
];

export const campaignConversionSignals: CampaignConversionSignal[] = [
  { id: 'cc_1', campaign: 'تخفیف فصلی', clicks: 320, conversions: 41, readiness: 'ready' },
  { id: 'cc_2', campaign: 'معرفی محصولات جدید', clicks: 140, conversions: 9, readiness: 'warming' },
  { id: 'cc_3', campaign: 'اطلاع موجودی', clicks: 60, conversions: 2, readiness: 'low' },
];

export const intelligenceRecommendations: IntelligenceRecommendation[] = [
  {
    id: 'ir_search_demand',
    category: 'search_demand',
    title: 'پاسخ به تقاضای جستجوی بی‌نتیجه',
    summary: 'برخی جستجوها به محصولی نمی‌رسند؛ افزودن یا بهبود محصول فرصت فروش است.',
    priority: 'high',
    status: 'suggested',
    suggestedStep: 'فهرست جستجوهای بی‌نتیجه را بررسی کنید.',
  },
  {
    id: 'ir_restock',
    category: 'restock',
    title: 'شارژ مجدد محصولات پرتقاضا',
    summary: 'محصولات کم‌موجودی با جستجو و علاقه بالا را زودتر شارژ کنید.',
    priority: 'high',
    status: 'suggested',
    suggestedStep: 'موجودی محصولات پرتقاضا را بررسی کنید.',
    href: '/inventory',
  },
  {
    id: 'ir_abandoned',
    category: 'abandoned_cart',
    title: 'پیگیری سبدهای رهاشده',
    summary: 'سبدهای رهاشده ارزشمند آماده پیگیری‌اند (با رضایت مشتری).',
    priority: 'medium',
    status: 'suggested',
    suggestedStep: 'سبدهای رهاشده را مرور کنید.',
  },
  {
    id: 'ir_retention',
    category: 'retention',
    title: 'نگه‌داشت مشتریان فعال',
    summary: 'مشتریان با خرید تکراری را با پیشنهاد ویژه حفظ کنید.',
    priority: 'medium',
    status: 'suggested',
    suggestedStep: 'مشتریان ارزشمند را در صفحه مشتریان ببینید.',
    href: '/customers',
  },
  {
    id: 'ir_campaign',
    category: 'campaign',
    title: 'تقویت کمپین آماده تبدیل',
    summary: 'کمپین «تخفیف فصلی» نرخ تبدیل خوبی دارد؛ بودجه/دامنه آن را گسترش دهید.',
    priority: 'medium',
    status: 'suggested',
    suggestedStep: 'عملکرد کمپین‌ها را بازبینی کنید.',
  },
  {
    id: 'ir_content',
    category: 'content',
    title: 'بهبود محتوای محصولات پربازدید',
    summary: 'محصولات پربازدید با عکس/توضیح بهتر، تبدیل بیشتری می‌گیرند.',
    priority: 'low',
    status: 'suggested',
    suggestedStep: 'در استودیوی رسانه نسخه بهتر بسازید.',
    href: '/media-studio',
  },
  {
    id: 'ir_advisor',
    category: 'advisor',
    title: 'مشورت با مشاور هوشمند',
    summary: 'برای تبدیل این سیگنال‌ها به اقدام، از مشاور هوشمند کمک بگیرید.',
    priority: 'low',
    status: 'suggested',
    suggestedStep: 'مشاور هوشمند را باز کنید.',
    href: '/advisor',
  },
];
