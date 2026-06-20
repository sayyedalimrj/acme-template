/**
 * Pure helpers for the AI Product Media Studio: presets, tasks, presentation maps, the
 * DETERMINISTIC mock source analysis, and the DETERMINISTIC mock output-variant builder.
 *
 * SECURITY: all logic is local. `analyzePreset` and `buildVariants` invent nothing real,
 * call no provider/API, and produce only frontend-safe placeholder content. Same inputs
 * always yield the same outputs (easy to test).
 */
import type { BadgeTone } from '@/components/ui';
import type { ColorTokens } from '@/theme';
import type {
  MediaStudioActionStatus,
  MediaStudioOutputVariant,
  MediaStudioQualityIssue,
  MediaStudioSourcePreset,
  MediaStudioSourceQuality,
  MediaStudioSuggestedUse,
  MediaStudioTaskType,
  MediaStudioTone,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

export const SOURCE_PRESETS: MediaStudioSourcePreset[] = [
  'blurry',
  'cluttered_background',
  'low_light',
  'cropped_product',
  'damaged_or_dirty',
  'marketplace_ready',
];

export const MEDIA_TASKS: MediaStudioTaskType[] = [
  'improve_low_quality_photo',
  'repair_damaged_photo',
  'remove_background',
  'replace_background',
  'create_white_background',
  'create_lifestyle_image',
  'create_hero_banner',
  'create_social_ad_creative',
  'resize_for_marketplace',
  'generate_alt_text',
  'create_promo_video_concept',
  'create_product_storyboard',
];

// --- Presentation -----------------------------------------------------------

interface Meta {
  labelKey: StringKey;
  tone: BadgeTone;
}

const QUALITY_META: Record<MediaStudioSourceQuality, Meta> = {
  poor: { labelKey: 'mediaStudio.quality.poor', tone: 'danger' },
  fair: { labelKey: 'mediaStudio.quality.fair', tone: 'warning' },
  good: { labelKey: 'mediaStudio.quality.good', tone: 'info' },
  marketplace_ready: { labelKey: 'mediaStudio.quality.marketplace_ready', tone: 'success' },
};

export function qualityMeta(quality: MediaStudioSourceQuality): Meta {
  return QUALITY_META[quality];
}

const VARIANT_STATUS_META: Record<MediaStudioActionStatus, Meta> = {
  suggested: { labelKey: 'mediaStudio.status.suggested', tone: 'info' },
  reviewed: { labelKey: 'mediaStudio.status.reviewed', tone: 'warning' },
  approved: { labelKey: 'mediaStudio.status.approved', tone: 'success' },
  dismissed: { labelKey: 'mediaStudio.status.dismissed', tone: 'neutral' },
};

export function variantStatusMeta(status: MediaStudioActionStatus): Meta {
  return VARIANT_STATUS_META[status];
}

export function issueLabelKey(issue: MediaStudioQualityIssue): StringKey {
  return `mediaStudio.issue.${issue}` as StringKey;
}

export function taskLabelKey(task: MediaStudioTaskType): StringKey {
  return `mediaStudio.task.${task}` as StringKey;
}

export function taskDescriptionKey(task: MediaStudioTaskType): StringKey {
  return `mediaStudio.taskDesc.${task}` as StringKey;
}

export function presetLabelKey(preset: MediaStudioSourcePreset): StringKey {
  return `mediaStudio.preset.${preset}` as StringKey;
}

export function suggestedUseLabelKey(use: MediaStudioSuggestedUse): StringKey {
  return `mediaStudio.use.${use}` as StringKey;
}

const TONE_SOFT: Record<MediaStudioTone, keyof ColorTokens> = {
  primary: 'primarySoft',
  success: 'successSoft',
  warning: 'warningSoft',
  info: 'infoSoft',
  danger: 'dangerSoft',
};
const TONE_FG: Record<MediaStudioTone, keyof ColorTokens> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  info: 'info',
  danger: 'danger',
};

export function toneSoftToken(tone: MediaStudioTone): keyof ColorTokens {
  return TONE_SOFT[tone];
}
export function toneFgToken(tone: MediaStudioTone): keyof ColorTokens {
  return TONE_FG[tone];
}

// --- Deterministic mock source analysis -------------------------------------

interface PresetAnalysis {
  quality: MediaStudioSourceQuality;
  score: number;
  issues: MediaStudioQualityIssue[];
  recommendedFixes: MediaStudioTaskType[];
  note: string;
}

const PRESET_ANALYSIS: Record<MediaStudioSourcePreset, PresetAnalysis> = {
  blurry: {
    quality: 'poor',
    score: 38,
    issues: ['blurry', 'low_resolution', 'noisy'],
    recommendedFixes: ['improve_low_quality_photo', 'resize_for_marketplace'],
    note: 'تصویر تار و کم‌وضوح است؛ بهبود پیشنهادی می‌تواند وضوح را افزایش دهد.',
  },
  cluttered_background: {
    quality: 'fair',
    score: 55,
    issues: ['cluttered_background', 'inconsistent_brand_style'],
    recommendedFixes: ['remove_background', 'create_white_background'],
    note: 'پس‌زمینه شلوغ است؛ حذف یا جایگزینی پس‌زمینه پیشنهاد می‌شود.',
  },
  low_light: {
    quality: 'poor',
    score: 42,
    issues: ['bad_lighting', 'noisy'],
    recommendedFixes: ['improve_low_quality_photo'],
    note: 'نور کم و نویز بالاست؛ بهبود نور و وضوح پیشنهاد می‌شود.',
  },
  cropped_product: {
    quality: 'fair',
    score: 50,
    issues: ['cropped_product', 'wrong_angle'],
    recommendedFixes: ['create_white_background', 'create_hero_banner'],
    note: 'بخشی از محصول بریده شده است؛ بازچینش و قاب‌بندی بهتر پیشنهاد می‌شود.',
  },
  damaged_or_dirty: {
    quality: 'poor',
    score: 30,
    issues: ['damaged_or_dirty_product', 'noisy', 'low_resolution'],
    recommendedFixes: ['repair_damaged_photo', 'improve_low_quality_photo'],
    note: 'محصول در تصویر آسیب‌دیده یا کثیف به نظر می‌رسد؛ فقط بهبود پیشنهادی ارائه می‌شود و بازسازی دقیقِ تصویرِ به‌شدت آسیب‌دیده تضمین نمی‌شود.',
  },
  marketplace_ready: {
    quality: 'marketplace_ready',
    score: 92,
    issues: [],
    recommendedFixes: ['create_lifestyle_image', 'create_hero_banner', 'create_social_ad_creative'],
    note: 'تصویر برای مارکت‌پلیس مناسب است؛ می‌توانید نسخه‌های تبلیغاتی و لایف‌استایل بسازید.',
  },
};

export function analyzePreset(preset: MediaStudioSourcePreset): PresetAnalysis {
  return PRESET_ANALYSIS[preset];
}

// --- Deterministic mock output-variant builder ------------------------------

interface VariantTemplate {
  titleSuffix: string;
  description: string;
  suggestedUse: MediaStudioSuggestedUse;
  tone: MediaStudioTone;
  limitations: string[];
}

const MOCK_LIMIT = 'این خروجی پیشنهادی است و پیش از انتشار باید توسط شما تأیید شود.';

const TASK_VARIANTS: Record<MediaStudioTaskType, VariantTemplate[]> = {
  improve_low_quality_photo: [
    {
      titleSuffix: 'نسخه بهبودیافته',
      description: 'وضوح و نور تصویر به‌صورت پیشنهادی بهبود می‌یابد.',
      suggestedUse: 'product_gallery',
      tone: 'primary',
      limitations: [MOCK_LIMIT, 'بهبود به کیفیت تصویر اصلی وابسته است.'],
    },
    {
      titleSuffix: 'نسخه مارکت‌پلیس',
      description: 'نسخه تمیزشده برای فهرست مارکت‌پلیس.',
      suggestedUse: 'marketplace_listing',
      tone: 'info',
      limitations: [MOCK_LIMIT],
    },
  ],
  repair_damaged_photo: [
    {
      titleSuffix: 'بهبود پیشنهادی',
      description: 'تمیزکاری و کاهش آسیب ظاهری به‌صورت پیشنهادی (بدون تضمین بازسازی کامل).',
      suggestedUse: 'product_gallery',
      tone: 'warning',
      limitations: [MOCK_LIMIT, 'بازسازی دقیق تصویرِ به‌شدت آسیب‌دیده ممکن نیست.'],
    },
  ],
  remove_background: [
    {
      titleSuffix: 'بدون پس‌زمینه',
      description: 'محصول جدا از پس‌زمینه شلوغ.',
      suggestedUse: 'product_gallery',
      tone: 'primary',
      limitations: [MOCK_LIMIT, 'لبه‌های پیچیده ممکن است نیاز به اصلاح داشته باشند.'],
    },
  ],
  replace_background: [
    {
      titleSuffix: 'پس‌زمینه جدید',
      description: 'جایگزینی پس‌زمینه با صحنه هماهنگ با برند.',
      suggestedUse: 'instagram_post',
      tone: 'info',
      limitations: [MOCK_LIMIT],
    },
  ],
  create_white_background: [
    {
      titleSuffix: 'پس‌زمینه سفید',
      description: 'تصویر با پس‌زمینه سفید استاندارد مارکت‌پلیس.',
      suggestedUse: 'marketplace_listing',
      tone: 'success',
      limitations: [MOCK_LIMIT],
    },
  ],
  create_lifestyle_image: [
    {
      titleSuffix: 'صحنه لایف‌استایل',
      description: 'محصول در یک صحنه واقعی و کاربردی.',
      suggestedUse: 'instagram_post',
      tone: 'info',
      limitations: [MOCK_LIMIT],
    },
  ],
  create_hero_banner: [
    {
      titleSuffix: 'بنر صفحه اصلی',
      description: 'تصویر شاخص برای بنر صفحه نخست.',
      suggestedUse: 'homepage_hero',
      tone: 'primary',
      limitations: [MOCK_LIMIT],
    },
  ],
  create_social_ad_creative: [
    {
      titleSuffix: 'کرییتیو تبلیغاتی',
      description: 'طرح تبلیغاتی برای شبکه‌های اجتماعی.',
      suggestedUse: 'instagram_post',
      tone: 'danger',
      limitations: [MOCK_LIMIT],
    },
  ],
  resize_for_marketplace: [
    {
      titleSuffix: 'ابعاد مارکت‌پلیس',
      description: 'تغییر اندازه به ابعاد استاندارد فهرست.',
      suggestedUse: 'marketplace_listing',
      tone: 'success',
      limitations: [MOCK_LIMIT],
    },
  ],
  generate_alt_text: [
    {
      titleSuffix: 'متن جایگزین',
      description: 'پیش‌نویس متن جایگزین (alt) سئو برای تصویر محصول.',
      suggestedUse: 'product_gallery',
      tone: 'info',
      limitations: [MOCK_LIMIT, 'پیش‌نویس متن است، نه تصویر.'],
    },
  ],
  create_promo_video_concept: [
    {
      titleSuffix: 'ایده ویدئوی کوتاه',
      description: 'کانسپت ویدئوی تبلیغاتی کوتاه.',
      suggestedUse: 'story_reel',
      tone: 'primary',
      limitations: [MOCK_LIMIT, 'فقط کانسپت است؛ ویدئویی تولید نمی‌شود.'],
    },
  ],
  create_product_storyboard: [
    {
      titleSuffix: 'استوری‌برد',
      description: 'استوری‌برد صحنه‌به‌صحنه برای محتوای محصول.',
      suggestedUse: 'story_reel',
      tone: 'info',
      limitations: [MOCK_LIMIT, 'فقط طرح صحنه‌هاست؛ ویدئویی تولید نمی‌شود.'],
    },
  ],
};

/** Deterministic mock variants for a task + product (no real generation). */
export function buildVariants(
  taskType: MediaStudioTaskType,
  productId: string,
  productName: string,
  idPrefix: string,
): MediaStudioOutputVariant[] {
  return TASK_VARIANTS[taskType].map((template, index) => ({
    id: `${idPrefix}_${taskType}_${index}`,
    productId,
    taskType,
    title: `${productName} — ${template.titleSuffix}`,
    description: template.description,
    status: 'suggested',
    suggestedUse: template.suggestedUse,
    tone: template.tone,
    limitations: template.limitations,
  }));
}
