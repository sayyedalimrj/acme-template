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
let refreshToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setRefreshToken(token: string | null): void {
  refreshToken = token;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

/** Set both tokens at once (called on sign-in / refresh). */
export function setSessionTokens(tokens: { token: string; refreshToken?: string | null }): void {
  authToken = tokens.token;
  if (tokens.refreshToken !== undefined) refreshToken = tokens.refreshToken;
}

export function clearSessionTokens(): void {
  authToken = null;
  refreshToken = null;
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
  refreshToken: string;
  user: { id: string; name: string | null; mobile: string; role: string };
  portal?: string;
  tenantId?: string | null;
}

export function verifyOtp(
  mobile: string,
  code: string,
  name?: string,
  portal: AppPortal = ACTIVE_PORTAL,
): Promise<VerifyOtpResponse> {
  return postJson<VerifyOtpResponse>('/auth/otp/verify', { mobile, code, portal, name });
}

/** Exchange a refresh token for a new access token (used by the http client on 401). */
export async function refreshSession(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await postJson<VerifyOtpResponse>('/auth/refresh', { refreshToken });
    setSessionTokens({ token: res.token, refreshToken: res.refreshToken });
    return true;
  } catch {
    clearSessionTokens();
    return false;
  }
}

/** Revoke the current refresh session on the backend (best-effort) and clear local tokens. */
export async function logoutSession(): Promise<void> {
  const rt = refreshToken;
  clearSessionTokens();
  if (!rt) return;
  try {
    await postJson('/auth/logout', { refreshToken: rt });
  } catch {
    /* ignore network errors on logout */
  }
}
