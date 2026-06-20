/**
 * Client-side portal access rules (mirror backend rbac.ts).
 */
import type { AppPortal } from '@/domain/types';

const ADMIN_ROLES = new Set(['platform_admin', 'support_admin']);
const MERCHANT_ROLES = new Set([
  'merchant_owner',
  'merchant_manager',
  'merchant_staff',
  'merchant_viewer',
]);

export function allowedPortalsForRole(role: string): AppPortal[] {
  if (role === 'platform_admin') return ['merchant', 'admin', 'affiliate'];
  if (ADMIN_ROLES.has(role)) return ['admin'];
  if (MERCHANT_ROLES.has(role)) return ['merchant'];
  if (role === 'affiliate') return ['affiliate'];
  return [];
}

export function roleCanUsePortal(role: string, portal: AppPortal): boolean {
  return allowedPortalsForRole(role).includes(portal);
}

export function homeRouteForPortal(portal: AppPortal): string {
  if (portal === 'admin') return '/admin';
  if (portal === 'affiliate') return '/affiliate';
  return '/';
}
