/**
 * Plugin routes — the WordPress companion plugin's signed transport.
 *
 *   POST /plugin/handshake  — verify ownership, mark the site connected
 *   POST /plugin/sync       — ingest a signed sync envelope (read-models)
 *   POST /plugin/events     — ingest signed incremental events (idempotent)
 *   POST /plugin/health     — signed heartbeat
 *
 * Every request is authenticated by an HMAC-SHA256 signature over the EXACT raw body + headers,
 * with timestamp-skew and nonce replay protection. The per-site signing secret lives in the
 * credential vault. No JWT/user auth here — the signature IS the auth (source = system).
 */
import { Router, type Response } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';

import { audit } from '../../services/audit';
import { getPluginSigningSecret, getSite } from '../../services/sites';
import { ingestEvents, ingestSyncEnvelope, type SyncEnvelope } from '../../services/plugin/ingest';
import { verifySignature, type SignatureInput } from '../../services/plugin/signature';
import { consumeNonce, isTimestampFresh, pruneExpiredNonces } from '../../services/plugin/replayGuard';
import { query } from '../../db';
import { badRequest, forbidden, unauthorized } from '../../util/errors';
import { asyncHandler } from '../asyncHandler';
import type { AuthedRequest } from '../middleware/auth';

export const pluginRouter = Router();

// Capture the exact raw body (the plugin signs sha256 over these bytes). Limit set to 25mb to
// accommodate large catalog sync envelopes (product + meta + variations) — matches the documented
// Nginx client_max_body_size. No binary upload passes through here (metadata only).
pluginRouter.use(express.text({ type: '*/*', limit: '25mb' }));

const pluginLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });
pluginRouter.use(pluginLimiter);

interface VerifiedContext {
  siteId: string;
  tenantId: string;
  body: Record<string, unknown>;
}

/** Verify signature + freshness + replay, return parsed body + site scope. */
async function verifyRequest(req: AuthedRequest): Promise<VerifiedContext> {
  const siteId = String(req.headers['x-wcos-site-id'] ?? '');
  const timestamp = String(req.headers['x-wcos-timestamp'] ?? '');
  const nonce = String(req.headers['x-wcos-nonce'] ?? '');
  const signature = String(req.headers['x-wcos-signature'] ?? '');
  const pluginVersion = req.headers['x-wcos-plugin-version']
    ? String(req.headers['x-wcos-plugin-version'])
    : undefined;
  const tenantHeader = req.headers['x-wcos-tenant-id'] ? String(req.headers['x-wcos-tenant-id']) : undefined;

  if (!siteId || !timestamp || !nonce || !signature) {
    throw unauthorized('درخواست امضای معتبر ندارد.');
  }
  if (!isTimestampFresh(timestamp)) {
    throw unauthorized('زمان درخواست معتبر نیست.');
  }

  const site = await getSite(siteId);
  if (!site) throw forbidden('فروشگاه ناشناخته است.');
  if (site.connection_mode !== 'plugin') throw forbidden('این فروشگاه در حالت افزونه نیست.');

  const secret = await getPluginSigningSecret(siteId);
  if (!secret) throw forbidden('کلید امضای افزونه تنظیم نشده است.');

  const bodyString = typeof req.body === 'string' ? req.body : '';
  const input: SignatureInput = {
    siteId,
    tenantId: tenantHeader ?? site.tenant_id,
    timestamp,
    nonce,
    pluginVersion,
    bodyString,
  };
  if (!verifySignature(input, secret, signature)) {
    throw unauthorized('امضای درخواست نامعتبر است.');
  }

  // Replay protection (atomic; duplicate nonce → reject).
  const fresh = await consumeNonce(siteId, nonce);
  if (!fresh) throw unauthorized('این درخواست قبلاً پردازش شده است.');
  void pruneExpiredNonces().catch(() => undefined);

  let parsed: Record<string, unknown> = {};
  if (bodyString) {
    try {
      parsed = JSON.parse(bodyString) as Record<string, unknown>;
    } catch {
      throw badRequest('بدنه درخواست JSON معتبر نیست.');
    }
  }
  return { siteId, tenantId: site.tenant_id, body: parsed };
}

pluginRouter.post(
  '/handshake',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const ctx = await verifyRequest(req);
    const pluginVersion = req.headers['x-wcos-plugin-version']
      ? String(req.headers['x-wcos-plugin-version'])
      : null;
    await query(
      `UPDATE plugin_connection SET status='connected', plugin_version=$2, last_seen_at=now() WHERE site_id=$1`,
      [ctx.siteId, pluginVersion],
    );
    await query(
      `UPDATE site_connection SET status='verified', verified_at=now() WHERE site_id=$1 AND mode='plugin'`,
      [ctx.siteId],
    );
    await query(
      `UPDATE site SET status='connected', last_error=NULL,
              woo_version=COALESCE($2, woo_version), wp_version=COALESCE($3, wp_version), updated_at=now()
         WHERE id=$1`,
      [ctx.siteId, (ctx.body.wooVersion as string) ?? null, (ctx.body.wpVersion as string) ?? null],
    );
    await audit({
      action: 'plugin.handshake',
      targetType: 'site',
      targetId: ctx.siteId,
      requestIp: req.ip,
      meta: { pluginVersion },
    });
    res.json({ ok: true, status: 'connected', siteId: ctx.siteId });
  }),
);

pluginRouter.post(
  '/sync',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const ctx = await verifyRequest(req);
    const envelope = ctx.body as unknown as SyncEnvelope;
    if (!envelope.schemaVersion) throw badRequest('نسخه طرح‌واره ارسال نشده است.');
    const stats = await ingestSyncEnvelope(ctx.siteId, ctx.tenantId, envelope);
    await query(`UPDATE plugin_connection SET last_seen_at=now() WHERE site_id=$1`, [ctx.siteId]);
    res.json({ ok: true, stats });
  }),
);

pluginRouter.post(
  '/events',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const ctx = await verifyRequest(req);
    const events = Array.isArray(ctx.body.events)
      ? (ctx.body.events as Array<{ idempotencyKey: string; type: string; summary?: unknown }>)
      : [];
    const recorded = await ingestEvents(ctx.siteId, ctx.tenantId, events);
    await query(`UPDATE plugin_connection SET last_seen_at=now() WHERE site_id=$1`, [ctx.siteId]);
    res.json({ ok: true, received: events.length, recorded });
  }),
);

pluginRouter.post(
  '/health',
  asyncHandler(async (req: AuthedRequest, res: Response) => {
    const ctx = await verifyRequest(req);
    await query(`UPDATE plugin_connection SET last_seen_at=now() WHERE site_id=$1`, [ctx.siteId]);
    res.json({ ok: true, siteId: ctx.siteId, serverTime: new Date().toISOString() });
  }),
);
