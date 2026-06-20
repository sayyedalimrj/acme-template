/**
 * Replay protection for signed plugin requests.
 *
 * A (site, nonce) pair may be accepted only once within the validity window. The unique index on
 * (site_id, nonce) makes the check atomic: a duplicate insert means a replay. Also enforces a
 * timestamp-skew window so old captured requests can't be replayed after expiry.
 */
import { env } from '../../env';
import { query, queryOne } from '../../db';

export function isTimestampFresh(timestamp: string): boolean {
  const t = Date.parse(timestamp);
  if (Number.isNaN(t)) return false;
  const skewMs = env.PLUGIN_TIMESTAMP_SKEW_SECONDS * 1000;
  return Math.abs(Date.now() - t) <= skewMs;
}

/** Record a nonce; returns false if it was already seen (replay). */
export async function consumeNonce(siteId: string, nonce: string): Promise<boolean> {
  const expiresAt = new Date(Date.now() + env.PLUGIN_TIMESTAMP_SKEW_SECONDS * 2 * 1000);
  const rows = await query<{ id: string }>(
    `INSERT INTO replay_nonce (site_id, nonce, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (site_id, nonce) DO NOTHING RETURNING id`,
    [siteId, nonce, expiresAt],
  );
  return rows.length > 0;
}

/** Opportunistic cleanup of expired nonces (cheap; called occasionally). */
export async function pruneExpiredNonces(): Promise<void> {
  await queryOne(`DELETE FROM replay_nonce WHERE expires_at < now() RETURNING id`);
}
