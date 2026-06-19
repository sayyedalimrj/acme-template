/**
 * Affiliate routes (affiliate portal). Strictly scoped to the signed-in marketer — an affiliate
 * can never read another marketer's ledger, nor any merchant/admin data.
 */
import { Router, type Response } from 'express';
import { z } from 'zod';

import { env } from '../../env';
import { audit } from '../../services/audit';
import { availableBalanceMinor } from '../../services/commission';
import { query, queryOne } from '../../db';
import { parsePagination } from '../../util/pagination';
import { authenticate, requirePortal, requireRole, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';
import { badRequest, notFound } from '../../util/errors';

export const affiliateRouter = Router();
affiliateRouter.use(authenticate, requirePortal('affiliate'), requireRole('affiliate'));

async function marketerIdForUser(userId: string): Promise<string> {
  const row = await queryOne<{ id: string }>(`SELECT id FROM marketer WHERE user_id = $1`, [userId]);
  if (!row) throw notFound('پروفایل بازاریاب یافت نشد.');
  return row.id;
}

affiliateRouter.get(
  '/overview',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const overview = await queryOne(
      `SELECT
         (SELECT COALESCE(sum(amount),0) FROM commission WHERE marketer_id = $1 AND status = 'paid')::bigint AS paid,
         (SELECT COALESCE(sum(amount),0) FROM commission WHERE marketer_id = $1 AND status IN ('pending','approved'))::bigint AS pending,
         (SELECT count(*) FROM referral WHERE marketer_id = $1)::int AS referrals_total,
         (SELECT count(*) FROM referral WHERE marketer_id = $1 AND status = 'active')::int AS referrals_active`,
      [marketerId],
    );
    const profile = await queryOne<{ code: string }>(
      `SELECT code, commission_rate_bps, tier, status FROM marketer WHERE id = $1`,
      [marketerId],
    );
    const balance = await availableBalanceMinor(marketerId);
    const referralBase = env.PORTAL_MERCHANT_URL || '';
    const referralLink = profile?.code && referralBase ? `${referralBase}?ref=${profile.code}` : null;
    res.json({ overview, profile, availableBalanceMinor: balance, referralLink });
  }),
);

affiliateRouter.get(
  '/referrals',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const rows = await query(
      `SELECT r.id, r.status, r.created_at, m.store_name,
              (SELECT COALESCE(sum(c.amount),0) FROM commission c WHERE c.referral_id = r.id)::bigint AS commission_earned
         FROM referral r LEFT JOIN merchant m ON m.id = r.merchant_id
        WHERE r.marketer_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`,
      [marketerId, pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

affiliateRouter.get(
  '/commissions',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const { page, pageSize, offset } = parsePagination(req.query as Record<string, unknown>);
    const status = req.query.status ? String(req.query.status) : null;
    const rows = await query(
      `SELECT id, amount, currency, rate_bps, status, period, created_at
         FROM commission WHERE marketer_id = $1 AND ($2::text IS NULL OR status = $2)
        ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
      [marketerId, status, pageSize, offset],
    );
    res.json({ items: rows, page, pageSize });
  }),
);

affiliateRouter.get(
  '/payouts',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const rows = await query(
      `SELECT id, amount, currency, method, masked_destination, status, requested_at, paid_at
         FROM payout WHERE marketer_id = $1 ORDER BY requested_at DESC LIMIT 100`,
      [marketerId],
    );
    res.json({ items: rows, availableBalanceMinor: await availableBalanceMinor(marketerId) });
  }),
);

const payoutSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(['bank_card', 'bank_iban', 'wallet']).default('bank_card'),
  maskedDestination: z.string().trim().max(60).optional(),
});

affiliateRouter.post(
  '/payouts',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const parsed = payoutSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('مبلغ درخواستی نامعتبر است.');
    const balance = await availableBalanceMinor(marketerId);
    if (parsed.data.amount > balance) {
      throw badRequest('مبلغ درخواستی از موجودی قابل‌برداشت بیشتر است.');
    }
    const created = await queryOne(
      `INSERT INTO payout (marketer_id, amount, currency, method, masked_destination, status)
         VALUES ($1, $2, 'IRT', $3, $4, 'requested')
       RETURNING id, amount, currency, method, masked_destination, status, requested_at`,
      [marketerId, parsed.data.amount, parsed.data.method, parsed.data.maskedDestination ?? null],
    );
    await audit({
      actorUserId: req.auth!.sub,
      action: 'payout.request',
      targetType: 'payout',
      targetId: (created as { id?: string })?.id ?? null,
      requestIp: req.ip,
      meta: { amount: parsed.data.amount, method: parsed.data.method },
    });
    res.json({ payout: created });
  }),
);

affiliateRouter.get(
  '/profile',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const marketerId = await marketerIdForUser(req.auth!.sub);
    const profile = await queryOne(
      `SELECT mk.code, mk.commission_rate_bps, mk.tier, mk.status, u.name, u.mobile
         FROM marketer mk JOIN app_user u ON u.id = mk.user_id WHERE mk.id = $1`,
      [marketerId],
    );
    res.json({ profile });
  }),
);
