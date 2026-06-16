/**
 * Locale-aware formatting helpers built on the standard `Intl` API (available on Web,
 * Android, and iOS via Hermes/JSC). Monetary values arrive as decimal strings, matching
 * the WooCommerce convention.
 */

export function formatCurrency(amount: string, currency: string, locale = 'en'): string {
  const value = Number.parseFloat(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(safeValue);
  } catch {
    // Fallback when the currency code is unknown to the runtime.
    return `${currency} ${safeValue.toFixed(2)}`;
  }
}

export function formatNumber(value: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatDate(iso: string, locale = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(iso: string, locale = 'en'): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
