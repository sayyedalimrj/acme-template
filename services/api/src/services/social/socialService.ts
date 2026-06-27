/**
 * Social connections and publish jobs — tenant/site scoped.
 */
import { query, queryOne } from '../db';
import { badRequest, notFound } from '../util/errors';
import { audit } from '../audit';
import { sealSecret } from '../security/credentialVault';
import {
  defaultCapabilities,
  providerForPlatform,
  type ProductPublishInput,
  type SocialPlatform,
} from './types';

export type { SocialPlatform } from './types';

export interface SocialConnectionRow {
  id: string;
  tenant_id: string;
  site_id: string;
  platform: SocialPlatform;
  display_name: string;
  handle_url: string | null;
  status: string;
  auth_type: string;
  capabilities: Record<string, boolean>;
  auto_publish_enabled: boolean;
  caption_template: string | null;
  last_error: string | null;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

function publicConnection(row: SocialConnectionRow): Record<string, unknown> {
  return {
    id: row.id,
    siteId: row.site_id,
    platform: row.platform,
    displayName: row.display_name,
    handleUrl: row.handle_url,
    status: row.status,
    authType: row.auth_type,
    capabilities: row.capabilities,
    autoPublishEnabled: row.auto_publish_enabled,
    captionTemplate: row.caption_template,
    lastError: row.last_error,
    lastSyncAt: row.last_sync_at,
  };
}

export async function listSocialConnections(siteId: string): Promise<Record<string, unknown>[]> {
  const rows = await query<SocialConnectionRow>(
    `SELECT * FROM social_connection WHERE site_id = $1 ORDER BY created_at DESC`,
    [siteId],
  );
  return rows.map(publicConnection);
}

export async function createSocialConnection(input: {
  tenantId: string;
  siteId: string;
  platform: SocialPlatform;
  displayName: string;
  handleUrl?: string;
  authType: string;
  token?: string;
  autoPublishEnabled?: boolean;
  captionTemplate?: string;
  actorUserId: string;
}): Promise<Record<string, unknown>> {
  const caps = defaultCapabilities(input.platform);
  let tokenFields: Record<string, string | null> = {
    token_iv: null,
    token_auth_tag: null,
    token_ciphertext: null,
    token_key_version: null,
  };
  if (input.token?.trim()) {
    const sealed = sealSecret(input.token.trim());
    tokenFields = {
      token_iv: sealed.iv,
      token_auth_tag: sealed.authTag,
      token_ciphertext: sealed.ciphertext,
      token_key_version: sealed.keyVersion,
    };
  }
  const row = await queryOne<SocialConnectionRow>(
    `INSERT INTO social_connection
       (tenant_id, site_id, platform, display_name, handle_url, status, auth_type, capabilities,
        token_iv, token_auth_tag, token_ciphertext, token_key_version,
        auto_publish_enabled, caption_template)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      input.tenantId,
      input.siteId,
      input.platform,
      input.displayName,
      input.handleUrl ?? null,
      input.authType,
      JSON.stringify(caps),
      tokenFields.token_iv,
      tokenFields.token_auth_tag,
      tokenFields.token_ciphertext,
      tokenFields.token_key_version,
      input.autoPublishEnabled ?? false,
      input.captionTemplate ?? null,
    ],
  );
  if (!row) throw badRequest('ایجاد اتصال شبکه اجتماعی ممکن نشد.');
  const provider = providerForPlatform(input.platform, input.displayName);
  const test = await provider.testConnection();
  await query(
    `UPDATE social_connection SET status = $2, last_sync_at = now(), last_error = NULL, updated_at = now()
       WHERE id = $1`,
    [row.id, test.ok ? 'connected' : 'error'],
  );
  if (!test.ok) {
    await query(`UPDATE social_connection SET last_error = $2 WHERE id = $1`, [row.id, test.message]);
  }
  await audit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: 'social.connection.create',
    targetType: 'social_connection',
    targetId: row.id,
    metadata: { platform: input.platform, siteId: input.siteId },
  });
  const updated = await queryOne<SocialConnectionRow>(`SELECT * FROM social_connection WHERE id = $1`, [
    row.id,
  ]);
  return publicConnection(updated!);
}

export async function testSocialConnection(
  connectionId: string,
  siteId: string,
): Promise<{ ok: boolean; message: string }> {
  const row = await queryOne<SocialConnectionRow>(
    `SELECT * FROM social_connection WHERE id = $1 AND site_id = $2`,
    [connectionId, siteId],
  );
  if (!row) throw notFound('اتصال یافت نشد.');
  const provider = providerForPlatform(row.platform, row.display_name);
  const result = await provider.testConnection();
  await query(
    `UPDATE social_connection SET status = $2, last_sync_at = now(), last_error = $3, updated_at = now()
       WHERE id = $1`,
    [row.id, result.ok ? 'connected' : 'error', result.ok ? null : result.message],
  );
  return result;
}

export async function disconnectSocialConnection(
  connectionId: string,
  siteId: string,
  actorUserId: string,
): Promise<void> {
  const row = await queryOne<{ tenant_id: string }>(
    `SELECT tenant_id FROM social_connection WHERE id = $1 AND site_id = $2`,
    [connectionId, siteId],
  );
  if (!row) throw notFound('اتصال یافت نشد.');
  await query(
    `UPDATE social_connection SET status = 'revoked', updated_at = now() WHERE id = $1`,
    [connectionId],
  );
  await audit({
    tenantId: row.tenant_id,
    actorUserId,
    action: 'social.connection.revoke',
    targetType: 'social_connection',
    targetId: connectionId,
    metadata: { siteId },
  });
}

export async function enqueueProductPublishJob(input: {
  tenantId: string;
  siteId: string;
  connectionId: string;
  productExternalId: string;
  payload: ProductPublishInput;
  action?: 'publish' | 'update';
  actorUserId: string;
}): Promise<Record<string, unknown>> {
  const conn = await queryOne<SocialConnectionRow>(
    `SELECT * FROM social_connection WHERE id = $1 AND site_id = $2 AND status = 'connected'`,
    [input.connectionId, input.siteId],
  );
  if (!conn) throw badRequest('کانال متصل یافت نشد.');
  const idempotencyKey = `${input.action ?? 'publish'}:${input.productExternalId}:${input.connectionId}:${Date.now()}`;
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM social_publish_job WHERE site_id = $1 AND idempotency_key = $2`,
    [input.siteId, idempotencyKey],
  );
  if (existing) {
    const job = await queryOne(`SELECT * FROM social_publish_job WHERE id = $1`, [existing.id]);
    return job as Record<string, unknown>;
  }
  const job = await queryOne<{ id: string }>(
    `INSERT INTO social_publish_job
       (tenant_id, site_id, connection_id, product_external_id, action, status, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,'queued',$6,$7)
     RETURNING id`,
    [
      input.tenantId,
      input.siteId,
      input.connectionId,
      input.productExternalId,
      input.action ?? 'publish',
      JSON.stringify(input.payload),
      idempotencyKey,
    ],
  );
  if (!job) throw badRequest('صف انتشار ایجاد نشد.');
  void processPublishJob(job.id).catch(() => undefined);
  await audit({
    tenantId: input.tenantId,
    actorUserId: input.actorUserId,
    action: 'social.publish.enqueue',
    targetType: 'social_publish_job',
    targetId: job.id,
    metadata: { productId: input.productExternalId, connectionId: input.connectionId },
  });
  return (
    (await queryOne(`SELECT * FROM social_publish_job WHERE id = $1`, [job.id])) ??
    ({ id: job.id } as Record<string, unknown>)
  );
}

async function processPublishJob(jobId: string): Promise<void> {
  const job = await queryOne<{
    id: string;
    tenant_id: string;
    site_id: string;
    connection_id: string;
    product_external_id: string;
    action: string;
    payload: ProductPublishInput | string;
  }>(`SELECT * FROM social_publish_job WHERE id = $1`, [jobId]);
  if (!job) return;
  const payload: ProductPublishInput =
    typeof job.payload === 'string'
      ? (JSON.parse(job.payload) as ProductPublishInput)
      : job.payload;
  await query(`UPDATE social_publish_job SET status = 'running', updated_at = now() WHERE id = $1`, [
    jobId,
  ]);
  const conn = await queryOne<SocialConnectionRow>(`SELECT * FROM social_connection WHERE id = $1`, [
    job.connection_id,
  ]);
  if (!conn) {
    await query(
      `UPDATE social_publish_job SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`,
      [jobId, 'اتصال کانال یافت نشد.'],
    );
    return;
  }
  try {
    const provider = providerForPlatform(conn.platform, conn.display_name);
    const published = await queryOne<{ external_post_id: string | null }>(
      `SELECT external_post_id FROM social_published_post
         WHERE connection_id = $1 AND product_external_id = $2`,
      [conn.id, job.product_external_id],
    );
    let result;
    if (job.action === 'update' && published?.external_post_id) {
      result = await provider.updatePublishedProduct(published.external_post_id, payload);
    } else {
      result = await provider.publishProduct(payload);
    }
    const status = result.editSupported || job.action !== 'update' ? 'published' : 'edit_not_supported';
    await query(
      `UPDATE social_publish_job SET status = $2, external_post_id = $3, external_post_url = $4,
              updated_at = now() WHERE id = $1`,
      [jobId, status, result.externalPostId ?? null, result.externalPostUrl ?? null],
    );
    await query(
      `INSERT INTO social_published_post
         (tenant_id, site_id, connection_id, product_external_id, platform, external_post_id, external_post_url, last_job_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (connection_id, product_external_id) DO UPDATE SET
         external_post_id = EXCLUDED.external_post_id,
         external_post_url = EXCLUDED.external_post_url,
         last_job_id = EXCLUDED.last_job_id,
         updated_at = now()`,
      [
        job.tenant_id,
        job.site_id,
        conn.id,
        job.product_external_id,
        conn.platform,
        result.externalPostId ?? null,
        result.externalPostUrl ?? null,
        jobId,
      ],
    );
    await query(
      `INSERT INTO social_channel_event (tenant_id, site_id, connection_id, job_id, level, message)
         VALUES ($1,$2,$3,$4,'info',$5)`,
      [job.tenant_id, job.site_id, conn.id, jobId, `انتشار ${conn.platform} ثبت شد.`],
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'خطای انتشار';
    await query(
      `UPDATE social_publish_job SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`,
      [jobId, msg],
    );
  }
}

export async function listPublishJobs(siteId: string, productId?: string): Promise<unknown[]> {
  if (productId) {
    return query(
      `SELECT j.*, c.platform, c.display_name FROM social_publish_job j
         JOIN social_connection c ON c.id = j.connection_id
        WHERE j.site_id = $1 AND j.product_external_id = $2
        ORDER BY j.created_at DESC LIMIT 50`,
      [siteId, productId],
    );
  }
  return query(
    `SELECT j.*, c.platform, c.display_name FROM social_publish_job j
       JOIN social_connection c ON c.id = j.connection_id
      WHERE j.site_id = $1 ORDER BY j.created_at DESC LIMIT 50`,
    [siteId],
  );
}
