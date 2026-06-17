/**
 * Mock AI Business Advisor data: store-context summary, insights, recommendations, prompt
 * chips, and an initial conversation.
 *
 * The context summary is grounded in existing mock data (dashboard overview + current
 * subscription) so the numbers stay self-consistent. Insights/recommendations/prompts are
 * realistic Persian content.
 *
 * SECURITY: no AI provider, no API keys, no secrets, no customer PII. Every recommendation is
 * review-only; actions never publish or mutate anything (see security-model.md).
 */
import type {
  AIAdvisorConversationMessage,
  AIAdvisorInsight,
  AIAdvisorProviderStatus,
  AIAdvisorPromptSuggestion,
  AIAdvisorRecommendation,
  AIAdvisorStoreContextSummary,
} from '@/domain/types';

import { dashboardOverview } from './dashboard';
import { currentSubscription } from './subscriptionBilling';

/** No real AI provider is wired — everything here is mock. */
export const advisorProviderStatus: AIAdvisorProviderStatus = 'not_connected';

/** Build a frontend-safe store-context snapshot from existing mock data. */
export function buildStoreContext(): AIAdvisorStoreContextSummary {
  const { fulfillment, topProducts } = dashboardOverview;
  return {
    storeName: 'فروشگاه نمونه',
    currency: dashboardOverview.currency,
    salesTotal: dashboardOverview.salesTotal,
    ordersCount: dashboardOverview.ordersCount,
    productsCount: dashboardOverview.productsCount,
    customersCount: dashboardOverview.customersCount,
    lowStockCount: dashboardOverview.lowStockCount,
    outOfStockCount: dashboardOverview.outOfStockCount,
    fulfillmentPending: fulfillment.unfulfilled + fulfillment.partial,
    topProductName: topProducts[0]?.product.name,
    planId: currentSubscription.planId,
    planName: currentSubscription.planName,
  };
}

export const advisorInsights: AIAdvisorInsight[] = [
  {
    id: 'ins_top_product',
    title: 'محصول پرفروش این هفته',
    summary: 'یک محصول سهم بالایی از فروش اخیر را داشته است؛ آن را برجسته کنید.',
    priority: 'medium',
    related: { kind: 'product', label: 'پرفروش‌ترین محصول', href: '/products' },
    suggestedStep: 'محصول پرفروش را در صفحه نخست و کمپین‌ها برجسته کنید.',
  },
  {
    id: 'ins_low_stock',
    title: 'محصول کم‌موجودی',
    summary: 'چند محصول به آستانه اتمام موجودی رسیده‌اند و ممکن است فروش از دست برود.',
    priority: 'high',
    related: { kind: 'inventory', label: 'موجودی', href: '/inventory' },
    suggestedStep: 'برای پرفروش‌های کم‌موجودی سفارش شارژ مجدد ثبت کنید.',
  },
  {
    id: 'ins_pending_orders',
    title: 'سفارش‌های در انتظار ارسال',
    summary: 'تعدادی سفارش هنوز آماده‌سازی یا ارسال نشده‌اند.',
    priority: 'high',
    related: { kind: 'orders', label: 'سفارش‌ها', href: '/orders' },
    suggestedStep: 'صف آماده‌سازی ارسال را بررسی و سفارش‌های در انتظار را پردازش کنید.',
  },
  {
    id: 'ins_valuable_customers',
    title: 'مشتریان ارزشمند',
    summary: 'گروهی از مشتریان خریدهای تکراری و ارزش بالایی دارند.',
    priority: 'medium',
    related: { kind: 'customer', label: 'مشتریان', href: '/customers' },
    suggestedStep: 'یک کمپین قدردانی برای مشتریان وفادار طراحی کنید.',
  },
  {
    id: 'ins_winback',
    title: 'فرصت کمپین بازگشت مشتری',
    summary: 'بخشی از مشتریان مدتی است خریدی نداشته‌اند.',
    priority: 'medium',
    suggestedStep: 'یک کمپین بازگشت مشتری با پیشنهاد ویژه آماده کنید.',
  },
  {
    id: 'ins_copy_gap',
    title: 'فرصت بهبود توضیح محصول',
    summary: 'برخی محصولات توضیح کوتاه یا ناقص دارند که بر تبدیل اثر می‌گذارد.',
    priority: 'low',
    related: { kind: 'product', label: 'محصولات', href: '/products' },
    suggestedStep: 'برای محصولات کلیدی توضیح غنی‌تر و سئو بهتر آماده کنید.',
  },
  {
    id: 'ins_oos_demand',
    title: 'تقاضای احتمالی برای محصول ناموجود',
    summary: 'محصولات ناموجود ممکن است تقاضای برآورده‌نشده داشته باشند.',
    priority: 'medium',
    related: { kind: 'inventory', label: 'موجودی', href: '/inventory' },
    suggestedStep: 'کمپین «اطلاع موجودی» برای محصولات ناموجود آماده کنید.',
  },
];

export const advisorRecommendations: AIAdvisorRecommendation[] = [
  // A. Sales & product performance
  {
    id: 'rec_best_worst',
    type: 'sales_insight',
    category: 'sales',
    title: 'شناسایی بهترین و ضعیف‌ترین محصولات',
    summary: 'پرفروش‌ها را تقویت و برای کم‌فروش‌ها بازبینی یا حذف را بررسی کنید.',
    priority: 'medium',
    status: 'suggested',
    related: { kind: 'product', label: 'محصولات', href: '/products' },
    suggestedStep: 'گزارش فروش محصولات را مرور کنید.',
    actions: [
      { kind: 'view_product', targetHref: '/products' },
      { kind: 'mark_reviewed' },
      { kind: 'dismiss' },
    ],
  },
  {
    id: 'rec_cross_sell',
    type: 'sales_insight',
    category: 'sales',
    title: 'پیشنهاد بسته و فروش مکمل',
    summary: 'محصولات مرتبط را به‌صورت بسته یا پیشنهاد مکمل ارائه کنید.',
    priority: 'medium',
    status: 'suggested',
    related: { kind: 'product', label: 'محصولات', href: '/products' },
    suggestedStep: 'یک بسته پیشنهادی برای پرفروش‌ها بسازید.',
    actions: [
      { kind: 'view_product', targetHref: '/products' },
      { kind: 'mark_reviewed' },
      { kind: 'dismiss' },
    ],
  },
  {
    id: 'rec_review_reports',
    type: 'sales_insight',
    category: 'sales',
    title: 'بررسی گزارش‌ها و تحلیل فروشگاه',
    summary: 'برای دید کلی از فروش، محصولات، مشتریان و قیف تبدیل، گزارش‌ها را مرور کنید.',
    priority: 'medium',
    status: 'suggested',
    related: { kind: 'orders', label: 'گزارش‌ها', href: '/reports' },
    suggestedStep: 'صفحه گزارش و تحلیل را باز کنید.',
    actions: [
      { kind: 'view_reports', targetHref: '/reports' },
      { kind: 'mark_reviewed' },
      { kind: 'dismiss' },
    ],
  },
  {
    id: 'rec_price_review',
    type: 'pricing_suggestion',
    category: 'sales',
    title: 'بازبینی قیمت محصولات کم‌فروش',
    summary: 'قیمت‌گذاری محصولات کم‌فروش را برای بهبود تبدیل بازبینی کنید.',
    priority: 'low',
    status: 'suggested',
    related: { kind: 'product', label: 'محصولات', href: '/products' },
    suggestedStep: 'قیمت چند محصول کم‌فروش را بازبینی کنید.',
    actions: [{ kind: 'view_product', targetHref: '/products' }, { kind: 'dismiss' }],
  },
  // B. Inventory & fulfillment
  {
    id: 'rec_restock',
    type: 'restock_action',
    category: 'inventory',
    title: 'پیشنهاد شارژ مجدد موجودی',
    summary: 'برای محصولات کم‌موجودی و پرفروش سفارش شارژ مجدد ثبت کنید.',
    priority: 'high',
    status: 'suggested',
    related: { kind: 'inventory', label: 'موجودی', href: '/inventory' },
    suggestedStep: 'فهرست کم‌موجودی را بررسی کنید.',
    actions: [
      { kind: 'view_inventory', targetHref: '/inventory' },
      { kind: 'mark_reviewed' },
      { kind: 'dismiss' },
    ],
  },
  {
    id: 'rec_fulfillment_followup',
    type: 'support_followup',
    category: 'inventory',
    title: 'پیگیری سفارش‌های در انتظار',
    summary: 'سفارش‌های در صف آماده‌سازی را پردازش و پیگیری کنید.',
    priority: 'high',
    status: 'suggested',
    related: { kind: 'orders', label: 'سفارش‌ها', href: '/orders' },
    suggestedStep: 'صف آماده‌سازی ارسال را بررسی کنید.',
    actions: [
      { kind: 'view_orders', targetHref: '/orders' },
      { kind: 'mark_reviewed' },
      { kind: 'dismiss' },
    ],
  },
  // C. Marketing & campaigns
  {
    id: 'rec_sms_campaign',
    type: 'campaign_idea',
    category: 'marketing',
    title: 'کمپین پیامکی فروش',
    summary: 'یک کمپین پیامکی برای پیشنهاد ویژه آماده‌سازی کنید (ارسال نیازمند تأیید بعدی).',
    priority: 'medium',
    status: 'suggested',
    suggestedStep: 'پیش‌نویس کمپین را بازبینی کنید.',
    actions: [{ kind: 'review_campaign' }, { kind: 'dismiss' }],
  },
  {
    id: 'rec_backinstock_campaign',
    type: 'campaign_idea',
    category: 'marketing',
    title: 'کمپین اطلاع موجودی',
    summary: 'به مشتریان علاقه‌مند هنگام شارژ مجدد محصولات ناموجود اطلاع دهید.',
    priority: 'medium',
    status: 'suggested',
    related: { kind: 'inventory', label: 'موجودی', href: '/inventory' },
    suggestedStep: 'محصولات ناموجود پرتقاضا را انتخاب کنید.',
    actions: [{ kind: 'review_campaign' }, { kind: 'dismiss' }],
  },
  {
    id: 'rec_vip_campaign',
    type: 'customer_retention',
    category: 'marketing',
    title: 'کمپین مشتریان ویژه (VIP)',
    summary: 'برای مشتریان وفادار پیشنهاد قدردانی یا تخفیف اختصاصی طراحی کنید.',
    priority: 'medium',
    status: 'suggested',
    related: { kind: 'customer', label: 'مشتریان', href: '/customers' },
    suggestedStep: 'فهرست مشتریان ارزشمند را بازبینی کنید.',
    actions: [{ kind: 'review_campaign' }, { kind: 'dismiss' }],
  },
  // D. Content & SEO
  {
    id: 'rec_desc_rewrite',
    type: 'product_copy',
    category: 'content',
    title: 'بازنویسی توضیح محصول',
    summary: 'برای محصولات با توضیح کوتاه، پیش‌نویس توضیح غنی‌تر آماده می‌شود.',
    priority: 'low',
    status: 'suggested',
    related: { kind: 'product', label: 'محصولات', href: '/products' },
    suggestedStep: 'پیش‌نویس توضیح را بازبینی کنید.',
    actions: [
      { kind: 'draft_copy' },
      { kind: 'view_product', targetHref: '/products' },
      { kind: 'dismiss' },
    ],
  },
  {
    id: 'rec_seo',
    type: 'seo_suggestion',
    category: 'content',
    title: 'پیشنهاد عنوان و متای سئو',
    summary: 'عنوان و توضیح متای بهینه برای دیده‌شدن بهتر در جستجو پیشنهاد می‌شود.',
    priority: 'low',
    status: 'suggested',
    suggestedStep: 'پیش‌نویس سئو را بازبینی کنید.',
    actions: [{ kind: 'draft_copy' }, { kind: 'dismiss' }],
  },
  // E. AI Product Media Studio ideas (future, placeholder)
  {
    id: 'rec_media_cleanup',
    type: 'media_studio_idea',
    category: 'media',
    title: 'بهبود عکس‌های کم‌کیفیت محصول',
    summary:
      'استودیوی رسانه (به‌زودی) می‌تواند کیفیت عکس‌ها را بهبود دهد و پس‌زمینه را پاک‌سازی کند.',
    priority: 'low',
    status: 'suggested',
    related: { kind: 'product', label: 'محصولات', href: '/products' },
    suggestedStep: 'محصولات با عکس ضعیف را علامت بزنید (استودیو بعداً فعال می‌شود).',
    actions: [{ kind: 'open_media_studio', targetHref: '/media-studio' }, { kind: 'dismiss' }],
  },
  {
    id: 'rec_media_hero_video',
    type: 'media_studio_idea',
    category: 'media',
    title: 'تصویر شاخص و ویدئوی کوتاه تبلیغاتی',
    summary: 'ایده تصویر شاخص حرفه‌ای و ویدئوی کوتاه برای محصولات کلیدی (به‌زودی).',
    priority: 'low',
    status: 'suggested',
    suggestedStep: 'محصولات کلیدی برای محتوای تبلیغاتی را انتخاب کنید.',
    actions: [{ kind: 'open_media_studio', targetHref: '/media-studio' }, { kind: 'dismiss' }],
  },
];

export const advisorPromptSuggestions: AIAdvisorPromptSuggestion[] = [
  { id: 'p_sales', text: 'امروز برای افزایش فروش چه کار کنم؟' },
  { id: 'p_inventory', text: 'کدام محصولات نیاز به موجودی دارند؟' },
  { id: 'p_vip', text: 'برای مشتریان VIP چه کمپینی پیشنهاد می‌کنی؟' },
  { id: 'p_copy', text: 'برای این محصول توضیح بهتر بنویس' },
  { id: 'p_sms', text: 'برای محصول ناموجود کمپین پیامکی پیشنهاد بده' },
  { id: 'p_media', text: 'ایده عکس و ویدئوی تبلیغاتی برای محصولات بده' },
];

export const advisorInitialConversation: AIAdvisorConversationMessage[] = [
  {
    id: 'msg_welcome',
    role: 'assistant',
    text: 'سلام! من مشاور هوشمند نمونه شما هستم. می‌توانم درباره فروش، موجودی، کمپین‌ها و بهبود محتوای محصولات کمک کنم. (نسخه نمایشی؛ بدون اتصال به هوش مصنوعی واقعی.)',
    createdAt: '2026-06-16T08:00:00Z',
  },
];
