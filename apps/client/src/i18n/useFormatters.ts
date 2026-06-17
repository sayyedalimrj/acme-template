/**
 * useFormatters — locale-bound display formatters.
 *
 * Binds the pure Intl helpers in utils/format to the active i18n locale so screens render
 * money, numbers and dates natively per language (Persian digits + تومان + Jalali dates in
 * fa; en-US + USD in en) without threading `locale` through every call site.
 *
 * Presentation-only: no FX conversion, no backend, no real pricing (see formatMoney).
 */
import { useMemo } from 'react';

import { formatDate, formatDateTime, formatMoney, formatNumber } from '@/utils/format';

import { useLocale } from './I18nProvider';

/** Map the app locale to a full BCP-47 tag Intl understands well across engines. */
function intlLocale(locale: string): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}

export interface Formatters {
  /** Money for mock commerce values — تومان in fa, currency code in en. */
  money: (amount: string, currency: string) => string;
  /** Locale-aware number (Persian digits in fa). */
  num: (value: number) => string;
  /** Locale-aware medium date (Jalali in fa via Intl). */
  date: (iso: string) => string;
  /** Locale-aware date + time. */
  dateTime: (iso: string) => string;
}

export function useFormatters(): Formatters {
  const { locale } = useLocale();
  return useMemo<Formatters>(() => {
    const intl = intlLocale(locale);
    return {
      money: (amount, currency) => formatMoney(amount, currency, locale),
      num: (value) => formatNumber(value, intl),
      date: (iso) => formatDate(iso, intl),
      dateTime: (iso) => formatDateTime(iso, intl),
    };
  }, [locale]);
}
