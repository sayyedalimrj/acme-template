/**
 * Mock onboarding catalog: store templates + subscription plans.
 *
 * Demo data only — realistic WordPress/WooCommerce store templates across Persian retail
 * categories and a tiered plan placeholder. NO real theme assets are bundled or referenced
 * (preview images are placeholder labels), NO Ecme assets are copied, and there is NO real
 * billing — plan prices are display-only labels. Nothing here is ever sent to a network.
 */
import type { StoreTemplate, SubscriptionPlan } from '@/domain/types';

export const storeTemplates: StoreTemplate[] = [
  {
    id: 'tpl_pooshak_aurora',
    name: 'پوشاک آرورا',
    category: 'پوشاک',
    description:
      'قالبی مدرن و سبک برای فروشگاه‌های پوشاک با تمرکز بر تصاویر بزرگ و دسته‌بندی فصلی.',
    recommendedFor: 'بوتیک‌ها و برندهای پوشاک با مجموعه‌های فصلی',
    highlights: ['نمایش گالری‌محور محصولات', 'فیلتر اندازه و رنگ', 'صفحه مجموعه فصلی'],
    includedPages: ['خانه', 'فروشگاه', 'صفحه محصول', 'درباره ما', 'تماس', 'وبلاگ'],
    setupTimeLabel: '۳ تا ۵ روز کاری',
    previewLabel: 'پیش‌نمایش پوشاک آرورا',
    accent: 'primary',
    recommended: true,
    availability: 'available',
  },
  {
    id: 'tpl_beauty_lumen',
    name: 'آرایشی لومن',
    category: 'آرایشی و بهداشتی',
    description: 'قالبی لطیف و تمیز برای محصولات آرایشی و مراقبت پوست با تأکید بر اعتماد و برند.',
    recommendedFor: 'برندهای آرایشی، مراقبت پوست و عطر',
    highlights: ['بخش معرفی برند', 'نمایش ترکیبات و مزایا', 'نظرات مشتریان'],
    includedPages: ['خانه', 'فروشگاه', 'صفحه محصول', 'بلاگ زیبایی', 'تماس'],
    setupTimeLabel: '۴ تا ۶ روز کاری',
    requiredPlan: 'growth',
    previewLabel: 'پیش‌نمایش آرایشی لومن',
    accent: 'danger',
    availability: 'available',
  },
  {
    id: 'tpl_digital_mesa',
    name: 'کالای دیجیتال مزا',
    category: 'کالای دیجیتال',
    description:
      'قالبی پرمحتوا برای فروشگاه‌های کالای دیجیتال با جدول مشخصات فنی و مقایسه محصولات.',
    recommendedFor: 'فروشگاه‌های موبایل، لپ‌تاپ و لوازم جانبی',
    highlights: ['جدول مشخصات فنی', 'مقایسه محصولات', 'فیلتر پیشرفته'],
    includedPages: ['خانه', 'فروشگاه', 'صفحه محصول', 'مقایسه', 'پشتیبانی', 'تماس'],
    setupTimeLabel: '۵ تا ۷ روز کاری',
    requiredPlan: 'pro',
    previewLabel: 'پیش‌نمایش کالای دیجیتال مزا',
    accent: 'info',
    availability: 'available',
  },
  {
    id: 'tpl_home_atelier',
    name: 'خانه و دکور آتلیه',
    category: 'خانه و دکور',
    description: 'قالبی گرم و الهام‌بخش برای محصولات دکوراسیون منزل با چیدمان مجله‌ای.',
    recommendedFor: 'فروشگاه‌های دکوراسیون، مبلمان و صنایع‌دستی',
    highlights: ['چیدمان مجله‌ای', 'اتاق‌های الهام‌بخش', 'پیشنهاد ست‌های هماهنگ'],
    includedPages: ['خانه', 'فروشگاه', 'صفحه محصول', 'الهام', 'درباره ما', 'تماس'],
    setupTimeLabel: '۴ تا ۶ روز کاری',
    previewLabel: 'پیش‌نمایش خانه و دکور آتلیه',
    accent: 'warning',
    availability: 'available',
  },
  {
    id: 'tpl_food_trailhead',
    name: 'غذا و نوشیدنی ترِیل',
    category: 'غذا و نوشیدنی',
    description:
      'قالبی اشتهاآور برای فروشگاه‌های مواد غذایی و نوشیدنی با تمرکز بر تازگی و ارسال سریع.',
    recommendedFor: 'فروشگاه‌های مواد غذایی، قهوه و خوار‌بار',
    highlights: ['دسته‌بندی تازه‌ها', 'بسته‌های پیشنهادی', 'اطلاعات ارسال سریع'],
    includedPages: ['خانه', 'فروشگاه', 'صفحه محصول', 'دستورها', 'تماس'],
    setupTimeLabel: '۳ تا ۵ روز کاری',
    previewLabel: 'پیش‌نمایش غذا و نوشیدنی ترِیل',
    accent: 'success',
    availability: 'available',
  },
  {
    id: 'tpl_education_scholar',
    name: 'آموزشی اسکالر',
    category: 'آموزشی',
    description: 'قالبی برای فروش دوره‌ها و محصولات آموزشی با معرفی مدرس و سرفصل‌ها.',
    recommendedFor: 'مدرسان، آموزشگاه‌ها و فروشندگان محتوای آموزشی',
    highlights: ['معرفی دوره و مدرس', 'سرفصل‌های قابل گسترش', 'نظرات دانشجویان'],
    includedPages: ['خانه', 'دوره‌ها', 'صفحه دوره', 'درباره مدرس', 'تماس'],
    setupTimeLabel: '۵ تا ۷ روز کاری',
    requiredPlan: 'growth',
    previewLabel: 'پیش‌نمایش آموزشی اسکالر',
    accent: 'primary',
    availability: 'available',
  },
  {
    id: 'tpl_services_studio',
    name: 'خدماتی استودیو',
    category: 'خدماتی',
    description: 'قالبی حرفه‌ای برای کسب‌وکارهای خدماتی با رزرو نوبت و معرفی خدمات.',
    recommendedFor: 'سالن‌ها، کلینیک‌ها و ارائه‌دهندگان خدمات',
    highlights: ['معرفی خدمات', 'فرم درخواست نوبت', 'نمونه‌کارها'],
    includedPages: ['خانه', 'خدمات', 'نمونه‌کارها', 'درباره ما', 'تماس'],
    setupTimeLabel: '۴ تا ۶ روز کاری',
    previewLabel: 'پیش‌نمایش خدماتی استودیو',
    accent: 'info',
    availability: 'coming_soon',
  },
  {
    id: 'tpl_marketplace_bazaar',
    name: 'بازارگاه چندفروشنده',
    category: 'کالای دیجیتال',
    description: 'قالب پیشرفته بازارگاه چندفروشنده برای پلتفرم‌های فروش گسترده (به‌زودی).',
    recommendedFor: 'پلتفرم‌های چندفروشنده و بازارگاه‌ها',
    highlights: ['پنل چندفروشنده', 'مدیریت کمیسیون', 'جستجوی پیشرفته'],
    includedPages: ['خانه', 'فروشگاه', 'پنل فروشنده', 'صفحه محصول', 'تماس'],
    setupTimeLabel: '۱۰ تا ۱۴ روز کاری',
    requiredPlan: 'managed',
    previewLabel: 'پیش‌نمایش بازارگاه چندفروشنده',
    accent: 'warning',
    availability: 'coming_soon',
  },
];

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'پایه',
    priceLabel: 'رایگان در دوره آزمایشی',
    tagline: 'برای شروع و اتصال نخستین فروشگاه',
    features: ['داشبورد مدیریت یک فروشگاه', 'مدیریت محصولات و سفارش‌ها', 'پشتیبانی پایه'],
    supportSetupIncluded: false,
    growthChannelsLater: false,
  },
  {
    id: 'growth',
    name: 'رشد',
    priceLabel: 'صورت‌حساب بعداً',
    tagline: 'برای فروشگاه‌های در حال رشد',
    features: ['تا سه فروشگاه', 'گزارش‌های فروش', 'هشدارهای موجودی', 'راه‌اندازی با راهنمایی'],
    supportSetupIncluded: true,
    growthChannelsLater: true,
    recommended: true,
  },
  {
    id: 'pro',
    name: 'حرفه‌ای',
    priceLabel: 'صورت‌حساب بعداً',
    tagline: 'برای کسب‌وکارهای جدی و چندفروشگاهی',
    features: [
      'فروشگاه‌های نامحدود',
      'نقش‌ها و دسترسی تیمی',
      'گزارش‌های پیشرفته',
      'اولویت پشتیبانی',
    ],
    supportSetupIncluded: true,
    growthChannelsLater: true,
  },
  {
    id: 'managed',
    name: 'مدیریت‌شده',
    priceLabel: 'تماس بگیرید',
    tagline: 'راه‌اندازی و اداره کامل توسط تیم ما',
    features: [
      'راه‌اندازی کامل فروشگاه',
      'اداره عملیات توسط تیم ما',
      'مشاوره رشد اختصاصی',
      'پشتیبانی ویژه',
    ],
    supportSetupIncluded: true,
    growthChannelsLater: true,
  },
];

/** Convenience lookup used by mock adapter/screens. */
export function findTemplate(id: string): StoreTemplate | undefined {
  return storeTemplates.find((t) => t.id === id);
}

/** Convenience lookup used by mock adapter/screens. */
export function findPlan(id: string): SubscriptionPlan | undefined {
  return subscriptionPlans.find((p) => p.id === id);
}
