/**
 * Display formatting for the admin/affiliate portals (Persian digits + Toman labels).
 * Money arrives from the backend as integer minor units (IRT = 0 decimals = Toman).
 */
const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

function groupThousands(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Format integer minor units (Toman) as a Persian label, e.g. "۴۹۰٬۰۰۰ تومان". */
export function tomanLabel(minor: number | string): string {
  const value = Number(minor) || 0;
  return `${toFaDigits(groupThousands(value)).replace(/,/g, '٬')} تومان`;
}

/** Format basis points as a Persian percent label, e.g. 2000 → "۲۰٪". */
export function bpsPercentLabel(bps: number | string): string {
  const pct = (Number(bps) || 0) / 100;
  return `${toFaDigits(pct % 1 === 0 ? String(pct) : pct.toFixed(1))}٪`;
}

export function countFa(n: number | string): string {
  return toFaDigits(groupThousands(Number(n) || 0));
}
