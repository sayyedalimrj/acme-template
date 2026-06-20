/**
 * ippanel SMS provider — dispatches to Edge or legacy API based on `IPPANEL_PROVIDER`.
 */
import { env } from '../../env';
import { sendEdgePatternSms } from './edge';
import { sendLegacyPatternSms } from './legacy';
import type { IppanelProviderKind, SendOtpResult } from './types';

export type { SendOtpResult, IppanelProviderKind } from './types';
export { mobileToE164, looksLikeMessageBody } from './types';

function resolveProvider(): IppanelProviderKind {
  if (env.IPPANEL_PROVIDER === 'legacy') return 'legacy';
  if (env.IPPANEL_PROVIDER === 'edge') return 'edge';
  // Auto-detect from base URL when provider is unset/default.
  if (env.IPPANEL_BASE_URL.includes('edge.ippanel.com')) return 'edge';
  return 'legacy';
}

export async function sendOtpSms(mobile: string, code: string): Promise<SendOtpResult> {
  if (env.SMS_DRY_RUN) {
    // eslint-disable-next-line no-console
    console.log(`[sms:dry-run] OTP for ${mobile} = ${code}`);
    return { delivered: false, provider: 'dry_run' };
  }

  const provider = resolveProvider();
  if (provider === 'edge') {
    return sendEdgePatternSms(mobile, code);
  }
  return sendLegacyPatternSms(mobile, code);
}
