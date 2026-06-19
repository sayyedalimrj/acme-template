/**
 * OTP service: generate, store (hashed), rate-limit, and verify one-time codes.
 *
 * Security: raw codes are never stored — only an HMAC-SHA256 hash with a server pepper. Codes
 * are short-lived, attempt-limited, single-use, and per-mobile rate-limited.
 */
import { createHmac, randomInt } from 'node:crypto';

import { env, isProduction } from '../env';
import { query, queryOne } from '../db';
import type { Portal } from '../auth/rbac';
import { badRequest, tooMany } from '../util/errors';
import { sendOtpSms } from '../providers/ippanel';

interface OtpRow {
  id: string;
  code_hash: string;
  portal: string;
  attempts: number;
  expires_at: string;
}

function hashCode(mobile: string, code: string): string {
  return createHmac('sha256', env.OTP_HASH_SECRET).update(`${mobile}:${code}`).digest('hex');
}

function generateCode(): string {
  const max = 10 ** env.OTP_LENGTH;
  return String(randomInt(0, max)).padStart(env.OTP_LENGTH, '0');
}

export interface RequestOtpResult {
  expiresInSeconds: number;
  delivered: boolean;
  /** Only present in non-production dry-run so you can test without real SMS. */
  devCode?: string;
}

export async function requestOtp(
  mobile: string,
  portal: Portal,
  ip?: string,
): Promise<RequestOtpResult> {
  const recent = await queryOne<{ count: string }>(
    `SELECT count(*)::int AS count FROM otp_code
       WHERE mobile = $1 AND created_at > now() - interval '1 hour'`,
    [mobile],
  );
  if (recent && Number(recent.count) >= env.OTP_REQUESTS_PER_HOUR) {
    throw tooMany('تعداد درخواست کد امروز زیاد است. بعداً تلاش کنید.');
  }

  const last = await queryOne<{ created_at: string }>(
    `SELECT created_at FROM otp_code WHERE mobile = $1 ORDER BY created_at DESC LIMIT 1`,
    [mobile],
  );
  if (last) {
    const elapsed = (Date.now() - new Date(last.created_at).getTime()) / 1000;
    if (elapsed < env.OTP_RESEND_COOLDOWN_SECONDS) {
      throw tooMany('کمی صبر کنید و دوباره کد بخواهید.');
    }
  }

  const code = generateCode();
  await query(
    `INSERT INTO otp_code (mobile, code_hash, portal, expires_at, request_ip)
       VALUES ($1, $2, $3, now() + ($4 || ' seconds')::interval, $5)`,
    [mobile, hashCode(mobile, code), portal, String(env.OTP_TTL_SECONDS), ip ?? null],
  );

  const sms = await sendOtpSms(mobile, code);

  return {
    expiresInSeconds: env.OTP_TTL_SECONDS,
    delivered: sms.delivered,
    devCode: !sms.delivered && !isProduction ? code : undefined,
  };
}

/** Verify a code; returns true on success (and consumes it), throws a safe error otherwise. */
export async function verifyOtp(mobile: string, code: string, portal: Portal): Promise<void> {
  const row = await queryOne<OtpRow>(
    `SELECT id, code_hash, portal, attempts, expires_at FROM otp_code
       WHERE mobile = $1 AND consumed_at IS NULL AND expires_at > now()
       ORDER BY created_at DESC LIMIT 1`,
    [mobile],
  );
  if (!row) {
    throw badRequest('کد منقضی شده یا یافت نشد. دوباره کد بخواهید.', 'otp_expired');
  }
  if (row.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw tooMany('تعداد تلاش‌ها زیاد شد. کد جدید بخواهید.');
  }
  if (row.portal !== portal) {
    throw badRequest('این کد برای این پنل صادر نشده است.', 'otp_portal_mismatch');
  }
  if (row.code_hash !== hashCode(mobile, code)) {
    await query(`UPDATE otp_code SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    throw badRequest('کد واردشده نادرست است.', 'otp_invalid');
  }
  await query(`UPDATE otp_code SET consumed_at = now() WHERE id = $1`, [row.id]);
}
