/**
 * Secret redaction helpers (backend skeleton).
 *
 * Pure, dependency-free functions to (a) detect secret-like *field names* and (b) redact
 * secret-like *values* from free text and objects, so that logs, audit details, and error
 * payloads can never leak credentials. These NEVER log or return the raw value.
 * See `security-model.md`.
 */

/** The placeholder substituted for any redacted value. */
export const REDACTED = '[REDACTED]';

/**
 * Normalized secret-like field-name tokens. A field whose normalized name contains any of
 * these is treated as a raw-secret field by `containsSensitiveKey` / the credential policy.
 * "Normalized" = lowercased with `_`, `-`, and spaces removed.
 */
const SENSITIVE_KEY_TOKENS: readonly string[] = [
  'password',
  'applicationpassword',
  'consumersecret',
  'consumerkey',
  'apikey',
  'token',
  'tokenvalue',
  'accesstoken',
  'refreshtoken',
  'secret',
  'clientsecret',
  'authorization',
  'bearer',
  'basic',
  'privatekey',
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

/** True if a field name looks like it holds a secret. */
export function containsSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_TOKENS.some((token) => normalized.includes(token));
}

/**
 * Value-redaction patterns. Each replaces the secret-bearing portion of a string with
 * `[REDACTED]` while keeping surrounding context readable. These detect patterns only;
 * they never store or echo the matched value.
 */
const VALUE_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // "Authorization: Bearer <x>" / "Basic <x>"
  { pattern: /\b(bearer|basic)\s+[^\s,;"']+/gi, replacement: `$1 ${REDACTED}` },
  // key: value / key=value, where key is a sensitive word
  {
    pattern:
      /\b(application[\s_-]?password|consumer[\s_-]?secret|consumer[\s_-]?key|api[\s_-]?key|access[\s_-]?token|refresh[\s_-]?token|client[\s_-]?secret|private[\s_-]?key|password|authorization|token|secret)\b(\s*[:=]\s*)("?)[^"\s,;}]+\3/gi,
    replacement: `$1$2${REDACTED}`,
  },
  // WooCommerce REST key/secret prefixes (ck_… / cs_…)
  { pattern: /\b(?:ck|cs)_[A-Za-z0-9]{4,}/g, replacement: REDACTED },
  // JWT-like triplets (header.payload.signature)
  {
    pattern: /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g,
    replacement: REDACTED,
  },
];

/** Redact secret-like substrings from free text. Returns a safe string. */
export function redactSensitiveText(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }
  let out = value;
  for (const { pattern, replacement } of VALUE_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/** True if free text appears to contain a secret-like value. */
export function containsSensitiveText(value: string): boolean {
  return typeof value === 'string' && redactSensitiveText(value) !== value;
}

/**
 * Recursively redact an arbitrary value for safe logging/auditing:
 * - sensitive field names → `[REDACTED]`
 * - string values → `redactSensitiveText`
 * - primitives passed through; functions/symbols dropped
 * Depth-limited to avoid pathological inputs.
 */
export function redactDeep(input: unknown, maxDepth = 4): unknown {
  return redactInner(input, maxDepth);
}

function redactInner(input: unknown, depth: number): unknown {
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string') {
    return redactSensitiveText(input);
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }
  if (depth <= 0) {
    return REDACTED;
  }
  if (Array.isArray(input)) {
    return input.map((item) => redactInner(item, depth - 1));
  }
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      out[key] = containsSensitiveKey(key) ? REDACTED : redactInner(val, depth - 1);
    }
    return out;
  }
  // functions, symbols, bigint, etc. — not safe to serialize.
  return REDACTED;
}
