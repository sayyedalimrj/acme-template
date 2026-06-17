/**
 * Webhook receiver contract (backend skeleton).
 *
 * CONTRACTS ONLY. There is no HTTP endpoint, no real signature verification, and no event
 * ingestion. The signature verification function is a placeholder that always reports
 * `not_configured`. Envelopes carry only non-secret metadata (no raw payloads, no secrets).
 * Real verified, idempotent ingestion arrives in the webhook phase. See `security-model.md`.
 */
import type { RequestContext } from '../domain/permission';
import type { SiteId } from '../domain/site';
import { createSafeError, type Result } from '../security/errors';

/** WooCommerce/WordPress webhook event types we expect to handle. */
export type WebhookEventType =
  | 'order.created'
  | 'order.updated'
  | 'product.created'
  | 'product.updated'
  | 'customer.created'
  | 'customer.updated'
  | 'coupon.created'
  | 'coupon.updated'
  | 'inventory.updated'
  | 'unknown';

/**
 * A non-secret envelope describing a received webhook. Deliberately carries no raw payload
 * and no signature value — only a content digest placeholder and safe summary.
 */
export interface WebhookEventEnvelope {
  id: string;
  siteId: SiteId;
  type: WebhookEventType;
  source: 'woocommerce' | 'wordpress' | 'unknown';
  /** ISO-8601 timestamp. */
  receivedAt: string;
  /** Non-secret, non-reversible digest of the payload (placeholder; not computed here). */
  payloadDigest?: string;
  /** Safe, non-secret one-line summary. */
  summary?: string;
}

/** Outcome of signature verification. */
export interface WebhookVerificationResult {
  verified: boolean;
  status: 'not_configured' | 'invalid' | 'valid';
  /** Safe reason (no secrets). */
  reason?: string;
}

/** Processing status for a received webhook. */
export type WebhookProcessingStatus =
  | 'received'
  | 'duplicate'
  | 'rejected'
  | 'processed_later'
  | 'not_configured';

/** Idempotency record used to de-duplicate retried deliveries (modeled, not stored). */
export interface WebhookIdempotencyRecord {
  /** Idempotency key (e.g. provider delivery id) — non-secret. */
  key: string;
  siteId: SiteId;
  /** ISO-8601 timestamp of first sighting. */
  firstSeenAt: string;
  status: WebhookProcessingStatus;
}

/**
 * Placeholder signature verification. ALWAYS returns `not_configured` / `verified: false` —
 * no signing secret exists in the skeleton and no real verification is performed. It never
 * reads or echoes any signature value.
 */
export function verifyWebhookSignaturePlaceholder(): WebhookVerificationResult {
  return {
    verified: false,
    status: 'not_configured',
    reason: 'Webhook signature verification is not configured in the backend skeleton.',
  };
}

/** The webhook receiver. Not implemented in the skeleton; methods return safe outcomes. */
export interface WebhookReceiver {
  /**
   * Accept a webhook envelope. In the skeleton this verifies (always `not_configured`) and
   * returns a `not_configured` processing result without mutating any state.
   */
  receive(
    envelope: WebhookEventEnvelope,
    context: RequestContext,
  ): Promise<Result<{ status: WebhookProcessingStatus; verification: WebhookVerificationResult }>>;
  /** Check whether an idempotency key has been seen (always "not seen" in the skeleton). */
  isDuplicate(key: string, siteId: SiteId): Promise<Result<boolean>>;
}

/** A stub receiver that performs no ingestion and reports `not_configured`. */
export function createNotImplementedWebhookReceiver(): WebhookReceiver {
  return {
    receive: async (envelope) => {
      if (!envelope.siteId || envelope.siteId.trim().length === 0) {
        return { ok: false, error: createSafeError('validation_error', 'A siteId is required.') };
      }
      return {
        ok: true,
        data: {
          status: 'not_configured',
          verification: verifyWebhookSignaturePlaceholder(),
        },
      };
    },
    isDuplicate: async (key, siteId) => {
      if (!key || !siteId) {
        return {
          ok: false,
          error: createSafeError('validation_error', 'A key and siteId are required.'),
        };
      }
      return { ok: true, data: false };
    },
  };
}
