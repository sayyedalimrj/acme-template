/**
 * Redaction & diagnostics contract (skeleton).
 *
 * Pure, dependency-free helpers to keep support diagnostics safe. `redactPluginDiagnosticText`
 * removes secret-like values from free text; `PluginDiagnosticReport` is the safe report
 * shape. Diagnostics must NEVER include raw credentials, wp-admin/hosting/FTP/cPanel
 * credentials, full customer PII, or full order payloads. Compatible in spirit with the
 * backend `redactSensitiveText` (not imported, to avoid coupling). See `../SECURITY.md`.
 */
import type { PluginHealthCheck } from './health-check-contract';
import type { SiteId } from './site-identity';

/** The placeholder substituted for any redacted value. */
export const REDACTED = '[REDACTED]';

/** A named redaction rule. Patterns detect secret-bearing text; values are never stored. */
export interface DiagnosticRedactionRule {
  id: string;
  /** Safe description of what the rule removes. */
  description: string;
  pattern: RegExp;
  replacement: string;
}

/**
 * Redaction rules. Each must catch the secret-like tokens required by the security model:
 * password, application password, consumer key, consumer secret, api key, token,
 * authorization, bearer, basic, cookie, nonce, and webhook secret.
 */
export const DIAGNOSTIC_REDACTION_RULES: DiagnosticRedactionRule[] = [
  {
    id: 'authorization_header',
    description: 'Authorization: Bearer/Basic <value>',
    pattern: /\b(bearer|basic)\s+[^\s,;"']+/gi,
    replacement: `$1 ${REDACTED}`,
  },
  {
    id: 'sensitive_key_value',
    description:
      'key:value / key=value for password, application password, consumer key/secret, api key, token, secret, authorization, cookie, nonce, webhook secret',
    pattern:
      /\b(application[\s_-]?password|consumer[\s_-]?secret|consumer[\s_-]?key|api[\s_-]?key|webhook[\s_-]?secret|authorization|password|secret|token|cookie|nonce)\b(\s*[:=]\s*)("?)[^"\s,;}]+\3/gi,
    replacement: `$1$2${REDACTED}`,
  },
  {
    id: 'woocommerce_key_prefix',
    description: 'WooCommerce REST key/secret prefixes (ck_… / cs_…)',
    pattern: /\b(?:ck|cs)_[A-Za-z0-9]{4,}/g,
    replacement: REDACTED,
  },
  {
    id: 'jwt_like',
    description: 'JWT-like triplets (header.payload.signature)',
    pattern: /\beyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g,
    replacement: REDACTED,
  },
];

/** Redact secret-like substrings from a free-text diagnostic value. Returns a safe string. */
export function redactPluginDiagnosticText(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    return value;
  }
  let out = value;
  for (const rule of DIAGNOSTIC_REDACTION_RULES) {
    out = out.replace(rule.pattern, rule.replacement);
  }
  return out;
}

/** True if a diagnostic string appears to contain a secret-like value. */
export function diagnosticTextContainsSecret(value: string): boolean {
  return typeof value === 'string' && redactPluginDiagnosticText(value) !== value;
}

/**
 * A safe support diagnostic report. Contains only non-secret environment facts and a health
 * summary. NEVER include raw credentials, admin/hosting/FTP credentials, full customer PII,
 * or full order payloads. Free-text `notes` should be passed through
 * `redactPluginDiagnosticText` before being attached.
 */
export interface PluginDiagnosticReport {
  siteId?: SiteId;
  /** Public site URL (frontend-safe). */
  siteUrl: string;
  pluginVersion: string;
  wordpress: { wpVersion: string; phpVersion: string };
  woocommerce: { active: boolean; wooCommerceVersion?: string };
  /** Optional rolled-up health snapshot. */
  health?: PluginHealthCheck;
  /** ISO-8601 timestamp. */
  generatedAt: string;
  /** Safe, redacted free-text notes (run through `redactPluginDiagnosticText`). */
  redactedNotes?: string;
}

/** Build a diagnostic report with `notes` redacted into `redactedNotes`. Pure; no secrets. */
export function buildSafeDiagnosticReport(
  input: Omit<PluginDiagnosticReport, 'redactedNotes'> & { notes?: string },
): PluginDiagnosticReport {
  const { notes, ...rest } = input;
  return {
    ...rest,
    ...(notes ? { redactedNotes: redactPluginDiagnosticText(notes) } : {}),
  };
}
