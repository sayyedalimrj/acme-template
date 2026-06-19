/**
 * Backend auth client (phone OTP).
 *
 * Talks to `services/api` (`/auth/otp/request`, `/auth/otp/verify`). Used only when a backend
 * is configured (`EXPO_PUBLIC_API_BASE_URL`); otherwise the app uses the mock auth flow. The
 * JWT is held in memory here and attached to future authorized data requests.
 *
 * Security: no secrets live in the frontend. The token is a short-lived session reference issued
 * by our backend, never a store/provider credential.
 */
import { API_BASE_URL } from '@/config/api.config';
import { ACTIVE_PORTAL } from '@/config/portal.config';
import type { AppPortal } from '@/domain/types';

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

interface ApiErrorShape {
  error?: { code?: string; message?: string };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.');
  }
  const data = (await res.json().catch(() => ({}))) as ApiErrorShape & Record<string, unknown>;
  if (!res.ok) {
    throw new Error(data.error?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.');
  }
  return data as T;
}

export interface RequestOtpResponse {
  ok: boolean;
  expiresInSeconds: number;
  delivered: boolean;
  /** Present only in non-production dry-run (so you can test without real SMS). */
  devCode?: string;
}

export function requestOtp(
  mobile: string,
  portal: AppPortal = ACTIVE_PORTAL,
): Promise<RequestOtpResponse> {
  return postJson<RequestOtpResponse>('/auth/otp/request', { mobile, portal });
}

export interface VerifyOtpResponse {
  token: string;
  user: { id: string; name: string | null; mobile: string; role: string };
}

export function verifyOtp(
  mobile: string,
  code: string,
  name?: string,
  portal: AppPortal = ACTIVE_PORTAL,
): Promise<VerifyOtpResponse> {
  return postJson<VerifyOtpResponse>('/auth/otp/verify', { mobile, code, portal, name });
}
