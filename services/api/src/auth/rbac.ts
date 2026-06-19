/**
 * Roles, portals, and the access matrix (the single source of truth for "who can do what").
 *
 * Enforced server-side by the auth middleware. A JWT carries the user's role; each portal's
 * routes require the matching role, so a merchant token can never read admin/affiliate data.
 */
export type Role = 'merchant' | 'admin' | 'affiliate' | 'support';
export type Portal = 'merchant' | 'admin' | 'affiliate';

/** Which role a successful login on a given portal grants/requires. */
export const PORTAL_ROLE: Record<Portal, Role> = {
  merchant: 'merchant',
  admin: 'admin',
  affiliate: 'affiliate',
};

/** Privileged actions governed by RBAC. */
export type Permission =
  | 'merchant.read'
  | 'admin.read'
  | 'admin.manage'
  | 'affiliate.read'
  | 'affiliate.request_payout';

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  merchant: ['merchant.read'],
  affiliate: ['affiliate.read', 'affiliate.request_payout'],
  support: ['admin.read'],
  admin: ['admin.read', 'admin.manage', 'merchant.read', 'affiliate.read'],
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** A role can use a portal if it equals the portal's role, or it is the all-seeing admin. */
export function roleCanUsePortal(role: Role, portal: Portal): boolean {
  return role === 'admin' ? true : role === PORTAL_ROLE[portal];
}
