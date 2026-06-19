/**
 * Iranian mobile-number normalization (Persian/Arabic digits → ASCII, prefixes → 09xxxxxxxxx).
 */
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toAsciiDigits(input: string): string {
  let out = '';
  for (const ch of input) {
    const p = PERSIAN_DIGITS.indexOf(ch);
    const a = ARABIC_DIGITS.indexOf(ch);
    if (p >= 0) out += String(p);
    else if (a >= 0) out += String(a);
    else out += ch;
  }
  return out;
}

/** Returns a normalized `09xxxxxxxxx` number, or null if it isn't a valid IR mobile. */
export function normalizeMobile(input: string): string | null {
  let d = toAsciiDigits(input).replace(/\D/g, '');
  if (d.startsWith('0098')) d = d.slice(4);
  else if (d.startsWith('98') && d.length === 12) d = d.slice(2);
  if (d.length === 10 && d.startsWith('9')) d = `0${d}`;
  return /^09\d{9}$/.test(d) ? d : null;
}
