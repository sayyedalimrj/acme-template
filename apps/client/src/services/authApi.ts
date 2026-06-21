/**
 * Backend auth client (phone OTP).
 *
 * Talks to `services/api` (`/auth/otp/request`, `/auth/otp/verify`). Used only when a backend
 * is configured (`EXPO_PUBLIC_API_BASE_URL` or runtime `/config.json`); otherwise the app uses
 * the mock auth flow. The JWT is held in memory here and attached to future authorized data
 * requests.
 *
 * Security: no secrets live in the frontend. The token is a short-lived session reference issued
 * by our backend, never a store/provider credential.
 */
import { getApiBaseUrl } from '@/config/api.config';
import { getActivePortal } from '@/config/portal.config';
import type { AppPortal } from '@/domain/types';

import { clearStoredTokens, loadTokens, persistTokens } from './tokenStorage';

// Hydrate synchronously at module load so the very first authorized request after a page refresh
// already carries the persisted token (web localStorage is synchronous).
const hydrated = loadTokens();
let authToken: string | null = hydrated.token;
let refreshToken: string | null = hydrated.refreshToken;

export function setAuthToken(token: string | null): void {
  authToken = token;
  persistTokens({ token: authToken, refreshToken });
}

export function getAuthToken(): string | null {
  return authToken;
}

export function setRefreshToken(token: string | null): void {
  refreshToken = token;
  persistTokens({ token: authToken, refreshToken });
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

/** Set both tokens at once (called on sign-in / refresh) and persist them. */
export function setSessionTokens(tokens: { token: string; refreshToken?: string | null }): void {
  authToken = tokens.token;
  if (tokens.refreshToken !== undefined) refreshToken = tokens.refreshToken;
  persistTokens({ token: authToken, refreshToken });
}

export function clearSessionTokens(): void {
  authToken = null;
  refreshToken = null;
  clearStoredTokens();
}

/** True when a refresh token is present (a session may be restorable across a reload). */
export function hasStoredSession(): boolean {
  return Boolean(refreshToken);
}

interface ApiErrorShape {
  error?: { code?: string; message?: string };
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.');
  }
  const data = (await res.json().catch(() => ({}))) as ApiErrorShape & Record<string, unknown>;
  if (!res.ok) {
    const code = data.error?.code;
    const byCode: Record<string, string> = {
      sms_delivery_failed: 'ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید.',
      sms_provider_misconfigured: 'سرویس پیامک پیکربندی نشده است. با پشتیبانی تماس بگیرید.',
      otp_rate_limited: data.error?.message ?? 'تعداد درخواست‌ها زیاد است. کمی بعد تلاش کنید.',
    };
    throw new Error(byCode[code ?? ''] ?? data.error?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.');
  }
  return data as T;
}

/** Authenticated PATCH (attaches the current access token). Used by profile completion. */
async function patchJson<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
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
  portal: AppPortal = getActivePortal(),
): Promise<RequestOtpResponse> {
  return postJson<RequestOtpResponse>('/auth/otp/request', { mobile, portal });
}

export interface VerifyOtpUser {
  id: string;
  name: string | null;
  mobile: string;
  role: string;
  /** Email (frontend-safe). Used to decide if the first-login profile is complete. */
  email?: string | null;
  /**
   * Optional profile photo URL. Frontend-safe (never a credential). Wired through to the
   * session avatar when present; backend upload/storage is a PR #58 item.
   */
  avatarUrl?: string | null;
}

export interface VerifyOtpResponse {
  token: string;
  accessToken: string;
  refreshToken: string;
  user: VerifyOtpUser;
  roles: string[];
  portal: AppPortal;
  allowedPortals: AppPortal[];
  tenantId?: string | null;
  /** Whether the user has completed the first-login profile (name + email). */
  profileComplete?: boolean;
}

export function verifyOtp(
  mobile: string,
  code: string,
  name?: string,
  portal: AppPortal = getActivePortal(),
): Promise<VerifyOtpResponse> {
  return postJson<VerifyOtpResponse>('/auth/otp/verify', { mobile, code, portal, name });
}

/** Exchange a refresh token for a new access token (used by the http client on 401). */
export async function refreshSession(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await postJson<VerifyOtpResponse>('/auth/refresh', { refreshToken });
    setSessionTokens({ token: res.accessToken ?? res.token, refreshToken: res.refreshToken });
    return true;
  } catch {
    clearSessionTokens();
    return false;
  }
}

/**
 * Restore a session from the persisted refresh token after a page reload / PWA relaunch.
 *
 * Returns the full session payload (user + portal + allowedPortals + profileComplete) on success
 * so the SessionProvider can rebuild state exactly as a fresh login would. On failure (no token,
 * expired/revoked, or network) it clears local tokens and returns null so the caller redirects to
 * login. The refresh token is rotated server-side on success.
 */
export async function restoreSession(): Promise<VerifyOtpResponse | null> {
  if (!refreshToken) return null;
  try {
    const res = await postJson<VerifyOtpResponse>('/auth/refresh', { refreshToken });
    setSessionTokens({ token: res.accessToken ?? res.token, refreshToken: res.refreshToken });
    return res;
  } catch {
    clearSessionTokens();
    return null;
  }
}

export interface CompleteProfileResponse {
  user: VerifyOtpUser;
  profileComplete: boolean;
}

/** Save the first-login profile (first + last name + email) server-side. */
export async function completeProfile(input: {
  firstName: string;
  lastName: string;
  email?: string;
}): Promise<CompleteProfileResponse> {
  return patchJson<CompleteProfileResponse>('/auth/profile', input);
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
