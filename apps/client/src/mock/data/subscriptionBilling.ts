/**
 * Mock subscription/billing data: per-plan pricing, the feature-comparison matrix, and the
 * merchant's current (mock) subscription.
 *
 * SECURITY: prices are DISPLAY-ONLY Persian labels — never a real charge. There is NO
 * payment-method data, NO card details, NO real billing/provider IDs, and NO secrets. Real
 * billing is a future backend + provider concern (see security-model.md). Plan identity
 * reuses the shared `subscriptionPlans` so labels stay consistent with onboarding.
 */
import type {
  BillingProviderStatus,
  CurrentSubscriptionSummary,
  PlanFeature,
  PlanPricing,
} from '@/domain/types';

/** A real billing provider is NOT wired — everything here is mock. */
export const billingProviderStatus: BillingProviderStatus = 'not_connected';

export const planPricing: PlanPricing[] = [
  {
    planId: 'starter',
    monthly: { amountLabel: 'رایگان', periodLabel: 'دوره آزمایشی' },
    yearly: { amountLabel: 'رایگان', periodLabel: 'دوره آزمایشی' },
  },
  {
    planId: 'growth',
    monthly: { amountLabel: '۴۹۰٬۰۰۰ تومان', periodLabel: 'ماهانه' },
    yearly: {
      amountLabel: '۴٬۹۰۰٬۰۰۰ تومان',
      periodLabel: 'سالانه',
      note: 'معادل ماهانه ۴۰۸٬۰۰۰ تومان',
    },
    savingsLabel: '۲ ماه رایگان',
  },
  {
    planId: 'pro',
    monthly: { amountLabel: '۹۹۰٬۰۰۰ تومان', periodLabel: 'ماهانه' },
    yearly: {
      amountLabel: '۹٬۹۰۰٬۰۰۰ تومان',
      periodLabel: 'سالانه',
      note: 'معادل ماهانه ۸۲۵٬۰۰۰ تومان',
    },
    savingsLabel: '۲ ماه رایگان',
  },
  {
    planId: 'managed',
    monthly: { amountLabel: 'تماس بگیرید', periodLabel: 'قیمت‌گذاری اختصاصی' },
    yearly: { amountLabel: 'تماس بگیرید', periodLabel: 'قیمت‌گذاری اختصاصی' },
  },
];

export const planFeatures: PlanFeature[] = [
  // Core — included on every plan.
  {
    id: 'feat_dashboard',
    category: 'core',
    label: 'داشبورد مدیریت',
    availability: { starter: 'included', growth: 'included', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_poc',
    category: 'core',
    label: 'مدیریت محصولات، سفارش‌ها و مشتریان',
    availability: { starter: 'included', growth: 'included', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_basic_inventory',
    category: 'core',
    label: 'موجودی پایه',
    availability: { starter: 'included', growth: 'included', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_connect_existing',
    category: 'core',
    label: 'درخواست اتصال سایت موجود',
    availability: { starter: 'included', growth: 'included', pro: 'included', managed: 'included' },
  },
  // Operations.
  {
    id: 'feat_inv_fulfillment',
    category: 'operations',
    label: 'گردش‌کار موجودی و آماده‌سازی ارسال',
    availability: { starter: 'none', growth: 'included', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_template_catalog',
    category: 'operations',
    label: 'دسترسی به گالری قالب‌ها',
    availability: { starter: 'none', growth: 'included', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_basic_analytics',
    category: 'operations',
    label: 'تحلیل‌های پایه فروش',
    availability: { starter: 'none', growth: 'included', pro: 'included', managed: 'included' },
  },
  // Growth / AI.
  {
    id: 'feat_ai_advisor',
    category: 'growth',
    label: 'مشاور هوش مصنوعی کسب‌وکار',
    availability: { starter: 'none', growth: 'limited', pro: 'later', managed: 'later' },
  },
  {
    id: 'feat_sms_backinstock',
    category: 'growth',
    label: 'پیامک و اطلاع موجودی',
    availability: { starter: 'none', growth: 'later', pro: 'later', managed: 'later' },
  },
  {
    id: 'feat_media_studio',
    category: 'growth',
    label: 'استودیوی رسانه محصول (هوش مصنوعی)',
    availability: { starter: 'none', growth: 'none', pro: 'later', managed: 'later' },
  },
  {
    id: 'feat_campaign_automation',
    category: 'growth',
    label: 'اتوماسیون کمپین',
    availability: { starter: 'none', growth: 'none', pro: 'later', managed: 'later' },
  },
  {
    id: 'feat_advanced_reports',
    category: 'growth',
    label: 'گزارش‌ها و تحلیل پیشرفته',
    availability: { starter: 'none', growth: 'none', pro: 'later', managed: 'later' },
  },
  // Managed services.
  {
    id: 'feat_managed_launch',
    category: 'managed',
    label: 'راه‌اندازی فروشگاه وردپرس مدیریت‌شده',
    availability: { starter: 'none', growth: 'none', pro: 'none', managed: 'included' },
  },
  {
    id: 'feat_setup_support',
    category: 'managed',
    label: 'راه‌اندازی و پشتیبانی نصب',
    availability: { starter: 'none', growth: 'none', pro: 'none', managed: 'included' },
  },
  {
    id: 'feat_handover',
    category: 'managed',
    label: 'پشتیبانی تحویل و راه‌اندازی فروشگاه',
    availability: { starter: 'none', growth: 'none', pro: 'none', managed: 'included' },
  },
  {
    id: 'feat_template_setup',
    category: 'managed',
    label: 'کمک به نصب و تنظیم قالب',
    availability: { starter: 'none', growth: 'none', pro: 'none', managed: 'included' },
  },
  // Support.
  {
    id: 'feat_support_basic',
    category: 'support',
    label: 'پشتیبانی پایه',
    availability: { starter: 'limited', growth: 'included', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_priority_support',
    category: 'support',
    label: 'پشتیبانی اولویت‌دار',
    availability: { starter: 'none', growth: 'none', pro: 'included', managed: 'included' },
  },
  {
    id: 'feat_managed_support',
    category: 'support',
    label: 'پشتیبانی مدیریت‌شده مداوم',
    availability: { starter: 'none', growth: 'none', pro: 'none', managed: 'later' },
  },
];

/** The merchant's current (mock) subscription — display-only, no real billing. */
export const currentSubscription: CurrentSubscriptionSummary = {
  planId: 'growth',
  planName: 'رشد',
  interval: 'monthly',
  priceLabel: '۴۹۰٬۰۰۰ تومان / ماهانه',
  status: 'trialing',
  renewalNote: 'در دوره آزمایشی هستید؛ هنوز هیچ پرداختی انجام نشده است.',
};
