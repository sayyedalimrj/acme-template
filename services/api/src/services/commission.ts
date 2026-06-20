/**
 * Commission logic for the affiliate program.
 *
 * When a referred merchant's platform subscription payment settles, a commission is generated for
 * the referring marketer = rate_bps/10000 * paid amount. Duplicate generation is prevented by a
 * unique index on (referral_id, period), so retried/duplicate billing events never double-pay.
 */
import { query, queryOne } from '../db';

export interface CommissionResult {
  created: boolean;
  commissionId?: string;
  amountMinor?: number;
}

/**
 * Generate a commission for a settled subscription payment, if the tenant was referred.
 * `period` makes it idempotent (e.g. the invoice/billing period). Safe to call more than once.
 */
export async function generateCommissionForPayment(input: {
  tenantId: string;
  amountMinor: number;
  currency: string;
  period: string;
}): Promise<CommissionResult> {
  // Find the referral + marketer for this tenant.
  const referral = await queryOne<{ id: string; marketer_id: string; rate_bps: number }>(
    `SELECT r.id, r.marketer_id, mk.commission_rate_bps AS rate_bps
       FROM referral r JOIN marketer mk ON mk.id = r.marketer_id
      WHERE r.tenant_id = $1 ORDER BY r.created_at ASC LIMIT 1`,
    [input.tenantId],
  );
  if (!referral) return { created: false };

  const amount = Math.round((input.amountMinor * referral.rate_bps) / 10_000);
  if (amount <= 0) return { created: false };

  const rows = await query<{ id: string }>(
    `INSERT INTO commission (marketer_id, referral_id, tenant_id, amount, currency, rate_bps, status, period)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
     ON CONFLICT (referral_id, period) WHERE referral_id IS NOT NULL AND period IS NOT NULL
       DO NOTHING
     RETURNING id`,
    [referral.marketer_id, referral.id, input.tenantId, amount, input.currency, referral.rate_bps, input.period],
  );
  if (rows.length === 0) return { created: false };
  return { created: true, commissionId: rows[0].id, amountMinor: amount };
}

/** Marketer's available payout balance = approved commissions minus pending/approved payouts. */
export async function availableBalanceMinor(marketerId: string): Promise<number> {
  const row = await queryOne<{ balance: string }>(
    `SELECT (
       COALESCE((SELECT sum(amount) FROM commission WHERE marketer_id = $1 AND status = 'approved'), 0)
       - COALESCE((SELECT sum(amount) FROM payout WHERE marketer_id = $1 AND status IN ('requested','approved','paid')), 0)
     )::bigint AS balance`,
    [marketerId],
  );
  return Math.max(0, Number(row?.balance ?? 0));
}
