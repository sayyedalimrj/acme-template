/**
 * Tenant domain model (backend skeleton).
 *
 * A tenant is an owning customer/organization. Every site, user, credential, and audit
 * entry belongs to exactly one tenant (`Tenant → Site → Resource`). Frontend-safe: no
 * secrets live on this model. See `security-model.md`.
 */

/** Opaque tenant identifier. Skeleton uses a plain string alias (no secrets encoded). */
export type TenantId = string;

/** Lifecycle state of a tenant account. */
export type TenantStatus = 'active' | 'suspended' | 'archived';

/**
 * Subscription tier the tenant is on. Entitlements are computed server-side later
 * (billing phase); the client only ever receives entitlement flags.
 */
export type TenantPlan = 'starter' | 'growth' | 'pro' | 'managed';

/** An owning customer/organization. Frontend-safe metadata only. */
export interface Tenant {
  id: TenantId;
  /** Display name of the organization (frontend-safe). */
  name: string;
  status: TenantStatus;
  plan: TenantPlan;
  /** ISO-8601 timestamp. */
  createdAt: string;
  /** Optional region/locale hint (frontend-safe), e.g. 'IR', 'fa-IR'. */
  region?: string;
}
