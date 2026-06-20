/**
 * ippanel legacy pattern API (api.ippanel.com/v1/messages/patterns/send).
 */
import { env } from '../../env';
import { badGateway } from '../../util/errors';
import { type SendOtpResult } from './types';

export async function sendLegacyPatternSms(mobile: string, code: string): Promise<SendOtpResult> {
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

  const res = await fetch(`${env.IPPANEL_BASE_URL.replace(/\/+$/, '')}/messages/patterns/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error(`[sms:legacy] send failed (${res.status}): ${text.slice(0, 500)}`);
    throw badGateway('ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.', 'sms_delivery_failed');
  }

  let ref: string | undefined;
  try {
    const data = JSON.parse(text) as { data?: { message_id?: string | number } };
    ref = data?.data?.message_id !== undefined ? String(data.data.message_id) : undefined;
  } catch {
    /* ignore */
  }

  return { delivered: true, provider: 'ippanel', ref };
}
