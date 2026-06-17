/**
 * Mock SMS / back-in-stock automation data.
 *
 * Built from the existing catalog + customer-intelligence-style signals. Back-in-stock
 * subscriptions target out-of-stock / low-stock products; campaign drafts cover the main
 * automation rule types.
 *
 * SECURITY/PRIVACY: no real provider, no provider keys, no sender IDs, no real phone numbers
 * (only masked placeholders), no secrets. Nothing is sent; everything is review-only.
 */
import type {
  AutomationRule,
  AutomationSafetyNotice,
  BackInStockSubscription,
  CampaignDraft,
  ConsentReadiness,
  NotificationProviderStatus,
  NotificationReadiness,
} from '@/domain/types';

import { products } from './catalog';

const p = (i: number) => products[i % products.length];

/** No real messaging provider is wired — everything here is mock. */
export const notificationProviderStatus: NotificationProviderStatus = 'not_connected';

export const notificationReadiness: NotificationReadiness = {
  smsProvider: 'not_connected',
  kavenegar: 'later',
  twilio: 'later',
  email: 'later',
  consentModel: 'planned',
  optOutHandling: 'planned',
};

export const consentReadiness: ConsentReadiness = {
  consentModel: 'planned',
  optOutHandling: 'planned',
  collectedOptIns: 0,
  note: 'مدل رضایت و لغو اشتراک هنوز فعال نیست؛ پیش از هر ارسال واقعی باید پیاده‌سازی شود.',
};

export const backInStockSubscriptions: BackInStockSubscription[] = [
  {
    id: 'bss_1',
    productId: p(2).id,
    productName: p(2).name,
    sku: p(2).sku,
    stockStatus: 'ناموجود',
    interestedShoppers: 14,
    consent: 'pending',
    maskedExample: '09xx *** 1234',
    suggestedMessage: `خبر خوب! «${p(2).name}» دوباره موجود شد. تا تمام نشده سفارش دهید.`,
  },
  {
    id: 'bss_2',
    productId: p(4).id,
    productName: p(4).name,
    sku: p(4).sku,
    stockStatus: 'کم‌موجودی',
    interestedShoppers: 5,
    consent: 'not_collected',
    maskedExample: '09xx *** 5678',
    suggestedMessage: `«${p(4).name}» به‌زودی تمام می‌شود؛ موجودی محدود است.`,
  },
];

export const campaignDrafts: CampaignDraft[] = [
  {
    id: 'cd_bis',
    ruleType: 'back_in_stock_alert',
    title: 'اعلام موجودی مجدد',
    reason: `۱۴ مشتری منتظر موجود شدن «${p(2).name}» هستند.`,
    channel: 'sms',
    audience: {
      label: `مشترکین موجودی «${p(2).name}»`,
      size: 14,
      channel: 'sms',
      consentReadiness: 'pending',
    },
    messagePreview: `خبر خوب! «${p(2).name}» دوباره موجود شد. تا تمام نشده سفارش دهید.`,
    readiness: 'ready',
    status: 'suggested',
  },
  {
    id: 'cd_restock',
    ruleType: 'restock_announcement',
    title: 'اعلام شارژ مجدد به همه',
    reason: 'محصول پرطرفدار دوباره شارژ شده است.',
    channel: 'sms',
    audience: {
      label: 'مشتریان فعال اخیر',
      size: 320,
      channel: 'sms',
      consentReadiness: 'not_collected',
    },
    messagePreview: `محصولات پرطرفدار ما دوباره موجود شدند. همین حالا ببینید.`,
    readiness: 'warming',
    status: 'suggested',
  },
  {
    id: 'cd_abandoned',
    ruleType: 'abandoned_cart_followup',
    title: 'پیگیری سبد رهاشده',
    reason: `سبد خرید شامل «${p(1).name}» رها شده است.`,
    channel: 'sms',
    audience: { label: 'صاحبان سبد رهاشده', size: 2, channel: 'sms', consentReadiness: 'pending' },
    messagePreview: `سبد خرید شما هنوز منتظر شماست؛ با ارسال رایگان تکمیل کنید.`,
    readiness: 'ready',
    status: 'suggested',
  },
  {
    id: 'cd_vip',
    ruleType: 'vip_customer_reactivation',
    title: 'فعال‌سازی مشتریان ویژه',
    reason: 'مشتریان وفادار مدتی خرید نکرده‌اند.',
    channel: 'sms',
    audience: {
      label: 'مشتریان ویژه غیرفعال',
      size: 18,
      channel: 'sms',
      consentReadiness: 'not_collected',
    },
    messagePreview: `دلمان برایتان تنگ شده! یک پیشنهاد ویژه برای شما داریم.`,
    readiness: 'warming',
    status: 'suggested',
  },
  {
    id: 'cd_interest',
    ruleType: 'product_interest_followup',
    title: 'پیگیری علاقه به محصول',
    reason: `بازدید بالای «${p(0).name}» بدون خرید.`,
    channel: 'sms',
    audience: {
      label: `علاقه‌مندان «${p(0).name}»`,
      size: 34,
      channel: 'sms',
      consentReadiness: 'pending',
    },
    messagePreview: `«${p(0).name}» را پسندیدید؟ با کد ویژه همین حالا تهیه کنید.`,
    readiness: 'warming',
    status: 'suggested',
  },
  {
    id: 'cd_search',
    ruleType: 'search_demand_campaign',
    title: 'کمپین تقاضای جستجو',
    reason: 'جستجوی پرتکرار برای یک دسته محصول.',
    channel: 'sms',
    audience: {
      label: 'جستجوگران اخیر',
      size: 42,
      channel: 'sms',
      consentReadiness: 'not_collected',
    },
    messagePreview: `آنچه دنبالش بودید رسید؛ مجموعه جدید را ببینید.`,
    readiness: 'low',
    status: 'suggested',
  },
];

export const automationRules: AutomationRule[] = [
  {
    id: 'ar_bis',
    ruleType: 'back_in_stock_alert',
    trigger: 'وقتی محصول ناموجود دوباره شارژ شود',
    audience: 'مشترکین موجودی همان محصول',
    channel: 'sms',
    status: 'mock',
    nextStep: 'پیش‌نویس پیامک را بازبینی کنید.',
    providerRequirement: 'نیازمند ارائه‌دهنده پیامک و مدل رضایت (آینده).',
  },
  {
    id: 'ar_abandoned',
    ruleType: 'abandoned_cart_followup',
    trigger: 'وقتی سبد خرید بدون پرداخت رها شود',
    audience: 'صاحبان سبد رهاشده با رضایت',
    channel: 'sms',
    status: 'planned',
    nextStep: 'مدل رضایت را آماده کنید.',
    providerRequirement: 'نیازمند ردیابی سبد + ارائه‌دهنده پیامک (آینده).',
  },
  {
    id: 'ar_lowstock',
    ruleType: 'low_stock_followup',
    trigger: 'وقتی موجودی محصول پرفروش کم شود',
    audience: 'تیم فروشگاه (یادآوری داخلی)',
    channel: 'sms',
    status: 'planned',
    nextStep: 'آستانه هشدار را تعیین کنید.',
    providerRequirement: 'نیازمند خط لوله رویداد موجودی (آینده).',
  },
  {
    id: 'ar_vip',
    ruleType: 'vip_customer_reactivation',
    trigger: 'وقتی مشتری ویژه مدتی غیرفعال باشد',
    audience: 'مشتریان وفادار غیرفعال با رضایت',
    channel: 'sms',
    status: 'planned',
    nextStep: 'بخش‌بندی مشتریان ویژه را تعریف کنید.',
    providerRequirement: 'نیازمند هوش مشتریان + ارائه‌دهنده پیامک (آینده).',
  },
];

export const automationSafetyNotices: AutomationSafetyNotice[] = [
  {
    id: 'asn_consent',
    severity: 'warning',
    message: 'هیچ پیامکی ارسال نمی‌شود. ارسال واقعی تنها پس از دریافت رضایت صریح مخاطب مجاز است.',
  },
  {
    id: 'asn_optout',
    severity: 'info',
    message: 'هر پیام باید شامل راه لغو اشتراک باشد؛ درخواست لغو همیشه محترم شمرده می‌شود.',
  },
  {
    id: 'asn_provider',
    severity: 'info',
    message:
      'ارسال واقعی در آینده از طریق backend و ارائه‌دهنده امن (مثل کاوه‌نگار/توییلیو) انجام می‌شود.',
  },
];
