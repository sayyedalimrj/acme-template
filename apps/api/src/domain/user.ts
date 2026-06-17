/**
 * User / RBAC role placeholder (backend skeleton).
 *
 * Contracts only — there is NO real auth provider, NO JWT, NO sessions, and NO password
 * handling here. Authentication is implemented in a later phase; this file defines the
 * shape of an authenticated principal and the role taxonomy used by the RBAC placeholder
 * in `permission.ts`.
 */
import type { TenantId } from './tenant';

/** Opaque user identifier. */
export type ApiUserId = string;

/**
 * Role taxonomy. Merchant roles (owner/manager/staff/viewer) plus internal roles
 * (support_admin) and a non-human `system` actor for automated/internal operations.
 */
export type ApiRole = 'owner' | 'manager' | 'staff' | 'viewer' | 'support_admin' | 'system';

/** Account lifecycle state for a user. */
export type ApiUserStatus = 'active' | 'invited' | 'suspended';

/**
 * An authenticated principal. Frontend-safe identity metadata only — no credentials,
 * password hashes, or tokens. `email` is optional and, in mocks, is always a placeholder
 * (no real PII).
 */
export interface ApiUser {
  id: ApiUserId;
  tenantId: TenantId;
  displayName: string;
  role: ApiRole;
  status: ApiUserStatus;
  /** Optional contact email (PII) — never populated with real data in this skeleton. */
  email?: string;
  /** ISO-8601 timestamp. */
  createdAt: string;
}
