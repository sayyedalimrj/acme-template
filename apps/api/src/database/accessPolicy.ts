/**
 * Data visibility + RBAC access policy (design/contracts only — NO enforcement runtime).
 *
 * Defines the field/data VISIBILITY model and the role→visibility profiles for the future
 * platform. These are pure value maps and predicates: there is NO request pipeline, NO auth,
 * and NO database here. They exist so schema fields can be classified and so future
 * server-side enforcement has a single, reviewable source of truth.
 *
 * Principle: **least privilege + default deny.** `secret_never_expose` is in NO role profile
 * (raw secrets are never exposed to anyone); raw secrets are never stored in app tables at
 * all (see `schemaDesign.ts`). See `security-model.md`.
 */
import { findRawSecretFields } from '../security/credentialPolicy';
import type { ApiRole } from '../domain/user';
import type { SchemaTableName } from './schemaDesign';

/**
 * Visibility level of a field/value, from least to most sensitive.
 * - `public_safe`        — safe for anyone (e.g. plan key, public site URL).
 * - `tenant_safe`        — safe within the owning tenant.
 * - `support_safe`       — bounded fields support staff may view (display name, status).
 * - `billing_restricted` — billing metadata; billing role only.
 * - `security_restricted`— security metadata (signals, vault refs); security role only.
 * - `pii_restricted`     — raw PII (email/phone); gated + consent-bound.
 * - `secret_never_expose`— raw secrets; NEVER exposed and never stored in app tables.
 */
export type DataVisibilityLevel =
  | 'public_safe'
  | 'tenant_safe'
  | 'support_safe'
  | 'billing_restricted'
  | 'security_restricted'
  | 'pii_restricted'
  | 'secret_never_expose';

/** Extended platform role taxonomy (merchant + internal staff + system). */
export type PlatformRole = ApiRole | 'billing_admin' | 'security_admin';

/** Roles that represent a merchant principal (bound to a single tenant). */
export const MERCHANT_ROLES: readonly PlatformRole[] = ['owner', 'manager', 'staff', 'viewer'];

/** True for a merchant-tenant role. */
export function isMerchantRole(role: PlatformRole): boolean {
  return MERCHANT_ROLES.includes(role);
}

/** True for the always-denied secret level. */
export function isSecretLevel(level: DataVisibilityLevel): boolean {
  return level === 'secret_never_expose';
}

/**
 * Visibility levels each role may read. `secret_never_expose` appears in NO profile by
 * construction. Merchant roles see only their own tenant data (enforced separately by
 * `tenantIsolation.ts`); the levels here bound *what kind* of field a role may read.
 */
export const ROLE_VISIBILITY: Record<PlatformRole, readonly DataVisibilityLevel[]> = {
  owner: ['public_safe', 'tenant_safe', 'pii_restricted', 'billing_restricted'],
  manager: ['public_safe', 'tenant_safe', 'pii_restricted'],
  staff: ['public_safe', 'tenant_safe'],
  viewer: ['public_safe', 'tenant_safe'],
  support_admin: ['public_safe', 'tenant_safe', 'support_safe'],
  billing_admin: ['public_safe', 'tenant_safe', 'billing_restricted'],
  security_admin: ['public_safe', 'tenant_safe', 'support_safe', 'security_restricted'],
  system: ['public_safe', 'tenant_safe'],
};

/**
 * Whether a role may read a given visibility level. Always false for `secret_never_expose`.
 * Pure predicate; not wired to any request.
 */
export function canRoleAccessVisibility(role: PlatformRole, level: DataVisibilityLevel): boolean {
  if (isSecretLevel(level)) {
    return false;
  }
  return ROLE_VISIBILITY[role].includes(level);
}

/** A field's classification within a table. */
export interface FieldVisibility {
  table: SchemaTableName;
  field: string;
  visibility: DataVisibilityLevel;
}

/**
 * Visibility classification for the major sensitive/representative fields. Not exhaustive —
 * unlisted fields default to `tenant_safe` for tenant-scoped tables (see
 * `getFieldVisibility`). Raw secret fields are intentionally absent because they are NEVER
 * stored (see `schemaDesign.ts`); any such field name is treated as `secret_never_expose`.
 */
export const FIELD_VISIBILITY: readonly FieldVisibility[] = [
  { table: 'tenants', field: 'name', visibility: 'support_safe' },
  { table: 'tenants', field: 'plan', visibility: 'support_safe' },
  { table: 'tenants', field: 'status', visibility: 'support_safe' },
  { table: 'plans', field: 'key', visibility: 'public_safe' },
  { table: 'sites', field: 'displayName', visibility: 'support_safe' },
  { table: 'sites', field: 'url', visibility: 'tenant_safe' },
  { table: 'platform_users', field: 'displayName', visibility: 'support_safe' },
  { table: 'platform_users', field: 'emailRestricted', visibility: 'pii_restricted' },
  { table: 'synced_customers', field: 'label', visibility: 'tenant_safe' },
  { table: 'synced_customers', field: 'emailRestricted', visibility: 'pii_restricted' },
  { table: 'synced_customers', field: 'phoneRestricted', visibility: 'pii_restricted' },
  { table: 'subscriptions', field: 'providerCustomerRef', visibility: 'billing_restricted' },
  { table: 'subscriptions', field: 'providerSubscriptionRef', visibility: 'billing_restricted' },
  { table: 'billing_events', field: 'amountLabel', visibility: 'billing_restricted' },
  { table: 'credential_metadata', field: 'maskedLabel', visibility: 'support_safe' },
  { table: 'credential_metadata', field: 'vaultReference', visibility: 'security_restricted' },
  { table: 'plugin_connections', field: 'signingKeyVaultRef', visibility: 'security_restricted' },
  { table: 'security_signals', field: 'summary', visibility: 'security_restricted' },
  { table: 'sms_usage', field: 'recipientRef', visibility: 'pii_restricted' },
];

/**
 * Resolve a field's visibility. Returns the explicit classification if present; otherwise
 * `tenant_safe` as a safe default (never `public_safe` by default).
 */
export function getFieldVisibility(table: SchemaTableName, field: string): DataVisibilityLevel {
  const entry = FIELD_VISIBILITY.find((f) => f.table === table && f.field === field);
  return entry ? entry.visibility : 'tenant_safe';
}

/**
 * Defensive guard: detect raw secret-like field NAMES on a candidate record (these must be
 * `secret_never_expose` and are never permitted in any app table). Returns offending field
 * names only (never values). Reuses the central secret-field detector.
 */
export function findSecretNeverExposeFields(input: unknown): string[] {
  return findRawSecretFields(input);
}

/** True if a candidate record carries any raw secret-like field (must be rejected). */
export function recordHoldsSecretField(input: unknown): boolean {
  return findSecretNeverExposeFields(input).length > 0;
}
