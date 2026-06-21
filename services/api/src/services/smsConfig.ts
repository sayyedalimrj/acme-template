/**
 * SMS configuration validation — fail fast when real SMS is enabled.
 */
import { env } from '../env';
import { looksLikeMessageBody, type IppanelProviderKind } from '../providers/ippanel/types';

function resolveProvider(): IppanelProviderKind {
  if (env.IPPANEL_PROVIDER === 'legacy') return 'legacy';
  if (env.IPPANEL_PROVIDER === 'edge') return 'edge';
  if (env.IPPANEL_BASE_URL.includes('edge.ippanel.com')) return 'edge';
  return 'legacy';
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Validate ippanel settings when SMS_DRY_RUN=false. Exits the process on misconfiguration. */
export function validateSmsConfigAtStartup(): void {
  if (env.SMS_DRY_RUN) return;

  const errors: string[] = [];
  const provider = resolveProvider();

  if (!env.IPPANEL_API_KEY.trim()) {
    errors.push('IPPANEL_API_KEY is required when SMS_DRY_RUN=false');
  }
  if (!env.IPPANEL_PATTERN_CODE.trim()) {
    errors.push('IPPANEL_PATTERN_CODE is required when SMS_DRY_RUN=false');
  } else if (looksLikeMessageBody(env.IPPANEL_PATTERN_CODE)) {
    errors.push(
      'IPPANEL_PATTERN_CODE must be the ippanel pattern slug (e.g. ebvqrqy10gm3o04), not a message body',
    );
  }
  if (!env.IPPANEL_ORIGINATOR.trim()) {
    errors.push('IPPANEL_ORIGINATOR is required when SMS_DRY_RUN=false (e.g. +983000505)');
  }
  if (!env.IPPANEL_OTP_VARIABLE.trim()) {
    errors.push('IPPANEL_OTP_VARIABLE is required when SMS_DRY_RUN=false (e.g. verification-code)');
  }
  if (!isValidHttpUrl(env.IPPANEL_BASE_URL)) {
    errors.push(`IPPANEL_BASE_URL must be a valid http(s) URL (got "${env.IPPANEL_BASE_URL}")`);
  }
  if (env.IPPANEL_PROVIDER !== 'edge' && env.IPPANEL_PROVIDER !== 'legacy') {
    errors.push(`IPPANEL_PROVIDER must be "edge" or "legacy" (got "${env.IPPANEL_PROVIDER}")`);
  }
  if (provider === 'edge' && !env.IPPANEL_BASE_URL.includes('edge.ippanel.com')) {
    errors.push('IPPANEL_PROVIDER=edge requires IPPANEL_BASE_URL=https://edge.ippanel.com/v1');
  }

  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[sms] Misconfiguration (SMS_DRY_RUN=false):\n' + errors.map((e) => `  - ${e}`).join('\n'));
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[sms] Real SMS enabled via ippanel ${provider} (${env.IPPANEL_BASE_URL})`);
}
