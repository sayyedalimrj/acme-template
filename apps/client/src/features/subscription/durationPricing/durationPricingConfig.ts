/**
 * durationPricingConfig — تنها فایلی که برای ویرایش جدول تعرفه لازم داری.
 * (The ONE file you edit to change the duration-based pricing table.)
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ راهنمای ویرایش سریع (HOW TO EDIT)                                          │
 * │                                                                           │
 * │ ۱) قیمت پایه‌ی یک‌ماهه را در `basePriceMonthly` بگذار. قیمت همه‌ی مدت‌ها    │
 * │    خودکار از روی همین + درصد تخفیف هر ستون حساب می‌شود.                     │
 * │ ۲) درصد تخفیف هر مدت را در `durations[].discountPercent` عوض کن.            │
 * │ ۳) یک ردیف جدید = یک عضو جدید در آرایه‌ی `features`. کافی است یک ردیف        │
 * │    موجود را کپی کنی و مقدارها را عوض کنی.                                   │
 * │ ۴) تیک یا ضرب: مقدار هر خانه را `true` (تیک ✓) یا `false` (ضرب ✕) بگذار.    │
 * │    اگر متن بخواهی (مثل «۳ کاربر» یا «۲۴ ساعته») همان متن را بنویس.          │
 * │ ۵) الگوی «روی یک‌ماهه نباشد، ۳ و ۶ یکسان، ۱۲ بهتر» را با مقادیر هر ستون     │
 * │    می‌سازی؛ مثال‌ها پایین آمده است.                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * SECURITY: این داده فقط نمایشی است (مثل بقیه‌ی mockهای پلن). هیچ پرداخت واقعی،
 * شماره کارت، کلید/سکرت یا شناسه‌ی درگاه اینجا نیست؛ صورت‌حساب واقعی بعداً سمت
 * بک‌اند/درگاه انجام می‌شود (security-model.md).
 */

/**
 * شناسه‌ی ستون‌ها (مدت اشتراک). ترتیب نمایش از روی همین آرایه است.
 * اگر مدت جدیدی خواستی، اینجا کلیدش را اضافه کن و بعد در `durations` و در
 * `values` همه‌ی ردیف‌ها همان کلید را پر کن (TypeScript یادآوری می‌کند).
 */
export const DURATION_KEYS = ['m1', 'm3', 'm6', 'm12'] as const;
export type DurationKey = (typeof DURATION_KEYS)[number];

/** مقدار یک خانه‌ی جدول: تیک (true)، ضرب (false)، یا یک متن کوتاه. */
export type CellValue = boolean | string;

/** یک ستون مدت‌دار (مثلاً «۱۲ ماهه»). */
export interface DurationPlan {
  key: DurationKey;
  /** تعداد ماه‌ها — مبنای ضرب قیمت پایه. */
  months: number;
  /** عنوان ستون که بالای جدول نمایش داده می‌شود. */
  label: string;
  /** درصد تخفیف نسبت به قیمت پایه‌ی ماهانه (۰ تا ۱۰۰). */
  discountPercent: number;
  /** برچسب اختیاری بالای ستون، مثل «محبوب» یا «بهترین انتخاب». */
  badge?: string;
  /** اگر true باشد این ستون پررنگ/ویژه نمایش داده می‌شود. */
  highlight?: boolean;
}

/** یک ردیف از جدول (یک امکان/قابلیت). */
export interface FeatureRow {
  /** عنوان امکان (سمت راست ردیف). */
  label: string;
  /** عنوان دسته‌ی اختیاری؛ ردیف‌های هم‌دسته زیر یک سرفصل گروه می‌شوند. */
  group?: string;
  /** مقدار هر ستون: true=تیک، false=ضرب، یا متن کوتاه. همه‌ی کلیدها لازم است. */
  values: Record<DurationKey, CellValue>;
}

/** کل پیکربندی جدول تعرفه. */
export interface DurationPricingConfig {
  /** نام تنها اشتراک محصول (یک اشتراک، چند مدت). */
  subscriptionName: string;
  /** زیرعنوان کوتاه زیر نام اشتراک. */
  subscriptionTagline: string;
  /** قیمت پایه‌ی «یک ماه» بدون تخفیف (به تومان). مبنای محاسبه‌ی همه‌ی مدت‌ها. */
  basePriceMonthly: number;
  /**
   * قیمت‌های محاسبه‌شده به نزدیک‌ترین مضرب این عدد گرد می‌شوند (تومان).
   * برای قیمت‌های «خوش‌دست» معمولاً ۱۰۰۰. برای گردنکردن، ۱ بگذار.
   */
  priceRoundingStep: number;
  /** ستون‌ها (مدت‌ها) به ترتیب نمایش. */
  durations: DurationPlan[];
  /** ردیف‌های جدول (امکانات). */
  features: FeatureRow[];
  /** متن‌های ثابت رابط کاربری — همه‌ی نوشته‌های قابل‌ویرایش یک‌جا. */
  labels: {
    /** عنوان ستون اول/سرستون‌ها. */
    featureColumn: string;
    /** پسوند واحد پول، مثل «تومان». */
    currencySuffix: string;
    /** پیشوند درصد تخفیف، مثل «٪». */
    discountPrefix: string;
    /** متن «هر ماه» برای قیمت ماهانه‌ی مؤثر. */
    perMonth: string;
    /** متن کنار قیمت کل، مثل «کل دوره». */
    totalLabel: string;
    /** توضیح تیک در راهنما. */
    legendIncluded: string;
    /** توضیح ضرب در راهنما. */
    legendExcluded: string;
  };
}

/**
 * ============================================================================
 *  داده‌ی قابل‌ویرایش (EDIT BELOW)
 * ============================================================================
 */
export const durationPricingConfig: DurationPricingConfig = {
  subscriptionName: 'اشتراک حرفه‌ای',
  subscriptionTagline: 'یک اشتراک، با تخفیف بیشتر برای مدت طولانی‌تر',
  basePriceMonthly: 690_000,
  priceRoundingStep: 1_000,

  // ── ستون‌ها: هرچه مدت بلندتر، تخفیف بیشتر. درصدها را آزادانه عوض کن. ──
  durations: [
    { key: 'm1', months: 1, label: 'یک‌ماهه', discountPercent: 0 },
    { key: 'm3', months: 3, label: 'سه‌ماهه', discountPercent: 10 },
    { key: 'm6', months: 6, label: 'شش‌ماهه', discountPercent: 20, badge: 'محبوب' },
    {
      key: 'm12',
      months: 12,
      label: 'دوازده‌ماهه',
      discountPercent: 35,
      badge: 'بهترین انتخاب',
      highlight: true,
    },
  ],

  // ── ردیف‌ها: برای ردیف جدید، یک خط را کپی کن. تیک=true، ضرب=false، یا متن. ──
  features: [
    // گروه: امکانات اصلی (روی همه‌ی مدت‌ها یکسان است).
    {
      group: 'امکانات اصلی',
      label: 'داشبورد مدیریت فروشگاه',
      values: { m1: true, m3: true, m6: true, m12: true },
    },
    {
      group: 'امکانات اصلی',
      label: 'مدیریت محصولات و سفارش‌ها',
      values: { m1: true, m3: true, m6: true, m12: true },
    },
    {
      group: 'امکانات اصلی',
      label: 'مدیریت مشتریان',
      values: { m1: true, m3: true, m6: true, m12: true },
    },

    // گروه: عملیات و فروش (روی یک‌ماهه نیست؛ ۳ و ۶ یکسان؛ ۱۲ بهتر).
    {
      group: 'عملیات و فروش',
      label: 'ماژول انبارداری',
      values: { m1: false, m3: true, m6: true, m12: true },
    },
    {
      group: 'عملیات و فروش',
      label: 'آماده‌سازی و مدیریت ارسال',
      values: { m1: false, m3: true, m6: true, m12: true },
    },
    {
      group: 'عملیات و فروش',
      // نمونه‌ی مقدار متنی: عدد کاربر روی ۳ و ۶ یکسان، روی ۱۲ بیشتر.
      label: 'تعداد کاربر هم‌زمان',
      values: { m1: '۱ کاربر', m3: '۳ کاربر', m6: '۳ کاربر', m12: '۶ کاربر' },
    },
    {
      group: 'عملیات و فروش',
      label: 'مرکز اکسس پیشرفته',
      values: { m1: false, m3: true, m6: true, m12: true },
    },

    // گروه: رشد و بازاریابی (بعضی فقط روی ۱۲‌ماهه).
    {
      group: 'رشد و بازاریابی',
      label: 'پنل پیامکی',
      values: { m1: false, m3: true, m6: true, m12: true },
    },
    {
      group: 'رشد و بازاریابی',
      label: 'اتصال به سامانه مودیان',
      values: { m1: false, m3: true, m6: true, m12: true },
    },
    {
      group: 'رشد و بازاریابی',
      label: 'رابط برنامه‌نویسی (API)',
      values: { m1: false, m3: false, m6: false, m12: true },
    },
    {
      group: 'رشد و بازاریابی',
      label: 'ماژول تولید',
      values: { m1: false, m3: false, m6: false, m12: true },
    },

    // گروه: پشتیبانی (نمونه‌ی ترکیب متن و تیک/ضرب).
    {
      group: 'پشتیبانی',
      label: 'پشتیبانی تیکت',
      values: { m1: true, m3: true, m6: true, m12: true },
    },
    {
      group: 'پشتیبانی',
      label: 'پشتیبانی اپراتور اختصاصی',
      values: { m1: false, m3: 'ساعات اداری', m6: 'ساعات اداری', m12: '۲۴ ساعته' },
    },
    {
      group: 'پشتیبانی',
      label: 'چند ارزی',
      values: { m1: false, m3: false, m6: false, m12: true },
    },
  ],

  labels: {
    featureColumn: 'نوع پکیج',
    currencySuffix: 'تومان',
    discountPrefix: '٪',
    perMonth: 'هر ماه',
    totalLabel: 'کل دوره',
    legendIncluded: 'دارد',
    legendExcluded: 'ندارد',
  },
};
