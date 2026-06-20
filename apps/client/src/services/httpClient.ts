/**
 * Shared authenticated HTTP client for the http data source.
 *
 * Attaches the Bearer access token to every request, maps backend errors to friendly messages,
 * and transparently refreshes the access token once on a 401 before retrying. No secrets are ever
 * stored here — only the short-lived session token issued by OUR backend.
 */
import { getApiBaseUrl } from '@/config/api.config';

import { getAuthToken, refreshSession } from './authApi';

interface ApiErrorShape {
  error?: { code?: string; message?: string };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'network_error', 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.');
  }

  // Refresh once on expiry, then retry the original request.
  if (res.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(method, path, body, false);
  }

  const data = (await res.json().catch(() => ({}))) as ApiErrorShape & Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error?.code ?? 'error',
      data.error?.message ?? 'خطایی رخ داد. دوباره تلاش کنید.',
    );
  }
  return data as T;
}

export const http = {
  get: <T>(path: string): Promise<T> => request<T>('GET', path),
  post: <T>(path: string, body?: unknown): Promise<T> => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown): Promise<T> => request<T>('PATCH', path, body),
  del: <T>(path: string): Promise<T> => request<T>('DELETE', path),
};

/** Build a query string from a params object (skips undefined/null). */
export function qs(params: Record<string, unknown>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}
