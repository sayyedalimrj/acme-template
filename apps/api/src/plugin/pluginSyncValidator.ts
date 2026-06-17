/**
 * Plugin sync validators (backend skeleton).
 *
 * Pure validators that reject/flag unsafe inbound sync payloads BEFORE any ingestion: raw
 * secrets, raw PII (email/phone/address/IP/user-agent), oversized resource arrays, and
 * obviously-unsafe shapes. Case/format-insensitive (catches both `consumer_secret` and
 * `consumerSecret`). No mutation, no network. See `security-model.md`.
 */
import { containsSensitiveKey } from '../security/redaction';
import {
  MAX_SYNC_RESOURCE_RECORDS,
  PLUGIN_SYNC_SCHEMA_VERSION,
  type PluginSyncEnvelope,
  type PluginSyncIssue,
  type PluginSyncPayload,
  type PluginSyncValidationResult,
} from './pluginSyncEnvelope';

/** Normalized PII field-name tokens that must never appear in a sync payload. */
const PII_KEY_TOKENS: readonly string[] = [
  'email',
  'phone',
  'address',
  'ipaddress',
  'useragent',
  'firstname',
  'lastname',
  'fullname',
];

/** Email-shaped value detector. */
const EMAIL_VALUE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
/** Long digit run (phone-like) detector. */
const PHONE_VALUE = /\d{10,}/;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

function isPiiKey(key: string): boolean {
  const normalized = normalizeKey(key);
  return PII_KEY_TOKENS.some((token) => normalized.includes(token));
}

interface WalkVisitor {
  (key: string, value: unknown, path: string): void;
}

/** Depth-limited recursive walk over an arbitrary value, invoking `visit` for each keyed field. */
function walk(value: unknown, visit: WalkVisitor, path = '', depth = 6): void {
  if (value === null || typeof value !== 'object' || depth <= 0) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, `${path}[${index}]`, depth - 1));
    return;
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const childPath = path === '' ? key : `${path}.${key}`;
    visit(key, val, childPath);
    walk(val, visit, childPath, depth - 1);
  }
}

/** Reject raw secret-like fields anywhere in the payload (key-based, case-insensitive). */
export function validateNoRawSecrets(payload: unknown): PluginSyncIssue[] {
  const issues: PluginSyncIssue[] = [];
  walk(payload, (key, _value, path) => {
    if (containsSensitiveKey(key)) {
      issues.push({
        code: 'raw_secret_field',
        message: `Secret-like field "${key}" is not allowed.`,
        path,
      });
    }
  });
  return issues;
}

/** Reject raw PII anywhere in the payload (key-based + value-pattern). */
export function validateNoRawPII(payload: unknown): PluginSyncIssue[] {
  const issues: PluginSyncIssue[] = [];
  walk(payload, (key, value, path) => {
    if (isPiiKey(key)) {
      issues.push({
        code: 'raw_pii_field',
        message: `PII-like field "${key}" is not allowed.`,
        path,
      });
      return;
    }
    if (typeof value === 'string') {
      if (EMAIL_VALUE.test(value)) {
        issues.push({
          code: 'raw_pii_value_email',
          message: 'An email-shaped value is not allowed.',
          path,
        });
      } else if (PHONE_VALUE.test(value)) {
        issues.push({
          code: 'raw_pii_value_phone',
          message: 'A phone-shaped value is not allowed.',
          path,
        });
      }
    }
  });
  return issues;
}

/** Flag resource arrays that exceed the backend cap. */
export function validateResourceCaps(payload: PluginSyncPayload | undefined): PluginSyncIssue[] {
  const issues: PluginSyncIssue[] = [];
  if (!payload) {
    return issues;
  }
  const lists: Array<[string, unknown]> = [
    ['products', payload.products],
    ['orders', payload.orders],
    ['customers', payload.customers],
  ];
  for (const [name, list] of lists) {
    if (list !== undefined && !Array.isArray(list)) {
      issues.push({
        code: 'invalid_resource_list',
        message: `"${name}" must be an array.`,
        path: name,
      });
    } else if (Array.isArray(list) && list.length > MAX_SYNC_RESOURCE_RECORDS) {
      issues.push({
        code: 'resource_list_oversize',
        message: `"${name}" exceeds the maximum of ${MAX_SYNC_RESOURCE_RECORDS} records.`,
        path: name,
      });
    }
  }
  const recent = payload.events?.recent;
  if (recent !== undefined && Array.isArray(recent) && recent.length > MAX_SYNC_RESOURCE_RECORDS) {
    issues.push({
      code: 'resource_list_oversize',
      message: `"events.recent" exceeds the maximum of ${MAX_SYNC_RESOURCE_RECORDS} records.`,
      path: 'events.recent',
    });
  }
  return issues;
}

/** Normalize a payload: ensure arrays exist and are trimmed to the cap. Pure (returns a copy). */
export function normalizePluginSyncPayload(
  payload: PluginSyncPayload | undefined,
): PluginSyncPayload {
  const trim = (list: unknown): Array<Record<string, unknown>> =>
    Array.isArray(list)
      ? (list.slice(0, MAX_SYNC_RESOURCE_RECORDS) as Array<Record<string, unknown>>)
      : [];

  return {
    connection: payload?.connection,
    storeSummary: payload?.storeSummary,
    products: trim(payload?.products),
    orders: trim(payload?.orders),
    customers: trim(payload?.customers),
    events: payload?.events
      ? { count: Number(payload.events.count) || 0, recent: trim(payload.events.recent) }
      : undefined,
    health: payload?.health,
  };
}

/** Validate a full sync envelope. Returns aggregated errors/warnings (no values leaked). */
export function validatePluginSyncEnvelope(
  envelope: PluginSyncEnvelope | undefined,
): PluginSyncValidationResult {
  const errors: PluginSyncIssue[] = [];
  const warnings: PluginSyncIssue[] = [];

  if (!envelope || typeof envelope !== 'object') {
    errors.push({ code: 'invalid_envelope', message: 'Envelope must be an object.' });
    return { valid: false, errors, warnings };
  }
  if (envelope.schemaVersion !== PLUGIN_SYNC_SCHEMA_VERSION) {
    warnings.push({
      code: 'schema_version_mismatch',
      message: `Expected schemaVersion "${PLUGIN_SYNC_SCHEMA_VERSION}".`,
      path: 'schemaVersion',
    });
  }
  if (
    !envelope.source ||
    typeof envelope.source.siteUrl !== 'string' ||
    envelope.source.siteUrl === ''
  ) {
    errors.push({
      code: 'missing_source',
      message: 'A source with siteUrl is required.',
      path: 'source',
    });
  }
  if (!envelope.payload || typeof envelope.payload !== 'object') {
    errors.push({
      code: 'missing_payload',
      message: 'A payload object is required.',
      path: 'payload',
    });
  }

  errors.push(...validateNoRawSecrets(envelope.payload));
  errors.push(...validateNoRawPII(envelope.payload));
  errors.push(...validateResourceCaps(envelope.payload));

  return { valid: errors.length === 0, errors, warnings };
}
