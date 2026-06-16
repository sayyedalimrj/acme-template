/**
 * Mock onboarding requests (seed data).
 *
 * Realistic, frontend-safe onboarding records across both paths (existing-site + new-store)
 * in a range of statuses, each with a chronological status timeline. These model how the
 * support team would progress a request.
 *
 * SECURITY: every record holds only frontend-safe data (business name, public site URL,
 * domain, brand-asset readiness, status, notes). There are NO credentials of any kind, and
 * notes never contain secrets — connection/provisioning happens server-side later.
 */
import type { OnboardingRequest } from '@/domain/types';

export const onboardingRequests: OnboardingRequest[] = [
  {
    id: 'onb_exist_1001',
    type: 'existing',
    businessName: 'فروشگاه نقش‌ونگار',
    siteUrl: 'https://naghshonegar.example.test',
    platform: 'woocommerce',
    requestType: 'connect_only',
    contactNote: 'فروشگاه فعال است و فقط می‌خواهیم از داشبورد شما مدیریت کنیم.',
    status: 'under_review',
    statusHistory: [
      { status: 'draft', date: '2026-06-10T09:00:00Z' },
      { status: 'submitted', date: '2026-06-10T09:20:00Z', note: 'درخواست اتصال ثبت شد.' },
      {
        status: 'under_review',
        date: '2026-06-11T11:30:00Z',
        note: 'تیم پشتیبانی در حال بررسی است.',
      },
    ],
    createdAt: '2026-06-10T09:00:00Z',
    updatedAt: '2026-06-11T11:30:00Z',
  },
  {
    id: 'onb_exist_1002',
    type: 'existing',
    businessName: 'دیجی‌مارکت پارس',
    siteUrl: 'https://digimarket-pars.example.test',
    platform: 'not_sure',
    requestType: 'managed_handover',
    contactNote: 'مطمئن نیستیم فروشگاه روی ووکامرس است؛ به بررسی و راهنمایی نیاز داریم.',
    status: 'needs_customer_action',
    statusHistory: [
      { status: 'submitted', date: '2026-06-05T14:00:00Z', note: 'درخواست واگذاری مدیریت ثبت شد.' },
      { status: 'under_review', date: '2026-06-06T10:00:00Z' },
      {
        status: 'needs_customer_action',
        date: '2026-06-08T08:45:00Z',
        note: 'لطفاً نسخه وردپرس/ووکامرس را تأیید کنید (بدون نیاز به ورود اطلاعات حساس در برنامه).',
      },
    ],
    createdAt: '2026-06-05T14:00:00Z',
    updatedAt: '2026-06-08T08:45:00Z',
  },
  {
    id: 'onb_new_2001',
    type: 'new',
    businessName: 'آرایشی گل‌بانو',
    domain: 'golbanoo-shop.example.test',
    businessType: 'آرایشی و بهداشتی',
    templateId: 'tpl_beauty_lumen',
    planId: 'growth',
    brandColorPreference: 'صورتی و طلایی',
    brandAssets: [
      { key: 'logo', readiness: 'have' },
      { key: 'product_photos', readiness: 'need' },
      { key: 'product_list', readiness: 'have' },
      { key: 'about_text', readiness: 'need' },
      { key: 'contact_info', readiness: 'have' },
      { key: 'shipping_payment', readiness: 'need' },
    ],
    contactNote: 'لوگو و لیست محصولات آماده است؛ برای عکاسی محصول به کمک نیاز داریم.',
    status: 'awaiting_assets',
    statusHistory: [
      {
        status: 'submitted',
        date: '2026-06-02T12:00:00Z',
        note: 'درخواست راه‌اندازی فروشگاه ثبت شد.',
      },
      { status: 'under_review', date: '2026-06-03T09:30:00Z', note: 'دامنه و قالب بررسی شد.' },
      {
        status: 'awaiting_assets',
        date: '2026-06-04T15:10:00Z',
        note: 'در انتظار دریافت عکس محصولات و متن درباره ما.',
      },
    ],
    createdAt: '2026-06-02T12:00:00Z',
    updatedAt: '2026-06-04T15:10:00Z',
  },
  {
    id: 'onb_new_2002',
    type: 'new',
    businessName: 'پوشاک ترمه',
    domain: 'termeh-wear.example.test',
    businessType: 'پوشاک',
    templateId: 'tpl_pooshak_aurora',
    planId: 'pro',
    brandColorPreference: 'سرمه‌ای و کرم',
    brandAssets: [
      { key: 'logo', readiness: 'have' },
      { key: 'product_photos', readiness: 'have' },
      { key: 'product_list', readiness: 'have' },
      { key: 'about_text', readiness: 'have' },
      { key: 'contact_info', readiness: 'have' },
      { key: 'shipping_payment', readiness: 'have' },
    ],
    contactNote: 'همه دارایی‌های برند آماده است؛ لطفاً هرچه سریع‌تر راه‌اندازی شود.',
    status: 'provisioning',
    statusHistory: [
      { status: 'submitted', date: '2026-05-26T10:00:00Z' },
      { status: 'under_review', date: '2026-05-27T09:00:00Z' },
      {
        status: 'awaiting_assets',
        date: '2026-05-28T09:00:00Z',
        note: 'در انتظار دارایی‌های برند.',
      },
      {
        status: 'provisioning',
        date: '2026-06-01T13:20:00Z',
        note: 'تیم ما در حال ساخت فروشگاه است.',
      },
    ],
    createdAt: '2026-05-26T10:00:00Z',
    updatedAt: '2026-06-01T13:20:00Z',
  },
];
