/**
 * Mock AI Product Media Studio data: provider status, prompt chips, promo-video concepts,
 * safety notices, and a few seeded output variants.
 *
 * SECURITY: no media provider, no API keys, no file upload/storage, no external URLs, no
 * secrets. Output variants are placeholders; nothing is generated, uploaded, or published.
 */
import type {
  MediaStudioOutputVariant,
  MediaStudioProviderStatus,
  MediaStudioPromptSuggestion,
  MediaStudioSafetyNotice,
  MediaStudioVideoConcept,
} from '@/domain/types';

import { buildVariants } from '@/features/media-studio/mediaStudioHelpers';
import { products } from './catalog';

/** No real media provider is wired — everything here is mock. */
export const mediaProviderStatus: MediaStudioProviderStatus = 'not_connected';

export const mediaPromptSuggestions: MediaStudioPromptSuggestion[] = [
  { id: 'mp_white_bg', text: 'پس‌زمینه سفید تمیز برای مارکت‌پلیس بساز' },
  { id: 'mp_hero', text: 'عکس محصول را برای بنر صفحه اصلی آماده کن' },
  { id: 'mp_video', text: 'چند ایده ویدئوی تبلیغاتی کوتاه بده' },
  { id: 'mp_enhance', text: 'نور و وضوح تصویر را بهتر کن' },
  { id: 'mp_remove_bg', text: 'پس‌زمینه شلوغ را حذف کن' },
  { id: 'mp_alt', text: 'برای این محصول متن جایگزین SEO بنویس' },
];

export const mediaSafetyNotices: MediaStudioSafetyNotice[] = [
  {
    id: 'sn_review',
    severity: 'warning',
    message:
      'همه خروجی‌ها نمونه و فقط جهت بازبینی هستند؛ هیچ رسانه‌ای به‌صورت خودکار روی محصولات منتشر نمی‌شود.',
  },
  {
    id: 'sn_no_upload',
    severity: 'info',
    message: 'هیچ فایلی آپلود یا به سرویس خارجی ارسال نمی‌شود؛ سناریوهای تصویر فقط شبیه‌سازی‌اند.',
  },
  {
    id: 'sn_repair',
    severity: 'info',
    message:
      'برای تصاویر آسیب‌دیده فقط «بهبود پیشنهادی» ارائه می‌شود و بازسازی دقیق تضمین نمی‌گردد.',
  },
];

export const mediaVideoConcepts: MediaStudioVideoConcept[] = [
  {
    id: 'vc_reveal',
    title: 'معرفی ۶ ثانیه‌ای محصول',
    goal: 'جلب توجه سریع و معرفی محصول',
    scenes: [
      { order: 1, description: 'نمای نزدیک محصول روی پس‌زمینه تمیز', durationLabel: '۲ ثانیه' },
      { order: 2, description: 'چرخش آرام و نمایش جزئیات', durationLabel: '۲ ثانیه' },
      { order: 3, description: 'نمایش نام برند و قیمت', durationLabel: '۲ ثانیه' },
    ],
    captionIdea: 'محصول تازه ما رسید!',
    ctaIdea: 'همین حالا ببینید',
    channel: 'اینستاگرام (ریلز)',
  },
  {
    id: 'vc_social_ad',
    title: 'تبلیغ ۱۵ ثانیه‌ای شبکه‌های اجتماعی',
    goal: 'افزایش کلیک و فروش',
    scenes: [
      { order: 1, description: 'مشکل/نیاز مشتری', durationLabel: '۴ ثانیه' },
      { order: 2, description: 'محصول به‌عنوان راه‌حل', durationLabel: '۷ ثانیه' },
      { order: 3, description: 'پیشنهاد ویژه و دعوت به اقدام', durationLabel: '۴ ثانیه' },
    ],
    captionIdea: 'راه‌حل ساده برای نیاز روزمره شما',
    ctaIdea: 'با تخفیف ویژه بخرید',
    channel: 'اینستاگرام / تلگرام',
  },
  {
    id: 'vc_before_after',
    title: 'قبل/بعد پاک‌سازی تصویر محصول',
    goal: 'نمایش کیفیت و اعتمادسازی',
    scenes: [
      { order: 1, description: 'تصویر اولیه با پس‌زمینه شلوغ', durationLabel: '۳ ثانیه' },
      { order: 2, description: 'نسخه تمیز و حرفه‌ای', durationLabel: '۳ ثانیه' },
    ],
    captionIdea: 'تفاوت را ببینید',
    ctaIdea: 'محصولات ما را مشاهده کنید',
    channel: 'اینستاگرام (استوری)',
  },
  {
    id: 'vc_lifestyle',
    title: 'صحنه لایف‌استایل',
    goal: 'نمایش کاربرد واقعی محصول',
    scenes: [
      { order: 1, description: 'محصول در محیط واقعی استفاده', durationLabel: '۵ ثانیه' },
      { order: 2, description: 'واکنش مثبت کاربر', durationLabel: '۵ ثانیه' },
    ],
    captionIdea: 'بخشی از روز شما',
    ctaIdea: 'به سبد خرید اضافه کنید',
    channel: 'اینستاگرام',
  },
  {
    id: 'vc_restock',
    title: 'اعلام شارژ مجدد موجودی',
    goal: 'اطلاع‌رسانی بازگشت محصول پرطرفدار',
    scenes: [
      { order: 1, description: 'متن «دوباره موجود شد»', durationLabel: '۳ ثانیه' },
      { order: 2, description: 'نمایش محصول و موجودی محدود', durationLabel: '۴ ثانیه' },
    ],
    captionIdea: 'پرطرفدارترین محصول دوباره موجود شد',
    ctaIdea: 'تا تمام نشده بخرید',
    channel: 'پیامک / اینستاگرام',
  },
];

/** A few seeded example variants so the Studio shows outputs before any generation. */
export const seedOutputVariants: MediaStudioOutputVariant[] = products[0]
  ? buildVariants('improve_low_quality_photo', products[0].id, products[0].name, 'seed')
  : [];
