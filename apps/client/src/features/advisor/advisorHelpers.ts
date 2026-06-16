/**
 * Pure helpers for the AI advisor: priority/category/status presentation, action labels,
 * grouping, and the DETERMINISTIC mock chat responder.
 *
 * SECURITY: `advisorReply` performs simple, local keyword matching and returns a fixed
 * Persian string — it calls NO AI provider/API, sends nothing externally, and invents no
 * real store data. Same input always yields the same output (easy to test).
 */
import type { BadgeTone } from '@/components/ui';
import type {
  AIAdvisorActionKind,
  AIAdvisorActionStatus,
  AIAdvisorCategory,
  AIAdvisorPriority,
  AIAdvisorRecommendation,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

interface Meta {
  labelKey: StringKey;
  tone: BadgeTone;
}

const PRIORITY_META: Record<AIAdvisorPriority, Meta> = {
  high: { labelKey: 'advisor.priority.high', tone: 'danger' },
  medium: { labelKey: 'advisor.priority.medium', tone: 'warning' },
  low: { labelKey: 'advisor.priority.low', tone: 'neutral' },
};

export function priorityMeta(priority: AIAdvisorPriority): Meta {
  return PRIORITY_META[priority];
}

const STATUS_META: Record<AIAdvisorActionStatus, Meta> = {
  suggested: { labelKey: 'advisor.recStatus.suggested', tone: 'info' },
  reviewed: { labelKey: 'advisor.recStatus.reviewed', tone: 'success' },
  dismissed: { labelKey: 'advisor.recStatus.dismissed', tone: 'neutral' },
};

export function recStatusMeta(status: AIAdvisorActionStatus): Meta {
  return STATUS_META[status];
}

export const ADVISOR_CATEGORY_ORDER: AIAdvisorCategory[] = [
  'sales',
  'inventory',
  'marketing',
  'content',
  'media',
];

export function categoryLabelKey(category: AIAdvisorCategory): StringKey {
  switch (category) {
    case 'sales':
      return 'advisor.category.sales';
    case 'inventory':
      return 'advisor.category.inventory';
    case 'marketing':
      return 'advisor.category.marketing';
    case 'content':
      return 'advisor.category.content';
    case 'media':
    default:
      return 'advisor.category.media';
  }
}

export function actionLabelKey(kind: AIAdvisorActionKind): StringKey {
  switch (kind) {
    case 'view_product':
      return 'advisor.action.view_product';
    case 'view_orders':
      return 'advisor.action.view_orders';
    case 'view_inventory':
      return 'advisor.action.view_inventory';
    case 'review_campaign':
      return 'advisor.action.review_campaign';
    case 'draft_copy':
      return 'advisor.action.draft_copy';
    case 'open_media_studio':
      return 'advisor.action.open_media_studio';
    case 'mark_reviewed':
      return 'advisor.action.mark_reviewed';
    case 'dismiss':
    default:
      return 'advisor.action.dismiss';
  }
}

/** Whether an action navigates (read-only) vs. is a disabled mock placeholder. */
export function isNavigableAction(kind: AIAdvisorActionKind): boolean {
  return kind === 'view_product' || kind === 'view_orders' || kind === 'view_inventory';
}

/** Recommendations grouped by category in canonical order (empty groups dropped). */
export function groupRecommendations(
  recs: AIAdvisorRecommendation[],
): { category: AIAdvisorCategory; recommendations: AIAdvisorRecommendation[] }[] {
  return ADVISOR_CATEGORY_ORDER.map((category) => ({
    category,
    recommendations: recs.filter((r) => r.category === category),
  })).filter((group) => group.recommendations.length > 0);
}

// --- Deterministic mock chat responder --------------------------------------

export type AdvisorReplyKind =
  | 'sales'
  | 'inventory'
  | 'retention'
  | 'copy'
  | 'sms_restock'
  | 'media'
  | 'generic';

/** Review-only disclaimer appended to every mock reply. */
const DISCLAIMER =
  ' (این یک پیشنهاد نمونه است و به بازبینی شما نیاز دارد؛ هیچ اقدام واقعی به‌صورت خودکار انجام نمی‌شود.)';

/** Classify a user message into a reply kind using simple, local keyword matching. */
export function advisorReplyKind(message: string): AdvisorReplyKind {
  const text = message.toLowerCase();
  if (/عکس|ویدئو|ویدیو|رسانه|تصویر/.test(text)) return 'media';
  if (/پیامک|ناموجود|بازگشت موجودی|sms/.test(text)) return 'sms_restock';
  if (/vip|وفادار|بازگشت مشتری|ریتنشن|نگه‌داشت/.test(text)) return 'retention';
  if (/توضیح|کپی|محتوا|کانتنت|سئو|seo/.test(text)) return 'copy';
  if (/موجودی|انبار|شارژ مجدد|restock/.test(text)) return 'inventory';
  if (/فروش|درآمد|افزایش/.test(text)) return 'sales';
  return 'generic';
}

const REPLY_BODY: Record<AdvisorReplyKind, string> = {
  sales:
    'بر اساس داده‌های نمونه فروشگاه، محصولات پرفروش را در صفحه نخست برجسته کنید و یک پیشنهاد فروش مکمل (cross-sell) برای آن‌ها بسازید. همچنین یک بازبینی قیمت روی محصولات کم‌فروش می‌تواند کمک‌کننده باشد.',
  inventory:
    'چند محصول در آستانه اتمام موجودی هستند. پیشنهاد می‌کنم فهرست کم‌موجودی و ناموجود را بررسی و برای پرفروش‌ها سفارش شارژ مجدد ثبت کنید تا فروش از دست نرود.',
  retention:
    'برای مشتریان ارزشمند می‌توانید یک کمپین قدردانی یا کد تخفیف اختصاصی طراحی کنید. یک کمپین بازگشت مشتری برای خریداران غیرفعال هم فرصت خوبی است.',
  copy: 'برای محصولات با توضیح کوتاه، می‌توانم پیش‌نویس توضیح غنی‌تر و عنوان/متای سئو پیشنهاد دهم تا نرخ کلیک و تبدیل بهتر شود. خروجی فقط پیش‌نویس است و قبل از انتشار شما آن را بازبینی می‌کنید.',
  sms_restock:
    'برای محصولات ناموجود می‌توانید یک کمپین «اطلاع موجودی» پیامکی آماده کنید تا به مشتریان علاقه‌مند هنگام شارژ مجدد اطلاع داده شود. ارسال واقعی پیامک نیازمند تأیید شما و فعال‌سازی بعدی است.',
  media:
    'برای محصولات با عکس کم‌کیفیت، استودیوی رسانه (به‌زودی) می‌تواند پاک‌سازی پس‌زمینه، تصویر شاخص حرفه‌ای و ایده ویدئوی کوتاه تبلیغاتی پیشنهاد دهد. خروجی‌ها فقط پیشنهاد هستند و قبل از استفاده تأیید می‌شوند.',
  generic:
    'می‌توانم درباره فروش، موجودی، کمپین‌ها، بهبود توضیح محصول و ایده‌های رسانه‌ای کمک کنم. بر اساس داده‌های نمونه فروشگاه، از بخش پیشنهادها می‌توانید گام بعدی را انتخاب کنید.',
};

/** Deterministic mock reply text for a user message (no AI, no network). */
export function advisorReply(message: string): string {
  return REPLY_BODY[advisorReplyKind(message)] + DISCLAIMER;
}
