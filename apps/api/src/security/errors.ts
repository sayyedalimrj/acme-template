/**
 * Safe error model (backend skeleton).
 *
 * A `SafeApiError` is the only error shape that may cross the API boundary back to the
 * client. It carries a stable code, a safe human message, and optional **redacted** details
 * — and NEVER a stack trace, raw exception, or secret. See `security-model.md`.
 */
import { containsSensitiveKey, redactSensitiveText } from './redaction';

/** Stable, client-facing error codes. */
export type ApiErrorCode =
  | 'not_implemented'
  | 'not_configured'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'validation_error'
  | 'raw_secret_rejected'
  | 'rate_limited'
  | 'upstream_unavailable'
  | 'conflict'
  | 'internal_error';

/** Safe, serializable error returned to callers. No stack traces, no secrets. */
export interface SafeApiError {
  code: ApiErrorCode;
  /** Safe, human-readable message (no secrets, no stack). */
  message: string;
  /** Optional redacted, non-secret context. */
  details?: Record<string, string | number | boolean>;
  /** Whether the caller may safely retry. */
  retriable: boolean;
}

/** Discriminated result used across proxy/bridge/policy helpers. */
export type Result<T> = { ok: true; data: T } | { ok: false; error: SafeApiError };

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  not_implemented: 'This operation is not implemented in the backend skeleton.',
  not_configured: 'This integration is not configured yet.',
  unauthorized: 'Authentication is required.',
  forbidden: 'You do not have permission to perform this action.',
  not_found: 'The requested resource was not found.',
  validation_error: 'The request was invalid.',
  raw_secret_rejected: 'Raw secret-like fields are not accepted; send metadata only.',
  rate_limited: 'Too many requests. Please retry later.',
  upstream_unavailable: 'The upstream store is unavailable.',
  conflict: 'The request conflicts with the current state.',
  internal_error: 'An unexpected error occurred.',
};

const RETRIABLE_CODES: ReadonlySet<ApiErrorCode> = new Set<ApiErrorCode>([
  'rate_limited',
  'upstream_unavailable',
]);

/**
 * Redact error details: drop sensitive keys, redact string values, keep safe primitives.
 * Guarantees the returned object is safe to serialize to the client.
 */
export function redactErrorDetails(
  details?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!details) {
    return undefined;
  }
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(details)) {
    if (containsSensitiveKey(key)) {
      continue; // never surface secret-named fields at all
    }
    if (typeof value === 'string') {
      safe[key] = redactSensitiveText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    }
    // objects/arrays/functions intentionally dropped to keep the payload flat + safe.
  }
  return Object.keys(safe).length > 0 ? safe : undefined;
}

/** Build a safe error. `details` are always redacted before being attached. */
export function createSafeError(
  code: ApiErrorCode,
  message?: string,
  details?: Record<string, unknown>,
): SafeApiError {
  return {
    code,
    message: message ? redactSensitiveText(message) : DEFAULT_MESSAGES[code],
    details: redactErrorDetails(details),
    retriable: RETRIABLE_CODES.has(code),
  };
}

/** Convenience constructor for the most common skeleton response. */
export function notImplemented(details?: Record<string, unknown>): SafeApiError {
  return createSafeError('not_implemented', undefined, details);
}

/** Convenience constructor for unconfigured integrations (e.g. webhook verification). */
export function notConfigured(details?: Record<string, unknown>): SafeApiError {
  return createSafeError('not_configured', undefined, details);
}
