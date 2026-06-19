/**
 * Subscription duration options for the simplified Plans screen.
 *
 * The merchant renews/extends their current plan by choosing a duration (1/3/6/12 months); the
 * longer the duration, the lower the effective monthly price. Prices are DISPLAY-ONLY Persian
 * numeral labels (toman) — never a real charge, no payment data. The currency word and the
 * "per month" / savings labels are localized via i18n.
 */
import type { StringKey } from '@/i18n/strings';

export type SubscriptionDurationMonths = 1 | 3 | 6 | 12;

export interface DurationOption {
  months: SubscriptionDurationMonths;
  /** i18n key for the short selector label, e.g. "۱ ماهه" / "1 month". */
  labelKey: StringKey;
  /** Display-only total amount for the whole period (Persian numerals, no currency word). */
  totalAmount: string;
  /** Display-only effective monthly amount (Persian numerals, no currency word). */
  perMonthAmount: string;
  /** Optional savings badge i18n key. */
  savingsKey?: StringKey;
}

/**
 * Derived from a base monthly price of ۴۹۰٬۰۰۰ تومان (the current "Growth" plan):
 *  - 1 mo: full price
 *  - 3 mo: ~5% off  → ۴۷۰٬۰۰۰/mo
 *  - 6 mo: ~10% off → ۴۴۱٬۰۰۰/mo
 *  - 12 mo: 2 months free → ۴۰۸٬۰۰۰/mo (matches the existing yearly price)
 */
export const DURATION_OPTIONS: readonly DurationOption[] = [
  {
    months: 1,
    labelKey: 'plans.duration.1',
    totalAmount: '۴۹۰٬۰۰۰',
    perMonthAmount: '۴۹۰٬۰۰۰',
  },
  {
    months: 3,
    labelKey: 'plans.duration.3',
    totalAmount: '۱٬۴۱۰٬۰۰۰',
    perMonthAmount: '۴۷۰٬۰۰۰',
    savingsKey: 'plans.duration.save5',
  },
  {
    months: 6,
    labelKey: 'plans.duration.6',
    totalAmount: '۲٬۶۴۶٬۰۰۰',
    perMonthAmount: '۴۴۱٬۰۰۰',
    savingsKey: 'plans.duration.save10',
  },
  {
    months: 12,
    labelKey: 'plans.duration.12',
    totalAmount: '۴٬۹۰۰٬۰۰۰',
    perMonthAmount: '۴۰۸٬۰۰۰',
    savingsKey: 'plans.duration.save2months',
  },
];

export const DEFAULT_DURATION_MONTHS: SubscriptionDurationMonths = 12;

export function findDuration(months: SubscriptionDurationMonths): DurationOption {
  return DURATION_OPTIONS.find((o) => o.months === months) ?? DURATION_OPTIONS[0];
}
