/**
 * Secret redaction for logs, audit details, and error payloads. Never logs/returns raw secrets.
 * Ported from the apps/api design contracts into the runnable backend.
 */
export const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_TOKENS: readonly string[] = [
  'password',
  'applicationpassword',
  'consumersecret',
  'consumerkey',
  'apikey',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'clientsecret',
  'signingsecret',
  'authorization',
  'bearer',
  'privatekey',
  'ciphertext',
  'authtag',
];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

export function containsSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_TOKENS.some((token) => normalized.includes(token));
}

const VALUE_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  { pattern: /\b(bearer|basic)\s+[^\s,;"']+/gi, replacement: `$1 ${REDACTED}` },
  {
    pattern:
      /\b(application[\s_-]?password|consumer[\s_-]?secret|consumer[\s_-]?key|api[\s_-]?key|access[\s_-]?token|refresh[\s_-]?token|client[\s_-]?secret|signing[\s_-]?secret|private[\s_-]?key|password|authorization|token|secret)\b(\s*[:=]\s*)("?)[^"\s,;}]+\3/gi,
    replacement: `$1$2${REDACTED}`,
  },
  { pattern: /\b(?:ck|cs)_[A-Za-z0-9]{4,}/g, replacement: REDACTED },
  { pattern: /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g, replacement: REDACTED },
];

export function redactSensitiveText(value: string): string {
  if (typeof value !== 'string' || value.length === 0) return value;
  let out = value;
  for (const { pattern, replacement } of VALUE_PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

export function redactDeep(input: unknown, maxDepth = 4): unknown {
  return redactInner(input, maxDepth);
}

function redactInner(input: unknown, depth: number): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return redactSensitiveText(input);
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (depth <= 0) return REDACTED;
  if (Array.isArray(input)) return input.map((item) => redactInner(item, depth - 1));
  if (typeof input === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      out[key] = containsSensitiveKey(key) ? REDACTED : redactInner(val, depth - 1);
    }
    return out;
  }
  return REDACTED;
}
