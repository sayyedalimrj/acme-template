/**
 * Pure helpers for the mock auth flow.
 *
 * No network, no SMS/email, no persistence, no secrets — these are deterministic, in-memory
 * utilities only. The "OTP" is a fixed demo code; nothing is ever sent or validated against a
 * provider. See the auth feature screens for usage.
 */

/** Number of digits in the (mock) OTP code. */
export const OTP_LENGTH = 4;

/** Deterministic demo OTP code. Not a secret — purely for local/testing UX. */
export const MOCK_OTP_CODE = '1234';

/** What an entered identifier was detected as. */
export type IdentifierChannel = 'email' | 'mobile' | 'unknown';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Convert Persian/Arabic digit glyphs to ASCII digits; pass other characters through. */
export function toAsciiDigits(value: string): string {
  return value.replace(/[\u06F0-\u06F9\u0660-\u0669]/g, (glyph) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(glyph);
    if (persianIndex >= 0) {
      return String(persianIndex);
    }
    const arabicIndex = ARABIC_DIGITS.indexOf(glyph);
    if (arabicIndex >= 0) {
      return String(arabicIndex);
    }
    return glyph;
  });
}

/** Normalize a mobile entry: ASCII digits, no spaces/dashes/parens/dots, keep a leading `+`. */
export function normalizeMobile(value: string): string {
  const ascii = toAsciiDigits(value).trim();
  return ascii.replace(/[\s\-().]/g, '');
}

/** Simple, safe email check (no network). */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Digit/plus/leading-zero tolerant mobile check. Accepts an optional leading `+` or `00`
 * country prefix followed by 8–15 digits (tolerates Persian/Arabic digits + separators).
 */
export function isValidMobile(value: string): boolean {
  const normalized = normalizeMobile(value);
  return /^(\+|00)?\d{8,15}$/.test(normalized);
}

/** Detect whether an entered identifier is an email, a mobile number, or neither. */
export function detectIdentifier(value: string): IdentifierChannel {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return 'unknown';
  }
  if (trimmed.includes('@')) {
    return isValidEmail(trimmed) ? 'email' : 'unknown';
  }
  return isValidMobile(trimmed) ? 'mobile' : 'unknown';
}

/** True when an identifier is a usable email or mobile. */
export function isValidIdentifier(value: string): boolean {
  return detectIdentifier(value) !== 'unknown';
}

/** Mask an identifier for display on the OTP screen (never reveal the full value). */
export function maskIdentifier(value: string, channel?: IdentifierChannel): string {
  const trimmed = value.trim();
  const resolved = channel && channel !== 'unknown' ? channel : detectIdentifier(trimmed);

  if (resolved === 'email') {
    const atIndex = trimmed.indexOf('@');
    if (atIndex <= 0) {
      return trimmed;
    }
    const local = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex);
    const head = local.slice(0, 1);
    return `${head}•••${domain}`;
  }

  if (resolved === 'mobile') {
    const digits = normalizeMobile(trimmed);
    const visible = digits.slice(-3);
    const maskedCount = Math.max(digits.length - 3, 0);
    return `${'•'.repeat(maskedCount)}${visible}`;
  }

  return trimmed;
}

/** Result of the mock OTP "send". */
export interface SendOtpResult {
  code: string;
  channel: IdentifierChannel;
}

/**
 * Mock OTP "send". Returns a deterministic 4-digit code. NOTHING is sent: no SMS, no email, no
 * network, no provider. Purely for local/testing UX.
 */
export function sendOtpMock(identifier: string, channel?: IdentifierChannel): SendOtpResult {
  const resolved = channel && channel !== 'unknown' ? channel : detectIdentifier(identifier);
  return { code: MOCK_OTP_CODE, channel: resolved };
}

/** True when the OTP entry has all positions filled with a single digit each. */
export function isOtpComplete(digits: readonly string[]): boolean {
  return digits.length === OTP_LENGTH && digits.every((digit) => /^[0-9]$/.test(digit));
}

/** Join OTP digits into a single string. */
export function otpValue(digits: readonly string[]): string {
  return digits.join('');
}
