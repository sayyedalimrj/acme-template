/**
 * ippanel Edge API — pattern SMS (https://edge.ippanel.com/v1).
 *
 * POST /api/send with Authorization header set to the raw API key (no AccessKey prefix).
 */
import { env } from '../../env';
import { badGateway } from '../../util/errors';
import { mobileToE164, type SendOtpResult } from './types';

export async function sendEdgePatternSms(mobile: string, code: string): Promise<SendOtpResult> {
  const url = `${env.IPPANEL_BASE_URL.replace(/\/+$/, '')}/api/send`;
  const recipient = mobileToE164(mobile);

  const body = {
    sending_type: 'pattern',
    from_number: env.IPPANEL_ORIGINATOR,
    code: env.IPPANEL_PATTERN_CODE,
    recipients: [recipient],
    params: {
      [env.IPPANEL_OTP_VARIABLE]: code,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: env.IPPANEL_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    // eslint-disable-next-line no-console
    console.error(`[sms:edge] send failed (${res.status}): ${text.slice(0, 500)}`);
    throw badGateway('ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.', 'sms_delivery_failed');
  }

  let ref: string | undefined;
  try {
    const json = JSON.parse(text) as {
      data?: { message_id?: string | number; bulk_id?: string | number };
      meta?: { message?: string };
    };
    const id = json?.data?.message_id ?? json?.data?.bulk_id;
    ref = id !== undefined ? String(id) : undefined;
  } catch {
    /* non-json success body is ok */
  }

  return { delivered: true, provider: 'ippanel', ref };
}
