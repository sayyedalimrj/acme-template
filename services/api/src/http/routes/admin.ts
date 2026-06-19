/**
 * Admin routes (role: admin). Platform-wide read access.
 */
import { Router, type Response } from 'express';

import { query, queryOne } from '../../db';
import { authenticate, requireRole } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';

export const adminRouter = Router();
adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res: Response) => {
    const row = await queryOne<{
      merchants_total: string;
      merchants_active: string;
      merchants_trialing: string;
      mrr: string;
      gmv: string;
      pending_payouts: string;
    }>(
      `SELECT
         (SELECT count(*) FROM merchant)::int AS merchants_total,
         (SELECT count(*) FROM merchant WHERE status = 'active')::int AS merchants_active,
         (SELECT count(*) FROM merchant WHERE status = 'trial')::int AS merchants_trialing,
         (SELECT COALESCE(sum(mrr_amount), 0) FROM merchant WHERE status = 'active')::bigint AS mrr,
         (SELECT COALESCE(sum(store_sales_amount), 0) FROM merchant)::bigint AS gmv,
         (SELECT count(*) FROM payout WHERE status = 'requested')::int AS pending_payouts`,
    );
    res.json({ overview: row });
  }),
);

adminRouter.get(
  '/merchants',
  asyncHandler(async (_req, res: Response) => {
    const rows = await query(
      `SELECT m.id, m.store_name, m.url, m.plan, m.status, m.mrr_amount, m.store_sales_amount,
              u.name AS owner_name
         FROM merchant m JOIN app_user u ON u.id = m.user_id
        ORDER BY m.created_at DESC LIMIT 200`,
    );
    res.json({ merchants: rows });
  }),
);

adminRouter.get(
  '/orders',
  asyncHandler(async (_req, res: Response) => {
    const rows = await query(
      `SELECT o.id, o.number, o.customer_name, o.status, o.total_amount, o.created_at,
              m.store_name
         FROM platform_order o JOIN merchant m ON m.id = o.merchant_id
        ORDER BY o.created_at DESC LIMIT 200`,
    );
    res.json({ orders: rows });
  }),
);

adminRouter.get(
  '/marketers',
  asyncHandler(async (_req, res: Response) => {
    const rows = await query(
      `SELECT mk.id, mk.code, mk.status, mk.commission_rate_bps, u.name,
              (SELECT count(*) FROM referral r WHERE r.marketer_id = mk.id)::int AS referrals_total,
              (SELECT count(*) FROM referral r WHERE r.marketer_id = mk.id AND r.status = 'active')::int AS active_referrals,
              (SELECT COALESCE(sum(c.amount),0) FROM commission c WHERE c.marketer_id = mk.id AND c.status IN ('pending','approved'))::bigint AS commission_pending
         FROM marketer mk JOIN app_user u ON u.id = mk.user_id
        ORDER BY mk.created_at DESC LIMIT 200`,
    );
    res.json({ marketers: rows });
  }),
);
