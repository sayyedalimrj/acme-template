/**
 * Admin routes (admin portal). platform_admin has full access; support_admin is read-only
 * (write actions require the 'admin.manage' permission, which support_admin lacks). Every
 * privileged action is audited.
 */
import { Router, type Response } from 'express';
import { z } from 'zod';

import { audit } from '../../services/audit';
import { revokeAllSessions } from '../../services/tokenService';
import { syncWooSite } from '../../services/sites';
import { query, queryOne } from '../../db';
import { cached, invalidate } from '../../util/cache';
import { parsePagination } from '../../util/pagination';
import { badRequest, notFound } from '../../util/errors';
import { authenticate, requireAdmin, requirePermission, requirePortal, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';
import {
  addMessage as addSupportMessage,
  getMessages as getSupportMessages,
  getTicket as getSupportTicket,
  listTickets as listSupportTickets,
  markRead as markSupportRead,
  setStatus as setSupportStatus,
  unreadCount as supportUnreadCount,
  type SupportStatus,
} from '../../services/supportService';
import {
  countOnboardingRequestsAdmin,
  getOnboardingRequestAdmin,
  listNotifications,
  listOnboardingRequestsAdmin,
  listOnboardingStatusEvents,
  markNotificationRead,
  unreadNotificationCount,
  updateOnboardingStatusAdmin,
} from '../../services/onboardingService';

export const adminRouter = Router();
adminRouter.use(authenticate, requirePortal('admin'), requireAdmin);

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res: Response) => {
    const row = await cached('admin:overview', async () =>
      queryOne(
        `SELECT
           (SELECT count(*) FROM merchant)::int AS merchants_total,
           (SELECT count(*) FROM merchant WHERE status = 'active')::int AS merchants_active,
           (SELECT count(*) FROM merchant WHERE status = 'trial')::int AS merchants_trialing,
           (SELECT count(*) FROM site WHERE status = 'connected')::int AS sites_connected,
           (SELECT COALESCE(sum(mrr_amount), 0) FROM merchant WHERE status = 'active')::bigint AS mrr,
           (SELECT COALESCE(sum(total_minor),0) FROM synced_order)::bigint AS gmv,
           (SELECT count(*) FROM payout WHERE status = 'requested')::int AS pending_payouts,
           (SELECT count(*) FROM onboarding_request WHERE status IN ('submitted','under_review','provisioning','ready'))::int AS pending_onboarding,
           (SELECT count(*) FROM webhook_event WHERE status = 'failed')::int AS failed_webhooks`,
      ),
    );
    res.json({ overview: row });
  }),
);

adminRouter.get(
  '/merchants',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status ? String(req.query.status) : null;
    const search = req.query.search ? `%${String(req.query.search)}%` : null;
    const rows = await query(
      `SELECT m.id, m.tenant_id, m.store_name, m.url, m.plan, m.status, m.mrr_amount,
              m.store_sales_amount, u.name AS owner_name, u.mobile AS owner_mobile,
              (SELECT count(*) FROM site s WHERE s.tenant_id = m.tenant_id)::int AS sites
         FROM merchant m JOIN app_user u ON u.id = m.user_id
        WHERE ($1::text IS NULL OR m.status = $1)
          AND ($2::text IS NULL OR m.store_name ILIKE $2 OR u.name ILIKE $2)
        ORDER BY m.created_at DESC LIMIT $3 OFFSET $4`,
      [status, search, pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

adminRouter.get(
  '/merchants/:id',
  asyncHandler(async (req, res: Response) => {
    const merchant = await queryOne(
      `SELECT m.*, u.name AS owner_name, u.mobile AS owner_mobile
         FROM merchant m JOIN app_user u ON u.id = m.user_id WHERE m.id = $1`,
      [req.params.id],
    );
    if (!merchant) throw notFound('فروشنده یافت نشد.');
    const tenantId = (merchant as { tenant_id?: string }).tenant_id;
    const sites = tenantId
      ? await query(
          `SELECT id, name, url, connection_mode, status, last_synced_at, last_error FROM site WHERE tenant_id = $1`,
          [tenantId],
        )
      : [];
    res.json({ merchant, sites });
  }),
);

const statusSchema = z.object({ status: z.enum(['active', 'trial', 'past_due', 'suspended', 'canceled']) });
adminRouter.patch(
  '/merchants/:id/status',
  requirePermission('admin.manage'),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('وضعیت نامعتبر است.');
    const merchant = await queryOne<{ id: string; user_id: string }>(
      `UPDATE merchant SET status = $2 WHERE id = $1 RETURNING id, user_id`,
      [req.params.id, parsed.data.status],
    );
    if (!merchant) throw notFound('فروشنده یافت نشد.');
    if (parsed.data.status === 'suspended') {
      await query(`UPDATE app_user SET status = 'suspended' WHERE id = $1`, [merchant.user_id]);
      await revokeAllSessions(merchant.user_id);
    } else {
      await query(`UPDATE app_user SET status = 'active' WHERE id = $1`, [merchant.user_id]);
    }
    await audit({
      actorUserId: req.auth!.sub,
      action: 'admin.merchant.status',
      targetType: 'merchant',
      targetId: req.params.id,
      requestIp: req.ip,
      meta: { status: parsed.data.status },
    });
    invalidate('admin:overview');
    res.json({ ok: true });
  }),
);

adminRouter.get(
  '/sites',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status ? String(req.query.status) : null;
    const rows = await query(
      `SELECT s.id, s.tenant_id, s.name, s.url, s.connection_mode, s.status, s.last_synced_at,
              s.last_error, t.name AS tenant_name
         FROM site s JOIN tenant t ON t.id = s.tenant_id
        WHERE ($1::text IS NULL OR s.status = $1)
        ORDER BY s.created_at DESC LIMIT $2 OFFSET $3`,
      [status, pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

adminRouter.get(
  '/sites/:id/sync-runs',
  asyncHandler(async (req, res: Response) => {
    const rows = await query(
      `SELECT id, source, status, stats, error, started_at, finished_at
         FROM sync_run WHERE site_id = $1 ORDER BY started_at DESC LIMIT 50`,
      [req.params.id],
    );
    res.json({ items: rows });
  }),
);

adminRouter.post(
  '/sites/:id/resync',
  requirePermission('admin.manage'),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const site = await queryOne<{ id: string; connection_mode: string }>(
      `SELECT id, connection_mode FROM site WHERE id = $1`,
      [req.params.id],
    );
    if (!site) throw notFound('فروشگاه یافت نشد.');
    if (site.connection_mode !== 'woo_rest') {
      throw badRequest('همگام‌سازی دستی فقط برای اتصال REST ممکن است.');
    }
    const stats = await syncWooSite(site.id);
    await audit({
      actorUserId: req.auth!.sub,
      action: 'admin.site.resync',
      targetType: 'site',
      targetId: site.id,
      requestIp: req.ip,
      meta: { stats },
    });
    res.json({ ok: true, stats });
  }),
);

adminRouter.get(
  '/orders',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status ? String(req.query.status) : null;
    const rows = await query(
      `SELECT o.external_id, o.number, o.customer_name, o.status, o.total_minor, o.currency,
              o.external_created_at, s.name AS store_name
         FROM synced_order o JOIN site s ON s.id = o.site_id
        WHERE ($1::text IS NULL OR o.status = $1)
        ORDER BY o.external_created_at DESC NULLS LAST LIMIT $2 OFFSET $3`,
      [status, pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

adminRouter.get(
  '/marketers',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await query(
      `SELECT mk.id, mk.code, mk.status, mk.commission_rate_bps, u.name,
              (SELECT count(*) FROM referral r WHERE r.marketer_id = mk.id)::int AS referrals_total,
              (SELECT count(*) FROM referral r WHERE r.marketer_id = mk.id AND r.status = 'active')::int AS active_referrals,
              (SELECT COALESCE(sum(c.amount),0) FROM commission c WHERE c.marketer_id = mk.id AND c.status IN ('pending','approved'))::bigint AS commission_pending,
              (SELECT COALESCE(sum(c.amount),0) FROM commission c WHERE c.marketer_id = mk.id AND c.status = 'paid')::bigint AS commission_paid
         FROM marketer mk JOIN app_user u ON u.id = mk.user_id
        ORDER BY mk.created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

adminRouter.get(
  '/payouts',
  asyncHandler(async (req, res: Response) => {
    const status = req.query.status ? String(req.query.status) : null;
    const rows = await query(
      `SELECT p.id, p.amount, p.currency, p.method, p.masked_destination, p.status,
              p.requested_at, p.paid_at, mk.code AS marketer_code, u.name AS marketer_name
         FROM payout p JOIN marketer mk ON mk.id = p.marketer_id JOIN app_user u ON u.id = mk.user_id
        WHERE ($1::text IS NULL OR p.status = $1)
        ORDER BY p.requested_at DESC LIMIT 200`,
      [status],
    );
    res.json({ items: rows });
  }),
);

const payoutActionSchema = z.object({ action: z.enum(['approve', 'reject', 'mark_paid']) });
adminRouter.patch(
  '/payouts/:id',
  requirePermission('admin.manage'),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = payoutActionSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('عملیات نامعتبر است.');
    const next =
      parsed.data.action === 'approve'
        ? 'approved'
        : parsed.data.action === 'reject'
          ? 'rejected'
          : 'paid';
    const paidAt = next === 'paid' ? 'now()' : 'NULL';
    const row = await queryOne<{ id: string; marketer_id: string }>(
      `UPDATE payout SET status = $2, paid_at = ${paidAt} WHERE id = $1 RETURNING id, marketer_id`,
      [req.params.id, next],
    );
    if (!row) throw notFound('درخواست تسویه یافت نشد.');
    // When a payout is marked paid, settle the marketer's approved commissions for traceability.
    if (next === 'paid') {
      await query(
        `UPDATE commission SET status = 'paid' WHERE marketer_id = $1 AND status = 'approved'`,
        [row.marketer_id],
      );
    }
    await audit({
      actorUserId: req.auth!.sub,
      action: `admin.payout.${parsed.data.action}`,
      targetType: 'payout',
      targetId: req.params.id,
      requestIp: req.ip,
    });
    res.json({ ok: true, status: next });
  }),
);

adminRouter.get(
  '/audit',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await query(
      `SELECT a.id, a.action, a.target_type, a.target_id, a.request_ip, a.meta, a.created_at,
              u.name AS actor_name
         FROM audit_log a LEFT JOIN app_user u ON u.id = a.actor_user_id
        ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

adminRouter.get(
  '/events',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const source = req.query.source ? String(req.query.source) : null;
    const rows = await query(
      `SELECT id, source, event_type, status, idempotency_key, created_at, processed_at, error
         FROM webhook_event WHERE ($1::text IS NULL OR source = $1)
        ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [source, pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

adminRouter.get(
  '/plans',
  asyncHandler(async (_req, res: Response) => {
    const rows = await query(
      `SELECT id, code, name, price_minor, currency, interval, features, active FROM plan ORDER BY price_minor ASC`,
    );
    res.json({ items: rows });
  }),
);

adminRouter.get(
  '/subscriptions',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await query(
      `SELECT sub.id, sub.status, sub.provider, sub.current_period_end, sub.created_at,
              t.name AS tenant_name, p.code AS plan_code, p.price_minor
         FROM subscription sub JOIN tenant t ON t.id = sub.tenant_id JOIN plan p ON p.id = sub.plan_id
        ORDER BY sub.created_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);


// ---- support inbox (admin side: sees ALL tenants' tickets) ----

const adminTicketStatusValues = ['open', 'in_progress', 'closed'] as const;
const adminReplySchema = z.object({ body: z.string().trim().min(1).max(5000) });
const adminStatusSchema = z.object({ status: z.enum(adminTicketStatusValues) });

adminRouter.get(
  '/support/tickets',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const status = req.query.status ? String(req.query.status) : undefined;
    const valid = status && (adminTicketStatusValues as readonly string[]).includes(status)
      ? (status as SupportStatus)
      : undefined;
    const tickets = await listSupportTickets({ status: valid });
    res.json({ tickets });
  }),
);

adminRouter.get(
  '/support/unread-count',
  asyncHandler(async (_req: AuthedRequest, res: Response) => {
    res.json({ count: await supportUnreadCount({}) });
  }),
);

adminRouter.get(
  '/support/tickets/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const ticket = await getSupportTicket(req.params.id);
    const messages = await getSupportMessages(ticket.id);
    await markSupportRead(ticket.id, 'admin'); // opening the thread clears the admin unread badge
    res.json({ ticket: { ...ticket, admin_unread: 0 }, messages });
  }),
);

adminRouter.post(
  '/support/tickets/:id/messages',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = adminReplySchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('متن پاسخ را وارد کنید.');
    const message = await addSupportMessage(req.params.id, {
      senderRole: 'admin',
      userId: req.auth!.sub,
      body: parsed.data.body,
    });
    await audit({
      actorUserId: req.auth!.sub,
      action: 'support.admin.reply',
      targetType: 'support_ticket',
      targetId: req.params.id,
      requestIp: req.ip,
      meta: {},
    });
    res.status(201).json({ message });
  }),
);

adminRouter.patch(
  '/support/tickets/:id',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = adminStatusSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('وضعیت نامعتبر است.');
    const ticket = await setSupportStatus(req.params.id, parsed.data.status);
    await audit({
      actorUserId: req.auth!.sub,
      action: 'support.admin.status',
      targetType: 'support_ticket',
      targetId: req.params.id,
      requestIp: req.ip,
      meta: { status: parsed.data.status },
    });
    res.json({ ticket });
  }),
);

// ---- Onboarding queue ----

adminRouter.get(
  '/onboarding/requests',
  asyncHandler(async (req, res: Response) => {
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status ? String(req.query.status) : null;
    const items = await listOnboardingRequestsAdmin({ status, page, pageSize, offset });
    const total = await countOnboardingRequestsAdmin(status);
    res.json({ items, page, pageSize, total });
  }),
);

adminRouter.get(
  '/onboarding/requests/:id',
  asyncHandler(async (req, res: Response) => {
    const row = await getOnboardingRequestAdmin(req.params.id);
    if (!row) throw notFound('درخواست یافت نشد.');
    const events = await listOnboardingStatusEvents(row.id);
    res.json({ request: row, statusHistory: events });
  }),
);

const onboardingStatusSchema = z.object({
  status: z.enum(['under_review', 'provisioning', 'ready', 'delivered', 'rejected', 'archived']),
  adminNote: z.string().trim().max(2000).optional(),
  createSite: z
    .object({
      name: z.string().trim().min(1),
      url: z.string().trim().url(),
      mode: z.enum(['woo_rest', 'plugin']).default('woo_rest'),
    })
    .optional(),
});

adminRouter.patch(
  '/onboarding/requests/:id/status',
  requirePermission('admin.manage'),
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = onboardingStatusSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('وضعیت نامعتبر است.');
    const updated = await updateOnboardingStatusAdmin({
      requestId: req.params.id,
      status: parsed.data.status,
      adminUserId: req.auth!.sub,
      adminNote: parsed.data.adminNote,
      createSite: parsed.data.createSite,
    });
    invalidate('admin:overview');
    res.json({ request: updated });
  }),
);

adminRouter.get(
  '/notifications',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const unreadOnly = req.query.unread === '1';
    const items = await listNotifications({ audience: 'admin', unreadOnly });
    res.json({ items, unreadCount: await unreadNotificationCount('admin') });
  }),
);

adminRouter.patch(
  '/notifications/:id/read',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    await markNotificationRead(req.params.id);
    res.json({ ok: true });
  }),
);
