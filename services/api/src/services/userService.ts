/**
 * User lookup/creation with portal-aware role assignment + tenant bootstrapping.
 *
 * - admin portal: mobiles in ADMIN_MOBILE_ALLOWLIST → platform_admin; SUPPORT_MOBILE_ALLOWLIST
 *   → support_admin (read-only). Others are rejected.
 * - merchant portal: open signup → merchant_owner; a tenant + membership + billing record are
 *   created on first login. An optional referral code attributes the signup to a marketer.
 * - affiliate portal: self-serve when AFFILIATE_OPEN_SIGNUP=true; a marketer row (referral code)
 *   is created on first login.
 */
import { adminAllowlist, env, supportAllowlist } from '../env';
import { pool, query, queryOne } from '../db';
import { roleCanUsePortal, type Portal, type Role } from '../auth/rbac';
import { forbidden } from '../util/errors';

export interface AppUser {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  role: Role;
  status: string;
}

/**
 * True when the user has supplied the profile fields the onboarding form collects
 * (first + last name combined into `name`, plus an email). Drives whether the first-login
 * profile-completion form is shown.
 */
export function isProfileComplete(user: Pick<AppUser, 'name' | 'email'>): boolean {
  // Email is OPTIONAL: a profile is complete once the user has a name. (Email is collected when
  // provided and validated for format, but never required to enter the app.)
  return Boolean(user.name && user.name.trim().length > 0);
}

/**
 * Reconcile an EXISTING user's role against the admin allow-list when they authenticate.
 *
 * The allow-list is the single server-side source of truth for who may use the admin portal.
 * If an allow-listed mobile signs into the admin portal but its stored role isn't an admin role
 * (e.g. it signed up as a merchant earlier), promote it to platform_admin so admin access works
 * without manual DB edits. Non-admin-portal logins are never changed, so merchant/affiliate
 * behavior is unaffected. Returns the role the user should have for this login.
 */
export function reconcileAdminRole(user: Pick<AppUser, 'mobile' | 'role'>, portal: Portal): Role {
  if (portal !== 'admin') return user.role;
  if (adminAllowlist.includes(user.mobile)) {
    return user.role === 'platform_admin' ? user.role : 'platform_admin';
  }
  if (supportAllowlist.includes(user.mobile)) {
    return user.role === 'platform_admin' || user.role === 'support_admin' ? user.role : 'support_admin';
  }
  return user.role;
}

function resolveRoleForNewUser(mobile: string, portal: Portal): Role {
  if (portal === 'admin') {
    if (adminAllowlist.includes(mobile)) return 'platform_admin';
    if (supportAllowlist.includes(mobile)) return 'support_admin';
    throw forbidden('این شماره اجازه ورود به پنل مدیریت را ندارد.');
  }
  if (portal === 'affiliate') {
    if (!env.AFFILIATE_OPEN_SIGNUP) {
      throw forbidden('ثبت‌نام بازاریاب فعلاً باز نیست. با پشتیبانی تماس بگیرید.');
    }
    return 'affiliate';
  }
  return 'merchant_owner';
}

function referralCodeFromName(name: string | null, mobile: string): string {
  const base = (name ?? '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 6);
  const suffix = mobile.slice(-4);
  return `${base || 'AFF'}${suffix}`;
}

export interface FindOrCreateOptions {
  name?: string;
  /** Optional referral code captured at merchant signup (affiliate attribution). */
  referralCode?: string;
}

export async function findOrCreateUser(
  mobile: string,
  portal: Portal,
  options: FindOrCreateOptions = {},
): Promise<AppUser> {
  const existing = await queryOne<AppUser>(
    `SELECT id, mobile, name, email, role, status FROM app_user WHERE mobile = $1`,
    [mobile],
  );

  if (existing) {
    if (existing.status !== 'active') throw forbidden('این حساب غیرفعال است.');

    // Promote allow-listed mobiles to the right admin role on admin-portal login (server-side
    // source of truth). No-op for non-admin portals, so merchant/affiliate logins are unchanged.
    const reconciledRole = reconcileAdminRole(existing, portal);
    if (reconciledRole !== existing.role) {
      await query(`UPDATE app_user SET role = $2, updated_at = now() WHERE id = $1`, [
        existing.id,
        reconciledRole,
      ]);
      existing.role = reconciledRole;
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

  // Create the user and any portal-specific records inside a transaction.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const created = (
      await client.query<AppUser>(
        `INSERT INTO app_user (mobile, name, role, last_login_at)
           VALUES ($1, $2, $3, now())
           RETURNING id, mobile, name, email, role, status`,
        [mobile, options.name ?? null, role],
      )
    ).rows[0];
    if (!created) throw forbidden('ایجاد حساب ناموفق بود.');

    if (role === 'affiliate') {
      await client.query(
        `INSERT INTO marketer (user_id, code, commission_rate_bps)
           VALUES ($1, $2, $3) ON CONFLICT (code) DO NOTHING`,
        [created.id, referralCodeFromName(created.name, mobile), 2000],
      );
    }

    if (role === 'merchant_owner') {
      const tenant = (
        await client.query<{ id: string }>(
          `INSERT INTO tenant (name, owner_user_id) VALUES ($1, $2) RETURNING id`,
          [created.name ? `فروشگاه ${created.name}` : 'فروشگاه من', created.id],
        )
      ).rows[0];
      await client.query(
        `INSERT INTO tenant_member (tenant_id, user_id, role) VALUES ($1, $2, 'merchant_owner')`,
        [tenant.id, created.id],
      );

      // Resolve referral attribution (optional).
      let marketerId: string | null = null;
      if (options.referralCode) {
        const mk = (
          await client.query<{ id: string }>(
            `SELECT id FROM marketer WHERE code = $1 AND status = 'active'`,
            [options.referralCode.trim().toUpperCase()],
          )
        ).rows[0];
        marketerId = mk?.id ?? null;
      }

      const merchant = (
        await client.query<{ id: string }>(
          `INSERT INTO merchant (tenant_id, user_id, store_name, plan, status, referred_by_marketer_id)
             VALUES ($1, $2, $3, 'starter', 'trial', $4) RETURNING id`,
          [tenant.id, created.id, created.name ? `فروشگاه ${created.name}` : 'فروشگاه من', marketerId],
        )
      ).rows[0];

      if (marketerId) {
        await client.query(
          `INSERT INTO referral (marketer_id, merchant_id, tenant_id, status)
             VALUES ($1, $2, $3, 'trial')`,
          [marketerId, merchant.id, tenant.id],
        );
      }
    }

    await client.query('COMMIT');
    return created;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserById(id: string): Promise<AppUser | null> {
  return queryOne<AppUser>(
    `SELECT id, mobile, name, email, role, status FROM app_user WHERE id = $1`,
    [id],
  );
}

export interface ProfileUpdate {
  firstName: string;
  lastName: string;
  /** Optional — stored only when provided; never required to complete the profile. */
  email?: string;
}

/**
 * Save the first-login profile (first + last name + email). First and last name are stored as a
 * single `name` field (the app shows a single display name); email is stored verbatim. Returns
 * the updated user so the caller can report the real, persisted completion state.
 */
export async function updateUserProfile(id: string, input: ProfileUpdate): Promise<AppUser> {
  const name = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  // Email is optional: store NULL when omitted/blank (don't write an empty string).
  const email = input.email && input.email.trim().length > 0 ? input.email.trim() : null;
  const updated = await queryOne<AppUser>(
    `UPDATE app_user SET name = $2, email = $3, updated_at = now()
       WHERE id = $1
       RETURNING id, mobile, name, email, role, status`,
    [id, name, email],
  );
  if (!updated) throw forbidden('کاربر یافت نشد.');
  return updated;
}
