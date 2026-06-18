/**
 * Guards the merchant UI against technical platform jargon.
 *
 * The customer-facing client app must never show technical platform words. This test scans
 * every i18n string VALUE (en + fa) for an unambiguous set of forbidden terms. Keys/identifiers
 * are not scanned (developer-facing). If this fails, replace the wording with simple business
 * language (سایت / فروشگاه / سفارش‌ها / ...).
 */
import { describe, expect, it } from '@jest/globals';

import { catalog } from '@/i18n/strings';

/** Unambiguous technical terms that must not appear in any displayed string. */
const FORBIDDEN: readonly RegExp[] = [
  /WordPress/i,
  /WooCommerce/i,
  /\bplugin\b/i,
  /\bbackend\b/i,
  /\bconnector\b/i,
  /\btenant\b/i,
  /\bdatabase\b/i,
  /\bExpo\b/,
  /React Native/i,
  /GA4/i,
  /\bwebhook/i,
  /localStorage/i,
  /AsyncStorage/i,
  /secure[ -]?store/i,
  /وردپرس/,
  /ووکامرس/,
  /افزونه/,
  /پلاگین/,
];

describe('forbidden technical words', () => {
  it.each(['en', 'fa'] as const)('are absent from all %s string values', (locale) => {
    const offenders: string[] = [];
    for (const [key, value] of Object.entries(catalog[locale])) {
      for (const pattern of FORBIDDEN) {
        if (pattern.test(value)) {
          offenders.push(`${key}: "${value}" matched ${pattern}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
