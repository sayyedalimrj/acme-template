/**
 * Mock support operations queue (seed data).
 *
 * Realistic internal queue items derived conceptually from the two onboarding paths
 * (existing-site / new-store), in a range of statuses, priorities, and assignment states,
 * each with a playbook checklist, status timeline, risk flags, and internal notes.
 *
 * SECURITY: every record holds only frontend-safe data (store name, public site URL/domain,
 * template/plan display data, status, Persian notes). There are NO credentials anywhere, and
 * notes never contain secrets. One item carries the `credentials_requested_externally` risk
 * to demonstrate flagging an insecure credential-sharing attempt (handled out-of-band).
 */
import type { SupportAssignee, SupportChecklistItem, SupportQueueItem } from '@/domain/types';

export const supportAssignees: SupportAssignee[] = [
  { id: 'tm_sara', name: 'سارا محمدی', role: 'اتصال' },
  { id: 'tm_reza', name: 'رضا کریمی', role: 'راه‌اندازی' },
  { id: 'tm_nazanin', name: 'نازنین احمدی', role: 'پشتیبانی' },
];

/** Existing-site playbook steps. */
const EXISTING_CHECKLIST: { id: string; label: string }[] = [
  { id: 'chk_site_url', label: 'بررسی آدرس سایت' },
  { id: 'chk_is_woo', label: 'تأیید فعال بودن فروشگاه آنلاین سایت' },
  { id: 'chk_conn_needs', label: 'بررسی نیازهای اتصال' },
  { id: 'chk_no_secrets', label: 'تأیید اینکه اطلاعات ورود داخل اپ دریافت نشده است' },
  { id: 'chk_secure_plan', label: 'برنامه‌ریزی اتصال امن از طریق سرویس اتصال امن' },
  { id: 'chk_handoff', label: 'آماده‌سازی تحویل به داشبورد' },
];

/** New-store launch playbook steps. */
const NEW_CHECKLIST: { id: string; label: string }[] = [
  { id: 'chk_domain', label: 'تأیید دامنه' },
  { id: 'chk_template', label: 'تأیید قالب انتخابی' },
  { id: 'chk_brand', label: 'بررسی لوگو و رنگ برند' },
  { id: 'chk_products', label: 'بررسی لیست محصولات اولیه' },
  { id: 'chk_contact', label: 'بررسی اطلاعات تماس' },
  { id: 'chk_pay_ship', label: 'تنظیمات پرداخت/ارسال (بعداً)' },
  { id: 'chk_review', label: 'آماده‌سازی سایت برای بازبینی' },
  { id: 'chk_connect', label: 'اتصال سایت به داشبورد پس از آماده‌سازی' },
];

/** Build a checklist marking the first `doneCount` steps complete. */
function buildChecklist(
  template: { id: string; label: string }[],
  doneCount: number,
): SupportChecklistItem[] {
  return template.map((step, index) => ({ ...step, done: index < doneCount }));
}

export const supportQueueItems: SupportQueueItem[] = [
  {
    id: 'onb_exist_1001',
    type: 'existing',
    storeName: 'فروشگاه نقش‌ونگار',
    siteUrl: 'https://naghshonegar.example.test',
    planId: 'growth',
    planName: 'رشد',
    status: 'under_review',
    priority: 'medium',
    assignee: supportAssignees[0],
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-06-11T11:30:00Z',
    nextAction: { summary: 'بررسی فنی سایت و تأیید فروشگاه آنلاین', owner: 'support' },
    risks: [],
    checklist: buildChecklist(EXISTING_CHECKLIST, 2),
    timeline: [
      { status: 'submitted', date: '2026-06-10T09:20:00Z', note: 'درخواست اتصال ثبت شد.' },
      {
        status: 'under_review',
        date: '2026-06-11T11:30:00Z',
        note: 'در حال بررسی توسط تیم اتصال.',
      },
    ],
    notes: [
      {
        id: 'note_1',
        author: 'سارا محمدی',
        body: 'سایت در دسترس است و به نظر فعال می‌رسد؛ منتظر تأیید نسخه.',
        createdAt: '2026-06-11T11:35:00Z',
      },
    ],
  },
  {
    id: 'onb_exist_1002',
    type: 'existing',
    storeName: 'دیجی‌مارکت پارس',
    siteUrl: 'https://digimarket-pars.example.test',
    planId: 'managed',
    planName: 'مدیریت‌شده',
    status: 'needs_customer_action',
    priority: 'high',
    assignee: null,
    createdAt: '2026-06-05T14:00:00Z',
    updatedAt: '2026-06-08T08:45:00Z',
    nextAction: {
      summary: 'در انتظار تأیید پلتفرم توسط مشتری (بدون دریافت اطلاعات حساس)',
      owner: 'customer',
    },
    risks: ['platform_unconfirmed', 'credentials_requested_externally'],
    checklist: buildChecklist(EXISTING_CHECKLIST, 1),
    timeline: [
      { status: 'submitted', date: '2026-06-05T14:00:00Z', note: 'درخواست واگذاری مدیریت ثبت شد.' },
      { status: 'under_review', date: '2026-06-06T10:00:00Z' },
      {
        status: 'needs_customer_action',
        date: '2026-06-08T08:45:00Z',
        note: 'از مشتری خواسته شد نسخه پلتفرم را تأیید کند؛ هیچ رمز یا کلیدی داخل برنامه دریافت نمی‌شود.',
      },
    ],
    notes: [
      {
        id: 'note_2',
        author: 'نازنین احمدی',
        body: 'مشتری تلاش کرد رمز ورود را در پیام بفرستد؛ رد شد و راهنمای اتصال امن ارسال شد.',
        createdAt: '2026-06-08T09:00:00Z',
      },
    ],
  },
  {
    id: 'onb_new_2001',
    type: 'new',
    storeName: 'آرایشی گل‌بانو',
    domain: 'golbanoo-shop.example.test',
    templateId: 'tpl_beauty_lumen',
    templateName: 'آرایشی لومن',
    planId: 'growth',
    planName: 'رشد',
    status: 'awaiting_assets',
    priority: 'medium',
    assignee: supportAssignees[1],
    createdAt: '2026-06-02T12:00:00Z',
    updatedAt: '2026-06-04T15:10:00Z',
    nextAction: { summary: 'در انتظار دریافت عکس محصولات و متن درباره ما', owner: 'customer' },
    risks: ['assets_incomplete', 'awaiting_customer'],
    checklist: buildChecklist(NEW_CHECKLIST, 3),
    timeline: [
      { status: 'submitted', date: '2026-06-02T12:00:00Z', note: 'درخواست راه‌اندازی ثبت شد.' },
      { status: 'under_review', date: '2026-06-03T09:30:00Z', note: 'دامنه و قالب بررسی شد.' },
      {
        status: 'awaiting_assets',
        date: '2026-06-04T15:10:00Z',
        note: 'در انتظار دارایی‌های برند.',
      },
    ],
    notes: [],
  },
  {
    id: 'onb_new_2002',
    type: 'new',
    storeName: 'پوشاک ترمه',
    domain: 'termeh-wear.example.test',
    templateId: 'tpl_pooshak_aurora',
    templateName: 'پوشاک آرورا',
    planId: 'pro',
    planName: 'حرفه‌ای',
    status: 'provisioning',
    priority: 'high',
    assignee: supportAssignees[1],
    createdAt: '2026-05-26T10:00:00Z',
    updatedAt: '2026-06-01T13:20:00Z',
    nextAction: { summary: 'ساخت فروشگاه و آماده‌سازی برای بازبینی', owner: 'support' },
    risks: [],
    checklist: buildChecklist(NEW_CHECKLIST, 6),
    timeline: [
      { status: 'submitted', date: '2026-05-26T10:00:00Z' },
      { status: 'under_review', date: '2026-05-27T09:00:00Z' },
      { status: 'awaiting_assets', date: '2026-05-28T09:00:00Z', note: 'دارایی‌ها دریافت شد.' },
      { status: 'provisioning', date: '2026-06-01T13:20:00Z', note: 'ساخت فروشگاه آغاز شد.' },
    ],
    notes: [
      {
        id: 'note_3',
        author: 'رضا کریمی',
        body: 'قالب نصب شد؛ در حال افزودن محصولات اولیه و صفحات.',
        createdAt: '2026-06-01T13:30:00Z',
      },
    ],
  },
  {
    id: 'onb_exist_1003',
    type: 'existing',
    storeName: 'لوازم‌خانگی مهر',
    siteUrl: 'https://mehr-home.example.test',
    planId: 'pro',
    planName: 'حرفه‌ای',
    status: 'connection_scheduled',
    priority: 'urgent',
    assignee: supportAssignees[0],
    createdAt: '2026-05-30T08:00:00Z',
    updatedAt: '2026-06-09T16:00:00Z',
    nextAction: { summary: 'اجرای اتصال امن از طریق سرویس اتصال امن', owner: 'support' },
    risks: [],
    checklist: buildChecklist(EXISTING_CHECKLIST, 5),
    timeline: [
      { status: 'submitted', date: '2026-05-30T08:00:00Z' },
      { status: 'under_review', date: '2026-05-31T10:00:00Z' },
      {
        status: 'connection_scheduled',
        date: '2026-06-09T16:00:00Z',
        note: 'اتصال برای فردا زمان‌بندی شد.',
      },
    ],
    notes: [],
  },
  {
    id: 'onb_new_2003',
    type: 'new',
    storeName: 'قهوه آرامیس',
    domain: 'aramis-coffee.example.test',
    templateId: 'tpl_food_trailhead',
    templateName: 'غذا و نوشیدنی ترِیل',
    planId: 'starter',
    planName: 'پایه',
    status: 'submitted',
    priority: 'low',
    assignee: null,
    createdAt: '2026-06-13T07:30:00Z',
    updatedAt: '2026-06-13T07:30:00Z',
    nextAction: { summary: 'بررسی اولیه و تخصیص به تیم راه‌اندازی', owner: 'support' },
    risks: ['domain_unverified'],
    checklist: buildChecklist(NEW_CHECKLIST, 0),
    timeline: [
      { status: 'submitted', date: '2026-06-13T07:30:00Z', note: 'درخواست جدید راه‌اندازی.' },
    ],
    notes: [],
  },
];
