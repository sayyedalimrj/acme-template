/**
 * ippanel SMS provider (https://ippanel.com) — OTP delivery via an approved pattern.
 *
 * Sends the OTP code using ippanel's pattern API. The API key lives ONLY in server env
 * (`IPPANEL_API_KEY`), never in the frontend or git. When `SMS_DRY_RUN=true` (or keys are
 * missing) nothing is sent and the code is logged so you can wire/test the flow first.
 *
 * The auth header scheme is configurable because ippanel has used a couple of variants:
 *   - `accesskey` →  Authorization: AccessKey <key>
 *   - `apikey`    →  apikey: <key>
 * and the OTP variable name inside your pattern is configurable too (`IPPANEL_OTP_VARIABLE`).
 */
import { env } from '../env';

export interface SendOtpResult {
  delivered: boolean;
  provider: 'ippanel' | 'dry_run';
  ref?: string;
}

function isConfigured(): boolean {
  return Boolean(env.IPPANEL_API_KEY && env.IPPANEL_PATTERN_CODE && env.IPPANEL_ORIGINATOR);
}

export async function sendOtpSms(mobile: string, code: string): Promise<SendOtpResult> {
  if (env.SMS_DRY_RUN || !isConfigured()) {
    // eslint-disable-next-line no-console
    console.log(`[sms:dry-run] OTP for ${mobile} = ${code} (configure ippanel to send real SMS)`);
    return { delivered: false, provider: 'dry_run' };
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.IPPANEL_AUTH_SCHEME === 'apikey') {
    headers.apikey = env.IPPANEL_API_KEY;
  } else {
    headers.Authorization = `AccessKey ${env.IPPANEL_API_KEY}`;
  }

  const body = {
    pattern_code: env.IPPANEL_PATTERN_CODE,
    originator: env.IPPANEL_ORIGINATOR,
    recipient: mobile,
    values: { [env.IPPANEL_OTP_VARIABLE]: code },
  };

  const res = await fetch(`${env.IPPANEL_BASE_URL}/messages/patterns/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ippanel send failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json().catch(() => ({}))) as { data?: { message_id?: string | number } };
  const ref = data?.data?.message_id;
  return { delivered: true, provider: 'ippanel', ref: ref !== undefined ? String(ref) : undefined };
}
