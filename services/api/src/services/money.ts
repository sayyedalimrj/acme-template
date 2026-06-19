/**
 * Money helpers. All money is stored/transported as integer MINOR units (e.g. rials) — never
 * floats. Convert WooCommerce decimal-string amounts to minor units using a currency exponent.
 */

/** Number of minor-unit decimal places per currency (ISO-4217-ish; default 2). */
const CURRENCY_EXPONENT: Record<string, number> = {
  IRR: 0,
  IRT: 0, // Toman (display); treated as 0-decimal
  JPY: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export function currencyExponent(currency: string): number {
  return CURRENCY_EXPONENT[currency?.toUpperCase?.()] ?? 2;
}

/** Convert a decimal-string major amount (e.g. "1850.50") to integer minor units. */
export function toMinorUnits(amount: string | number, currency: string): number {
  const exp = currencyExponent(currency);
  const num = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 10 ** exp);
}

/** Convert integer minor units back to a major-unit number (display only). */
export function fromMinorUnits(minor: number, currency: string): number {
  return minor / 10 ** currencyExponent(currency);
}
