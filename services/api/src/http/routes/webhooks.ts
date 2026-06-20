/**
 * Webhook receivers — WooCommerce store webhooks + payment provider webhooks.
 *
 * Every webhook is: signature-verified, deduped by idempotency key, stored with a status, and
 * never applied twice. Unverified webhooks are recorded as 'ignored' and never trusted. The raw
 * body is captured for exact-bytes HMAC verification.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

import { Router, type Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { env } from '../../env';
import { audit } from '../../services/audit';
import { getSite, getWooCredentials, getWooWebhookSecret } from '../../services/sites';
import { getOrder, getProduct } from '../../services/woocommerce/wooClient';
import { settlePaidPayment } from './billing';
import { query, queryOne } from '../../db';
import { asyncHandler } from '../asyncHandler';
import type { AuthedRequest } from '../middleware/auth';

export const webhookRouter = Router();
webhookRouter.use(express.text({ type: '*/*', limit: '2mb' }));
webhookRouter.use(rateLimit({ windowMs: 60 * 1000, max: 240, standardHeaders: true, legacyHeaders: false }));

function safeEqualB64(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Record a webhook event idempotently. Returns false if it was already received. */
async function recordEvent(input: {
  source: 'woocommerce' | 'payment' | 'plugin';
  siteId?: string | null;
  tenantId?: string | null;
  eventType: string;
  idempotencyKey: string;
  summary?: unknown;
}): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `INSERT INTO webhook_event (source, site_id, tenant_id, event_type, idempotency_key, status, payload_summary)
       VALUES ($1, $2, $3, $4, $5, 'received', $6)
     ON CONFLICT (source, idempotency_key) DO NOTHING RETURNING id`,
    [
      input.source,
      input.siteId ?? null,
      input.tenantId ?? null,
      input.eventType,
      input.idempotencyKey,
      input.summary ? JSON.stringify(input.summary) : null,
    ],
  );
  return rows[0]?.id ?? null;
}

// ---- WooCommerce store webhooks ----

webhookRouter.post(
  '/woocommerce/:siteId',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const siteId = req.params.siteId;
    const site = await getSite(siteId);
    // Always 200 quickly to avoid Woo retries storms, but only ACT on verified events.
    if (!site) {
      res.json({ ok: true });
      return;
    }

    const bodyString = typeof req.body === 'string' ? req.body : '';
    const signature = String(req.headers['x-wc-webhook-signature'] ?? '');
    const topic = String(req.headers['x-wc-webhook-topic'] ?? 'unknown');
    const deliveryId = String(req.headers['x-wc-webhook-delivery-id'] ?? '');
    const resourceId = String(req.headers['x-wc-webhook-resource'] ?? '');
    const idempotencyKey = deliveryId
      ? `${siteId}:${deliveryId}`
      : `${siteId}:${topic}:${createHmac('sha256', 'idemp').update(bodyString).digest('hex').slice(0, 32)}`;

    const secret = await getWooWebhookSecret(siteId);
    let verified = false;
    if (secret) {
      const expected = createHmac('sha256', secret).update(bodyString, 'utf8').digest('base64');
      verified = Boolean(signature) && safeEqualB64(expected, signature);
    }

    const eventId = await recordEvent({
      source: 'woocommerce',
      siteId,
      tenantId: site.tenant_id,
      eventType: topic,
      idempotencyKey,
      summary: { resource: resourceId, verified },
    });
    if (!eventId) {
      res.json({ ok: true, deduped: true }); // already processed
      return;
    }
    if (!verified) {
      await query(`UPDATE webhook_event SET status = 'ignored', processed_at = now() WHERE id = $1`, [
        eventId,
      ]);
      res.json({ ok: true, ignored: true });
      return;
    }

    try {
      await applyWooWebhook(siteId, site.tenant_id, topic, bodyString);
      await query(`UPDATE webhook_event SET status = 'processed', processed_at = now() WHERE id = $1`, [
        eventId,
      ]);
    } catch (err) {
      await query(`UPDATE webhook_event SET status = 'failed', error = $2, processed_at = now() WHERE id = $1`, [
        eventId,
        (err as Error).message?.slice(0, 300) ?? 'apply failed',
      ]);
    }
    res.json({ ok: true });
  }),
);

async function applyWooWebhook(
  siteId: string,
  tenantId: string,
  topic: string,
  bodyString: string,
): Promise<void> {
  const body = bodyString ? (JSON.parse(bodyString) as Record<string, unknown>) : {};
  const externalId = String(body.id ?? '');
  if (!externalId) return;
  const creds = await getWooCredentials(siteId);

  if (topic.startsWith('order')) {
    if (!creds) return;
    const order = await getOrder(creds, externalId);
    await query(
      `INSERT INTO synced_order (site_id, tenant_id, external_id, number, status, total_minor, currency, customer_name, external_created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())
       ON CONFLICT (site_id, external_id) DO UPDATE SET
         number=EXCLUDED.number, status=EXCLUDED.status, total_minor=EXCLUDED.total_minor,
         customer_name=EXCLUDED.customer_name, updated_at=now()`,
      [siteId, tenantId, order.externalId, order.number, order.status, order.totalMinor, order.currency, order.customerName, order.createdAt],
    );
  } else if (topic.startsWith('product')) {
    if (!creds) return;
    const product = await getProduct(creds, externalId);
    await query(
      `INSERT INTO synced_product (site_id, tenant_id, external_id, name, sku, status, price_minor, currency, stock_status, stock_qty, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now())
       ON CONFLICT (site_id, external_id) DO UPDATE SET
         name=EXCLUDED.name, sku=EXCLUDED.sku, status=EXCLUDED.status, price_minor=EXCLUDED.price_minor,
         stock_status=EXCLUDED.stock_status, stock_qty=EXCLUDED.stock_qty, updated_at=now()`,
      [siteId, tenantId, product.externalId, product.name, product.sku, product.status, product.priceMinor, product.currency, product.stockStatus, product.stockQty],
    );
  }
}

// ---- Payment provider webhooks ----

webhookRouter.post(
  '/payment/:provider',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const bodyString = typeof req.body === 'string' ? req.body : '';
    const signature = String(req.headers['x-webhook-signature'] ?? '');

    // Verify shared-secret signature when configured; otherwise record as ignored (never trust).
    const webhookSecret = env.PAYMENT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      res.json({ ok: true, ignored: true });
      return;
    }
    const expected = createHmac('sha256', webhookSecret).update(bodyString, 'utf8').digest('hex');
    const verified = Boolean(signature) && safeEqualB64(expected, signature);

    let body: Record<string, unknown> = {};
    try {
      body = bodyString ? (JSON.parse(bodyString) as Record<string, unknown>) : {};
    } catch {
      res.status(400).json({ error: { code: 'bad_body', message: 'invalid body' } });
      return;
    }

    const providerRef = String(body.providerRef ?? body.authority ?? '');
    const idempotencyKey = `${req.params.provider}:${providerRef || createHmac('sha256', 'p').update(bodyString).digest('hex').slice(0, 32)}`;
    const eventId = await recordEvent({
      source: 'payment',
      eventType: String(body.type ?? 'payment.event'),
      idempotencyKey,
      summary: { provider: req.params.provider, verified },
    });
    if (!eventId) {
      res.json({ ok: true, deduped: true });
      return;
    }
    if (!verified) {
      await query(`UPDATE webhook_event SET status = 'ignored', processed_at = now() WHERE id = $1`, [eventId]);
      res.json({ ok: true, ignored: true });
      return;
    }

    // Settle the matching payment attempt idempotently.
    const attempt = await queryOne<{
      id: string;
      tenant_id: string;
      plan_id: string;
      amount_minor: number;
      currency: string;
    }>(
      `SELECT id, tenant_id, plan_id, amount_minor, currency FROM payment_attempt WHERE provider_ref = $1`,
      [providerRef],
    );
    if (attempt) {
      await settlePaidPayment({
        attemptId: attempt.id,
        tenantId: attempt.tenant_id,
        planId: attempt.plan_id,
        amountMinor: attempt.amount_minor,
        currency: attempt.currency,
        provider: req.params.provider,
        providerEventRef: idempotencyKey,
      });
    }
    await query(`UPDATE webhook_event SET status = 'processed', processed_at = now() WHERE id = $1`, [eventId]);
    await audit({ action: 'webhook.payment.processed', targetType: 'payment', targetId: providerRef });
    res.json({ ok: true });
  }),
);
