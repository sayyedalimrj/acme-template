/**
 * Roles, portals, permissions — the single source of truth for "who can do what".
 *
 * Enforced server-side by the auth middleware + per-route guards. A JWT carries the user's
 * role, portal scope, and (for merchant users) tenant scope. Cross-portal and cross-tenant
 * access is denied server-side, so frontend hiding is never the only line of defense.
 */

/** Account-level roles (stored on app_user.role and carried in the JWT). */
export type Role =
  | 'platform_admin'
  | 'support_admin'
  | 'merchant_owner'
  | 'merchant_manager'
  | 'merchant_staff'
  | 'merchant_viewer'
  | 'affiliate'
  | 'system';

/** Per-tenant membership roles (stored on tenant_member.role). */
export type MerchantMemberRole =
  | 'merchant_owner'
  | 'merchant_manager'
  | 'merchant_staff'
  | 'merchant_viewer';

export type Portal = 'merchant' | 'admin' | 'affiliate';

export const ADMIN_ROLES: readonly Role[] = ['platform_admin', 'support_admin'];
export const MERCHANT_ROLES: readonly Role[] = [
  'merchant_owner',
  'merchant_manager',
  'merchant_staff',
  'merchant_viewer',
];

/** Which portal a role belongs to (system has no portal). */
export function portalForRole(role: Role): Portal | null {
  if (ADMIN_ROLES.includes(role)) return 'admin';
  if (MERCHANT_ROLES.includes(role)) return 'merchant';
  if (role === 'affiliate') return 'affiliate';
  return null;
}

/** Privileged actions governed by RBAC. */
export type Permission =
  // merchant
  | 'merchant.read'
  | 'merchant.manage_products'
  | 'merchant.manage_orders'
  | 'merchant.manage_settings'
  | 'merchant.connect_site'
  // admin
  | 'admin.read'
  | 'admin.manage'
  // affiliate
  | 'affiliate.read'
  | 'affiliate.request_payout';

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  platform_admin: [
    'admin.read',
    'admin.manage',
    'merchant.read',
    'merchant.manage_products',
    'merchant.manage_orders',
    'merchant.manage_settings',
    'merchant.connect_site',
    'affiliate.read',
  ],
  support_admin: ['admin.read', 'merchant.read', 'affiliate.read'],
  merchant_owner: [
    'merchant.read',
    'merchant.manage_products',
    'merchant.manage_orders',
    'merchant.manage_settings',
    'merchant.connect_site',
  ],
  merchant_manager: [
    'merchant.read',
    'merchant.manage_products',
    'merchant.manage_orders',
    'merchant.manage_settings',
  ],
  merchant_staff: ['merchant.read', 'merchant.manage_orders'],
  merchant_viewer: ['merchant.read'],
  affiliate: ['affiliate.read', 'affiliate.request_payout'],
  system: [],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** True if the role is allowed to use the given portal. platform_admin may use any portal. */
export function roleCanUsePortal(role: Role, portal: Portal): boolean {
  if (role === 'platform_admin') return true;
  return portalForRole(role) === portal;
}

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isMerchantRole(role: Role): boolean {
  return MERCHANT_ROLES.includes(role);
}
