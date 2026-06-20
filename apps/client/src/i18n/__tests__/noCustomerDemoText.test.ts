/**
 * Customer-facing copy must not reveal that any section is a demo/test/mock/experimental or
 * not-connected build (PR #57 Task 1). This scans every rendered i18n value (en + fa) for the
 * forbidden wording. Genuine product terms (free trial, inactive customers, portfolio, and the
 * "coming soon" roadmap label) are allowed.
 */
import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { en, fa } from '@/i18n/strings';

// Substrings that are legitimate product language and must NOT be flagged.
const ALLOW = ['دوره آزمایشی', 'مشتریان غیرفعال', 'نمونه‌کار', 'نمونه‌کارها'];

// Wording that must never reach a customer.
const FORBIDDEN: RegExp[] = [
  /\bmock\b/i,
  /\bdemo\b/i,
  /test code/i,
  /آزمایشی/, // e.g. «کد آزمایشی», «ورود آزمایشی» (allowed «دوره آزمایشی» is stripped first)
  /نمونه/, // e.g. «نمونه نمایشی» (allowed «نمونه‌کار» is stripped first)
  /دمو/,
  /پراکسی/,
  /\bbackend\b/i,
  /\bproxy\b/i,
  /فقط نمایشی/,
  /نمایشی\)/, // e.g. «ذخیره شد (نمایشی)»
  /پیام واقعی/,
  /متصل نیست/, // e.g. «ارائه‌دهنده متصل نیست»
  /وصل نیست/,
  /این بخش هنوز/,
  /هنوز.*وصل نیست/,
];

function offenders(catalog: Record<string, string>): string[] {
  const out: string[] = [];
  for (const [key, raw] of Object.entries(catalog)) {
    let value = raw;
    for (const a of ALLOW) value = value.split(a).join('');
    if (FORBIDDEN.some((re) => re.test(value))) out.push(`${key}: ${raw}`);
  }
  return out;
}

describe('customer-facing i18n has no demo/test/not-connected wording', () => {
  it('English catalog is clean', () => {
    expect(offenders(en as unknown as Record<string, string>)).toEqual([]);
  });

  it('Persian catalog is clean', () => {
    expect(offenders(fa)).toEqual([]);
  });
});


// Customer-facing copy also lives in a few helper/mock modules that aren't in the i18n catalog
// (AI media studio outputs, advisor replies, automation + support mock content, admin banners).
// Guard those rendered strings against demo/test/not-connected wording regressions too.
const SRC = join(__dirname, '..', '..');

// Tokens that must never appear in rendered customer-facing content of these modules.
const FORBIDDEN_TOKENS = [
  '(نمایشی)',
  '(نمونه)',
  'نمونه فروشگاه',
  'متصل نیست',
  'فقط برای بازبینی',
  'هیچ پیامی ارسال',
  'هیچ پیامکی ارسال',
  'پرداخت واقعی',
  'نمای نمایشی',
];

const SCANNED_FILES = [
  'features/media-studio/mediaStudioHelpers.ts',
  'features/advisor/advisorHelpers.ts',
  'mock/data/automation.ts',
  'mock/data/supportChat.ts',
  'features/admin/AdminMerchantDetailScreen.tsx',
  'features/products/ProductCreateScreen.tsx',
];

describe('customer-facing helper/mock modules have no demo/test wording', () => {
  it.each(SCANNED_FILES)('%s is clean', (rel) => {
    const content = readFileSync(join(SRC, rel), 'utf8');
    const hits = FORBIDDEN_TOKENS.filter((tok) => content.includes(tok));
    expect(hits).toEqual([]);
  });
});
