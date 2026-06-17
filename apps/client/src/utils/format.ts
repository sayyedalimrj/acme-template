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

/**
 * Locale-aware money display for the (mock) commerce values.
 *
 * MOCK-ONLY presentation: there is no FX conversion or backend pricing. In the Persian
 * locale we relabel values as تومان (Toman) with Persian digits and no fraction — so the
 * Persian UI never shows "$". In English we keep the WooCommerce currency code (e.g. USD → $).
 */
export function formatMoney(amount: string, currency: string, locale = 'en'): string {
  const value = Number.parseFloat(amount);
  const safeValue = Number.isFinite(value) ? value : 0;
  if (locale === 'fa') {
    const formatted = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(
      Math.round(safeValue),
    );
    return `${formatted} تومان`;
  }
  return formatCurrency(amount, currency, 'en-US');
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
