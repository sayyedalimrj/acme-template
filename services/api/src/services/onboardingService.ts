/**
 * Onboarding request lifecycle — managed store launch and existing-site intake.
 *
 * Referral code is mandatory. Submitting a request notifies platform admins. Merchants see a
 * provisioning countdown until an admin marks the request delivered and (optionally) links a site.
 */
import { pool, query, queryOne } from '../db';
import { badRequest, notFound } from '../util/errors';
import { audit } from './audit';
import { startConnection } from './sites';

export type OnboardingType = 'existing' | 'new';
export type OnboardingStatus =
  | 'submitted'
  | 'under_review'
  | 'provisioning'
  | 'ready'
  | 'delivered'
  | 'rejected'
  | 'archived';

const PROVISIONING_MINUTES = 30;

export interface OnboardingRequestRow {
  id: string;
  tenant_id: string;
  user_id: string;
  type: OnboardingType;
  referral_code: string;
  marketer_id: string | null;
  status: OnboardingStatus;
  payload: Record<string, unknown>;
  site_id: string | null;
  estimated_ready_at: string | null;
  delivered_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export async function validateReferralCode(code: string): Promise<{ marketerId: string; code: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw badRequest('کد معرف الزامی است.');
  const row = await queryOne<{ id: string; code: string }>(
    `SELECT id, code FROM marketer WHERE upper(code) = $1 AND status = 'active'`,
    [normalized],
  );
  if (!row) throw badRequest('کد معرف نامعتبر است.');
  return { marketerId: row.id, code: row.code };
}

async function recordStatusEvent(
  requestId: string,
  status: string,
  note?: string | null,
  actorUserId?: string | null,
): Promise<void> {
  await query(
    `INSERT INTO onboarding_status_event (request_id, status, note, actor_user_id) VALUES ($1, $2, $3, $4)`,
    [requestId, status, note ?? null, actorUserId ?? null],
  );
}

async function notifyUser(
  userId: string,
  audience: 'merchant' | 'affiliate',
  input: { kind: string; title: string; body: string; payload?: Record<string, unknown> },
): Promise<void> {
  await query(
    `INSERT INTO platform_notification (audience, user_id, kind, title, body, payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
    [audience, userId, input.kind, input.title, input.body, JSON.stringify(input.payload ?? {})],
  );
}

export async function createOnboardingRequest(input: {
  tenantId: string;
  userId: string;
  type: OnboardingType;
  referralCode: string;
  payload: Record<string, unknown>;
}): Promise<OnboardingRequestRow> {
  const { marketerId, code } = await validateReferralCode(input.referralCode);
  const estimatedReady = new Date(Date.now() + PROVISIONING_MINUTES * 60_000).toISOString();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const row = (
      await client.query<OnboardingRequestRow>(
        `INSERT INTO onboarding_request
           (tenant_id, user_id, type, referral_code, marketer_id, status, payload, estimated_ready_at)
         VALUES ($1, $2, $3, $4, $5, 'provisioning', $6, $7)
         RETURNING *`,
        [input.tenantId, input.userId, input.type, code, marketerId, JSON.stringify(input.payload), estimatedReady],
      )
    ).rows[0];

    await client.query(
      `INSERT INTO onboarding_status_event (request_id, status, note) VALUES ($1, 'submitted', $2)`,
      [row.id, 'درخواست ثبت شد.'],
    );
    await client.query(
      `INSERT INTO onboarding_status_event (request_id, status, note) VALUES ($1, 'provisioning', $2)`,
      [row.id, 'در حال آماده‌سازی فروشگاه…'],
    );

    await client.query(
      `INSERT INTO platform_notification (audience, kind, title, body, payload)
         VALUES ('admin', 'onboarding.new', $1, $2, $3)`,
      [
        'درخواست فروشگاه جدید',
        `درخواست ${input.type === 'new' ? 'راه‌اندازی فروشگاه' : 'اتصال فروشگاه موجود'} از ${String(input.payload.businessName ?? 'فروشنده')} ثبت شد.`,
        JSON.stringify({ requestId: row.id, tenantId: input.tenantId, type: input.type, referralCode: code }),
      ],
    );

    await client.query('COMMIT');
    return row;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listOnboardingRequestsForTenant(tenantId: string): Promise<OnboardingRequestRow[]> {
  return query<OnboardingRequestRow>(
    `SELECT * FROM onboarding_request WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [tenantId],
  );
}

export async function getOnboardingRequestForTenant(
  tenantId: string,
  requestId: string,
): Promise<OnboardingRequestRow | null> {
  return queryOne<OnboardingRequestRow>(
    `SELECT * FROM onboarding_request WHERE id = $1 AND tenant_id = $2`,
    [requestId, tenantId],
  );
}

export async function listOnboardingStatusEvents(requestId: string): Promise<
  Array<{ status: string; note: string | null; created_at: string }>
> {
  return query(
    `SELECT status, note, created_at FROM onboarding_status_event
       WHERE request_id = $1 ORDER BY created_at ASC`,
    [requestId],
  );
}

export async function listOnboardingRequestsAdmin(filters: {
  status?: string | null;
  page: number;
  pageSize: number;
  offset: number;
}): Promise<OnboardingRequestRow[]> {
  return query<OnboardingRequestRow>(
    `SELECT r.* FROM onboarding_request r
      WHERE ($1::text IS NULL OR r.status = $1)
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
    [filters.status ?? null, filters.pageSize, filters.offset],
  );
}

export async function countOnboardingRequestsAdmin(status?: string | null): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM onboarding_request WHERE ($1::text IS NULL OR status = $1)`,
    [status ?? null],
  );
  return row?.count ?? 0;
}

export async function getOnboardingRequestAdmin(requestId: string): Promise<OnboardingRequestRow | null> {
  return queryOne<OnboardingRequestRow>(`SELECT * FROM onboarding_request WHERE id = $1`, [requestId]);
}

export async function updateOnboardingStatusAdmin(input: {
  requestId: string;
  status: OnboardingStatus;
  adminUserId: string;
  adminNote?: string;
  createSite?: { name: string; url: string; mode: 'woo_rest' | 'plugin' };
}): Promise<OnboardingRequestRow> {
  const existing = await getOnboardingRequestAdmin(input.requestId);
  if (!existing) throw notFound('درخواست یافت نشد.');

  let siteId = existing.site_id;

  if (input.status === 'delivered' && input.createSite && !siteId) {
    const conn = await startConnection({
      tenantId: existing.tenant_id,
      name: input.createSite.name,
      url: input.createSite.url,
      mode: input.createSite.mode,
    });
    siteId = conn.siteId;
    await query(`UPDATE site SET status = 'provisioning' WHERE id = $1`, [siteId]);
  }

  const deliveredAt = input.status === 'delivered' ? new Date().toISOString() : existing.delivered_at;

  const updated = await queryOne<OnboardingRequestRow>(
    `UPDATE onboarding_request
        SET status = $2,
            admin_note = COALESCE($3, admin_note),
            site_id = COALESCE($4, site_id),
            delivered_at = COALESCE($5, delivered_at),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [input.requestId, input.status, input.adminNote ?? null, siteId, deliveredAt],
  );
  if (!updated) throw notFound('درخواست یافت نشد.');

  await recordStatusEvent(input.requestId, input.status, input.adminNote ?? null, input.adminUserId);

  if (input.status === 'delivered') {
    if (siteId) {
      await query(`UPDATE site SET status = 'connected' WHERE id = $1`, [siteId]);
    }
    await notifyUser(existing.user_id, 'merchant', {
      kind: 'onboarding.delivered',
      title: 'فروشگاه شما آماده است',
      body: 'فروشگاه شما توسط تیم ما آماده و تحویل داده شد. اکنون می‌توانید از داشبورد استفاده کنید.',
      payload: { requestId: input.requestId, siteId },
    });
  }

  await audit({
    actorUserId: input.adminUserId,
    action: 'admin.onboarding.status',
    targetType: 'onboarding_request',
    targetId: input.requestId,
    meta: { status: input.status },
  });

  return updated;
}

export async function listNotifications(input: {
  audience: 'admin' | 'merchant' | 'affiliate';
  userId?: string | null;
  unreadOnly?: boolean;
  limit?: number;
}): Promise<
  Array<{
    id: string;
    kind: string;
    title: string;
    body: string;
    payload: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
  }>
> {
  return query(
    `SELECT id, kind, title, body, payload, read_at, created_at
       FROM platform_notification
      WHERE audience = $1
        AND ($2::uuid IS NULL OR user_id = $2 OR user_id IS NULL)
        AND ($3::boolean IS FALSE OR read_at IS NULL)
      ORDER BY created_at DESC
      LIMIT $4`,
    [input.audience, input.userId ?? null, input.unreadOnly ?? false, input.limit ?? 50],
  );
}

export async function markNotificationRead(notificationId: string, userId?: string | null): Promise<void> {
  await query(
    `UPDATE platform_notification SET read_at = now()
       WHERE id = $1 AND ($2::uuid IS NULL OR user_id = $2 OR user_id IS NULL)`,
    [notificationId, userId ?? null],
  );
}

export async function unreadNotificationCount(
  audience: 'admin' | 'merchant' | 'affiliate',
  userId?: string | null,
): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT count(*)::int AS count FROM platform_notification
       WHERE audience = $1 AND read_at IS NULL
         AND ($2::uuid IS NULL OR user_id = $2 OR user_id IS NULL)`,
    [audience, userId ?? null],
  );
  return row?.count ?? 0;
}
