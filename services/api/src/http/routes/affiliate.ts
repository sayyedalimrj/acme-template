/**
 * Affiliate routes (role: affiliate). Scoped to the signed-in marketer.
 */
import { Router, type Response } from 'express';

import { query, queryOne } from '../../db';
import { authenticate, requireRole, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';
import { badRequest } from '../../util/errors';

export const affiliateRouter = Router();
affiliateRouter.use(authenticate, requireRole('affiliate'));

async function marketerIdForUser(userId: string): Promise<string> {
  const row = await queryOne<{ id: string }>(`SELECT id FROM marketer WHERE user_id = $1`, [userId]);
  if (!row) throw badRequest('پروفایل بازاریاب یافت نشد.', 'not_found');
  return row.id;
}

affiliateRouter.get(
  '/overview',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const row = await queryOne(
      `SELECT
         (SELECT COALESCE(sum(amount),0) FROM commission WHERE marketer_id = $1 AND status = 'paid')::bigint AS paid,
         (SELECT COALESCE(sum(amount),0) FROM commission WHERE marketer_id = $1 AND status IN ('pending','approved'))::bigint AS pending,
         (SELECT count(*) FROM referral WHERE marketer_id = $1)::int AS referrals_total,
         (SELECT count(*) FROM referral WHERE marketer_id = $1 AND status = 'active')::int AS referrals_active`,
      [marketerId],
    );
    const profile = await queryOne(
      `SELECT code, commission_rate_bps, tier FROM marketer WHERE id = $1`,
      [marketerId],
    );
    res.json({ overview: row, profile });
  }),
);

affiliateRouter.get(
  '/referrals',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const rows = await query(
      `SELECT r.id, r.status, r.created_at, m.store_name, u.name AS owner_name
         FROM referral r
         LEFT JOIN merchant m ON m.id = r.merchant_id
         LEFT JOIN app_user u ON u.id = m.user_id
        WHERE r.marketer_id = $1
        ORDER BY r.created_at DESC LIMIT 200`,
      [marketerId],
    );
    res.json({ referrals: rows });
  }),
);

affiliateRouter.get(
  '/commissions',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const rows = await query(
      `SELECT id, amount, currency, rate_bps, status, period, created_at
         FROM commission WHERE marketer_id = $1 ORDER BY created_at DESC LIMIT 200`,
      [marketerId],
    );
    res.json({ commissions: rows });
  }),
);
