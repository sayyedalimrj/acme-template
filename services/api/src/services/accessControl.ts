/**
 * AccessControlService — server-side tenant/site isolation.
 *
 * `assertTenantAccess` / `assertSiteAccess` resolve the requested resource and verify the caller
 * is allowed to touch it. platform_admin (and read-only support_admin) may access any tenant/site;
 * everyone else must be a member of the owning tenant. These throw a safe 403/404 on violation,
 * so a merchant can never reach another tenant's data even if they guess an id.
 */
import { queryOne } from '../db';
import { isAdminRole, type Role } from '../auth/rbac';
import { forbidden, notFound } from '../util/errors';
import type { TokenClaims } from './tokenService';

export interface SiteRef {
  id: string;
  tenant_id: string;
  url: string;
  status: string;
  connection_mode: string;
}

/** True if the user is a member of the tenant (any merchant role). */
export async function isTenantMember(userId: string, tenantId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT true AS exists FROM tenant_member WHERE tenant_id = $1 AND user_id = $2`,
    [tenantId, userId],
  );
  return Boolean(row);
}

/** Ensure the caller may access the given tenant. Admins bypass; members pass; else 403. */
export async function assertTenantAccess(auth: TokenClaims, tenantId: string): Promise<void> {
  if (isAdminRole(auth.role)) return;
  if (await isTenantMember(auth.sub, tenantId)) return;
  throw forbidden('به این فروشگاه دسترسی ندارید.');
}

/** Resolve a site and ensure the caller may access it (admins bypass; tenant members pass). */
export async function assertSiteAccess(auth: TokenClaims, siteId: string): Promise<SiteRef> {
  const site = await queryOne<SiteRef>(
    `SELECT id, tenant_id, url, status, connection_mode FROM site WHERE id = $1`,
    [siteId],
  );
  if (!site) throw notFound('فروشگاه یافت نشد.');
  await assertTenantAccess(auth, site.tenant_id);
  return site;
}

/** The single tenant a merchant user owns/belongs to (used to scope "my store" routes). */
export async function primaryTenantId(userId: string): Promise<string | null> {
  const row = await queryOne<{ tenant_id: string }>(
    `SELECT tenant_id FROM tenant_member WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [userId],
  );
  return row?.tenant_id ?? null;
}

/** Whether a write is allowed for a role on a site (manage_* permissions). */
export function canManage(role: Role): boolean {
  return (
    role === 'platform_admin' ||
    role === 'merchant_owner' ||
    role === 'merchant_manager' ||
    role === 'merchant_staff'
  );
}
