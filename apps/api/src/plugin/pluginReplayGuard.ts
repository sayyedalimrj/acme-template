/**
 * Replay / idempotency guard (backend skeleton).
 *
 * Pure + IN-MEMORY helpers to (a) reject stale timestamps and (b) reject duplicate
 * (site, timestamp, nonce, signature) tuples. There is NO database and NO persistence — state
 * lives only for the process/guard lifetime. Real durable idempotency arrives with the dev
 * delivery endpoint phase. See `security-model.md`.
 */
import type { SiteId } from '../domain/site';

/** Non-secret reference used to detect a replay. */
export interface ReplayRequestRef {
  siteId: SiteId;
  /** ISO-8601 timestamp. */
  timestamp: string;
  nonce: string;
  /** Signature hex (used only as part of the dedupe key; never logged raw). */
  signature: string;
}

/** Outcome of a replay check. */
export interface ReplayCheckResult {
  accepted: boolean;
  /** Safe, non-secret reason when rejected. */
  reason?: string;
}

/** Build a stable dedupe key from non-secret request fields. */
export function buildReplayKey(
  siteId: SiteId,
  timestamp: string,
  nonce: string,
  signature: string,
): string {
  return [siteId, timestamp, nonce, signature].join('|');
}

/** Whether a timestamp is within `maxSkewSeconds` of `now` (ms epoch). */
export function checkReplayWindow(
  timestamp: string,
  now: number,
  maxSkewSeconds: number,
): { withinWindow: boolean; reason?: string } {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    return { withinWindow: false, reason: 'Invalid timestamp format.' };
  }
  if (Math.abs(now - parsed) > maxSkewSeconds * 1000) {
    return { withinWindow: false, reason: 'Timestamp is outside the allowed window.' };
  }
  return { withinWindow: true };
}

/** An in-memory replay guard. */
export interface ReplayGuard {
  recordOrReject(request: ReplayRequestRef): ReplayCheckResult;
  /** Clear all recorded keys (for tests/examples). */
  reset(): void;
}

/** Create an isolated in-memory replay guard (no persistence). */
export function createInMemoryReplayGuard(): ReplayGuard {
  const seen = new Set<string>();
  return {
    recordOrReject(request: ReplayRequestRef): ReplayCheckResult {
      const key = buildReplayKey(
        request.siteId,
        request.timestamp,
        request.nonce,
        request.signature,
      );
      if (seen.has(key)) {
        return { accepted: false, reason: 'Duplicate request (replay) detected.' };
      }
      seen.add(key);
      return { accepted: true };
    },
    reset(): void {
      seen.clear();
    },
  };
}

/** Module-default guard used by `recordOrRejectReplay`. */
const defaultGuard: ReplayGuard = createInMemoryReplayGuard();

/** Record-or-reject against the module-default in-memory guard. */
export function recordOrRejectReplay(request: ReplayRequestRef): ReplayCheckResult {
  return defaultGuard.recordOrReject(request);
}

/** Reset the module-default guard (tests/examples). */
export function resetDefaultReplayGuard(): void {
  defaultGuard.reset();
}
