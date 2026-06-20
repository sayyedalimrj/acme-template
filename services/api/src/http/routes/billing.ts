/**
 * Billing routes — platform subscription billing for merchants. Plans are public-ish (read);
 * checkout/verify are tenant-scoped (merchant portal). Settling a payment records an idempotent
 * billing_event, activates the subscription, and generates affiliate commission if referred.
 */
import { Router, type Response } from 'express';
import { z } from 'zod';

import { env } from '../../env';
import { audit } from '../../services/audit';
import { generateCommissionForPayment } from '../../services/commission';
import { createCheckout, verifyPayment } from '../../services/billing/gateway';
import { primaryTenantId } from '../../services/accessControl';
import { pool, query, queryOne } from '../../db';
import { badRequest, notFound } from '../../util/errors';
import { authenticate, requirePortal, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../asyncHandler';

export const billingRouter = Router();

// Public plan list (any authenticated portal user may read available plans).
billingRouter.get(
  '/plans',
  authenticate,
  asyncHandler(async (_req, res: Response) => {
    const rows = await query(
      `SELECT id, code, name, price_minor, currency, interval, features FROM plan WHERE active = true ORDER BY price_minor ASC`,
    );
    res.json({ items: rows });
  }),
);

// Everything below is merchant-scoped.
billingRouter.use(authenticate, requirePortal('merchant'));

async function tenantFor(req: AuthedRequest): Promise<string> {
  const id = req.auth?.tenantId ?? (await primaryTenantId(req.auth!.sub));
  if (!id) throw notFound('فروشگاهی برای این حساب یافت نشد.');
  return id;
}

billingRouter.get(
  '/subscription',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const tenantId = await tenantFor(req);
    const subscription = await queryOne(
      `SELECT sub.id, sub.status, sub.provider, sub.current_period_end, sub.created_at,
              p.code AS plan_code, p.name AS plan_name, p.price_minor, p.currency, p.interval
         FROM subscription sub JOIN plan p ON p.id = sub.plan_id
        WHERE sub.tenant_id = $1 ORDER BY sub.created_at DESC LIMIT 1`,
      [tenantId],
    );
    res.json({ subscription });
  }),
);

const checkoutSchema = z.object({ planId: z.string().uuid() });

billingRouter.post(
  '/checkout',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('پلن انتخابی نامعتبر است.');
    const tenantId = await tenantFor(req);
    const plan = await queryOne<{ id: string; name: string; price_minor: number; currency: string }>(
      `SELECT id, name, price_minor, currency FROM plan WHERE id = $1 AND active = true`,
      [parsed.data.planId],
    );
    if (!plan) throw notFound('پلن یافت نشد.');
    if (plan.price_minor <= 0) throw badRequest('این پلن رایگان است و نیازی به پرداخت ندارد.');

    const idempotencyKey = `${tenantId}:${plan.id}:${Date.now()}`;
    const returnUrl = `${env.PUBLIC_API_BASE_URL || ''}/billing/callback?key=${encodeURIComponent(idempotencyKey)}`;
    const session = await createCheckout({
      amountMinor: plan.price_minor,
      currency: plan.currency,
      description: `اشتراک ${plan.name}`,
      returnUrl,
    });

    await query(
      `INSERT INTO payment_attempt (tenant_id, plan_id, amount_minor, currency, provider, provider_ref, status, idempotency_key, return_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        tenantId, plan.id, plan.price_minor, plan.currency, session.provider,
        session.providerRef, session.status === 'requires_action' ? 'requires_action' : 'pending',
        idempotencyKey, returnUrl,
      ],
    );
    await audit({
      actorUserId: req.auth!.sub,
      action: 'billing.checkout.create',
      targetType: 'plan',
      targetId: plan.id,
      requestIp: req.ip,
      meta: { provider: session.provider, amountMinor: plan.price_minor },
    });
    res.json({
      provider: session.provider,
      status: session.status,
      redirectUrl: session.redirectUrl ?? null,
      providerRef: session.providerRef,
    });
  }),
);

const verifyBody = z.object({ providerRef: z.string().min(2) });

billingRouter.post(
  '/verify',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const parsed = verifyBody.safeParse(req.body);
    if (!parsed.success) throw badRequest('درخواست نامعتبر است.');
    const tenantId = await tenantFor(req);
    const attempt = await queryOne<{
      id: string;
      plan_id: string;
      amount_minor: number;
      currency: string;
      status: string;
    }>(
      `SELECT id, plan_id, amount_minor, currency, status FROM payment_attempt
         WHERE provider_ref = $1 AND tenant_id = $2`,
      [parsed.data.providerRef, tenantId],
    );
    if (!attempt) throw notFound('تراکنش یافت نشد.');
    if (attempt.status === 'paid') {
      res.json({ status: 'paid', alreadyVerified: true });
      return;
    }

    const result = await verifyPayment(parsed.data.providerRef, attempt.amount_minor);
    if (result.status === 'paid') {
      await settlePaidPayment({
        attemptId: attempt.id,
        tenantId,
        planId: attempt.plan_id,
        amountMinor: attempt.amount_minor,
        currency: attempt.currency,
        provider: env.BILLING_PROVIDER,
        providerEventRef: result.providerEventRef,
        actorUserId: req.auth!.sub,
        ip: req.ip,
      });
    } else {
      await query(`UPDATE payment_attempt SET status = $2 WHERE id = $1`, [attempt.id, result.status]);
    }
    res.json({ status: result.status });
  }),
);

/**
 * Settle a paid payment idempotently: record billing_event (unique provider_event_ref),
 * activate the subscription, and generate affiliate commission. Shared by /verify and webhooks.
 */
export async function settlePaidPayment(input: {
  attemptId: string;
  tenantId: string;
  planId: string;
  amountMinor: number;
  currency: string;
  provider: string;
  providerEventRef: string;
  actorUserId?: string;
  ip?: string;
}): Promise<{ settled: boolean }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Idempotent billing event — duplicate provider events are ignored.
    const evt = await client.query<{ id: string }>(
      `INSERT INTO billing_event (tenant_id, type, amount_minor, currency, provider, provider_event_ref, status)
         VALUES ($1, 'invoice_paid', $2, $3, $4, $5, 'recorded')
       ON CONFLICT (provider, provider_event_ref) DO NOTHING RETURNING id`,
      [input.tenantId, input.amountMinor, input.currency, input.provider, input.providerEventRef],
    );
    if (evt.rows.length === 0) {
      await client.query('COMMIT');
      return { settled: false }; // already processed
    }

    await client.query(`UPDATE payment_attempt SET status = 'paid', verified_at = now() WHERE id = $1`, [
      input.attemptId,
    ]);

    // Activate/renew subscription.
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const existing = await client.query<{ id: string }>(
      `SELECT id FROM subscription WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [input.tenantId],
    );
    let subscriptionId: string;
    if (existing.rows[0]) {
      subscriptionId = existing.rows[0].id;
      await client.query(
        `UPDATE subscription SET plan_id = $2, status = 'active', provider = $3,
                current_period_end = $4, updated_at = now() WHERE id = $1`,
        [subscriptionId, input.planId, input.provider, periodEnd],
      );
    } else {
      subscriptionId = (
        await client.query<{ id: string }>(
          `INSERT INTO subscription (tenant_id, plan_id, status, provider, current_period_end)
             VALUES ($1, $2, 'active', $3, $4) RETURNING id`,
          [input.tenantId, input.planId, input.provider, periodEnd],
        )
      ).rows[0].id;
    }
    await client.query(`UPDATE billing_event SET subscription_id = $2 WHERE id = $1`, [
      evt.rows[0].id,
      subscriptionId,
    ]);

    // Reflect plan + active status on the merchant billing record.
    await client.query(
      `UPDATE merchant SET status = 'active', mrr_amount = $2 WHERE tenant_id = $1`,
      [input.tenantId, input.amountMinor],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Affiliate commission (idempotent on referral+period). Period keyed by month.
  const period = new Date().toISOString().slice(0, 7);
  await generateCommissionForPayment({
    tenantId: input.tenantId,
    amountMinor: input.amountMinor,
    currency: input.currency,
    period,
  });

  await audit({
    actorUserId: input.actorUserId ?? null,
    action: 'billing.payment.settled',
    targetType: 'tenant',
    targetId: input.tenantId,
    requestIp: input.ip ?? null,
    meta: { amountMinor: input.amountMinor, provider: input.provider },
  });
  return { settled: true };
}
