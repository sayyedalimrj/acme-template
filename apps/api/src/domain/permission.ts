/**
 * Permission / RBAC placeholder (backend skeleton).
 *
 * Contracts and a pure, in-memory role→permission map only. There is NO enforcement wired
 * to any real request here, NO auth provider, and NO session. The real RBAC is enforced
 * server-side in a later phase; this models the taxonomy early so route contracts and the
 * client can reason about it. See `security-model.md`.
 */
import type { TenantId } from './tenant';
import type { ApiRole, ApiUserId } from './user';

/** The scope at which a permission applies. */
export type PermissionScope = 'global' | 'tenant' | 'site';

/** A privileged action that RBAC governs. `*_later` actions are reserved for future phases. */
export type PermissionAction =
  | 'site.read'
  | 'site.create'
  | 'site.connect'
  | 'site.disconnect'
  | 'credential.metadata.manage'
  | 'proxy.read'
  | 'webhook.receive'
  | 'audit.read'
  | 'product.mutate_later'
  | 'order.mutate_later'
  | 'notification.send_later';

/** A single permission: an action bound to a scope. */
export interface Permission {
  action: PermissionAction;
  scope: PermissionScope;
}

/** Result of a permission check. Frontend-safe; never includes secrets. */
export interface PermissionCheckResult {
  allowed: boolean;
  /** Safe, human-readable reason when denied. */
  reason?: string;
  /** Permissions that were required but missing (for safe diagnostics). */
  missing?: Permission[];
}

/**
 * Request context passed to proxy/bridge/webhook contracts. Carries only non-secret
 * identifiers and the caller's role — never credentials.
 */
export interface RequestContext {
  tenantId: TenantId;
  userId?: ApiUserId;
  role?: ApiRole;
  /** Correlation id for audit/tracing (non-secret). */
  requestId?: string;
}

/**
 * Placeholder RBAC matrix: which actions each role may perform. This is a *modeling*
 * default only and is NOT a security control yet — real enforcement happens server-side
 * later. `*_later` actions are intentionally granted to no role in the skeleton.
 */
export const ROLE_PERMISSIONS: Record<ApiRole, readonly PermissionAction[]> = {
  owner: [
    'site.read',
    'site.create',
    'site.connect',
    'site.disconnect',
    'credential.metadata.manage',
    'proxy.read',
    'audit.read',
  ],
  manager: ['site.read', 'site.create', 'site.connect', 'proxy.read', 'audit.read'],
  staff: ['site.read', 'proxy.read'],
  viewer: ['site.read'],
  support_admin: ['site.read', 'site.connect', 'audit.read'],
  system: ['proxy.read', 'webhook.receive', 'audit.read'],
};

/**
 * Pure RBAC placeholder check. Returns whether `role` may perform `action`. Does NOT
 * authenticate, does NOT read any session, and is NOT yet wired to real requests.
 */
export function checkPermission(
  role: ApiRole | undefined,
  action: PermissionAction,
  scope: PermissionScope = 'site',
): PermissionCheckResult {
  if (!role) {
    return {
      allowed: false,
      reason: 'No role on request context.',
      missing: [{ action, scope }],
    };
  }
  const allowed = ROLE_PERMISSIONS[role].includes(action);
  return allowed
    ? { allowed: true }
    : {
        allowed: false,
        reason: `Role "${role}" lacks permission "${action}".`,
        missing: [{ action, scope }],
      };
}

/** Convenience: all permissions a role holds, expanded to `Permission` objects. */
export function permissionsForRole(role: ApiRole, scope: PermissionScope = 'site'): Permission[] {
  return ROLE_PERMISSIONS[role].map((action) => ({ action, scope }));
}
