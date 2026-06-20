/**
 * Tiny in-memory TTL cache for read-heavy summary endpoints (dashboards, sales reports).
 *
 * Single-instance only (fine for one API node; swap for Redis if you scale horizontally). Never
 * cache anything user-private without a per-user key. Entries expire after `ttlSeconds`.
 */
import { env } from '../env';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  loader: () => Promise<T>,
  ttlSeconds = env.CACHE_TTL_SECONDS,
): Promise<T> {
  if (ttlSeconds <= 0) return loader();
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;
  const value = await loader();
  store.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
  return value;
}

export function invalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export function clearCache(): void {
  store.clear();
}
