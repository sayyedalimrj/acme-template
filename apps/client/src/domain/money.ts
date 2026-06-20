/**
 * Money conversion between the backend (integer MINOR units) and the app domain (decimal string,
 * WooCommerce convention). Currency exponent decides the decimal places (IRT/IRR = 0).
 */
const CURRENCY_EXPONENT: Record<string, number> = {
  IRR: 0,
  IRT: 0,
  JPY: 0,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export function currencyExponent(currency: string): number {
  return CURRENCY_EXPONENT[(currency ?? '').toUpperCase()] ?? 2;
}

/** Integer minor units → decimal string (e.g. 185050 USD → "1850.50"). */
export function minorToMoney(minor: number | string, currency: string): string {
  const exp = currencyExponent(currency);
  const value = Number(minor) / 10 ** exp;
  return value.toFixed(exp);
}
