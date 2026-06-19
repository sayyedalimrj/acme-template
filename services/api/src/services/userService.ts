/**
 * User lookup/creation with portal-aware role assignment.
 *
 * - admin: only mobiles in `ADMIN_MOBILE_ALLOWLIST` may sign in to the admin portal.
 * - affiliate: self-serve signup is allowed when `AFFILIATE_OPEN_SIGNUP=true`; a marketer row
 *   (with a referral code) is created automatically on first login.
 * - merchant: open signup.
 */
import { adminAllowlist, env } from '../env';
import { query, queryOne } from '../db';
import { PORTAL_ROLE, roleCanUsePortal, type Portal, type Role } from '../auth/rbac';
import { forbidden } from '../util/errors';

export interface AppUser {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: Role;
  status: string;
}

function resolveRoleForNewUser(mobile: string, portal: Portal): Role {
  if (portal === 'admin') {
    if (!adminAllowlist.includes(mobile)) {
      throw forbidden('این شماره اجازه ورود به پنل مدیریت را ندارد.');
    }
    return 'admin';
  }
  if (portal === 'affiliate' && !env.AFFILIATE_OPEN_SIGNUP) {
    throw forbidden('ثبت‌نام بازاریاب فعلاً باز نیست. با پشتیبانی تماس بگیرید.');
  }
  return PORTAL_ROLE[portal];
}

function referralCodeFromName(name: string | null, mobile: string): string {
  const base = (name ?? '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6);
  const suffix = mobile.slice(-4);
  return `${base || 'AFF'}${suffix}`;
}

export async function findOrCreateUser(
  mobile: string,
  portal: Portal,
  name?: string,
): Promise<AppUser> {
  const existing = await queryOne<AppUser>(
    `SELECT id, mobile, name, email, role, status FROM app_user WHERE mobile = $1`,
    [mobile],
  );

  if (existing) {
    if (existing.status !== 'active') {
      throw forbidden('این حساب غیرفعال است.');
    }
    if (!roleCanUsePortal(existing.role, portal)) {
      throw forbidden('این حساب اجازه ورود به این پنل را ندارد.');
    }
    await query(`UPDATE app_user SET last_login_at = now(), updated_at = now() WHERE id = $1`, [
      existing.id,
    ]);
    return existing;
  }

  const role = resolveRoleForNewUser(mobile, portal);
  const created = await queryOne<AppUser>(
    `INSERT INTO app_user (mobile, name, role, last_login_at)
       VALUES ($1, $2, $3, now())
       RETURNING id, mobile, name, email, role, status`,
    [mobile, name ?? null, role],
  );
  if (!created) {
    throw forbidden('ایجاد حساب ناموفق بود.');
  }

  if (role === 'affiliate') {
    await query(
      `INSERT INTO marketer (user_id, code, commission_rate_bps)
         VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
      [created.id, referralCodeFromName(created.name, mobile), 2000],
    );
  }

  return created;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  return queryOne<AppUser>(
    `SELECT id, mobile, name, email, role, status FROM app_user WHERE id = $1`,
    [id],
  );
}
