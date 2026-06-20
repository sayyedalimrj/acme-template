export interface SendOtpResult {
  delivered: boolean;
  provider: 'ippanel' | 'dry_run';
  ref?: string;
}

export type IppanelProviderKind = 'edge' | 'legacy';

/** Convert Iranian mobile `09xxxxxxxxx` to E.164 `+989xxxxxxxxx` for ippanel Edge API. */
export function mobileToE164(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.startsWith('09') && digits.length === 11) {
    return `+98${digits.slice(1)}`;
  }
  if (digits.startsWith('989') && digits.length === 12) {
    return `+${digits}`;
  }
  if (mobile.startsWith('+')) return mobile;
  return `+${digits}`;
}

/** Reject values that look like Persian message bodies rather than pattern codes. */
export function looksLikeMessageBody(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length > 64) return true;
  // Pattern codes are typically alphanumeric slugs; long Persian text is not a code.
  if (/[\u0600-\u06FF]/.test(trimmed)) return true;
  if (/\s/.test(trimmed)) return true;
  return false;
}
