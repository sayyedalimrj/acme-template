/**
 * Event bridge contract (skeleton).
 *
 * Models how the companion plugin would forward store events to the backend. CONTRACT ONLY —
 * NO delivery, NO queue, NO network. CRITICAL: event payloads are **summary-only**. They must
 * NEVER contain raw full order payloads or full customer PII — only minimal, redacted
 * summaries with opaque references. `*_later` event types are reserved and not emitted yet.
 * Topic names are kept compatible with `apps/api` `WebhookEventType`. See `../SECURITY.md`.
 */
import type { SiteId } from './site-identity';

/** Event types the bridge can carry. `*_later` types are reserved for future phases. */
export type PluginEventType =
  | 'order.created'
  | 'order.updated'
  | 'product.created'
  | 'product.updated'
  | 'product.stock_changed'
  | 'customer.created'
  | 'customer.updated'
  | 'coupon.created'
  | 'coupon.updated'
  | 'cart.abandoned_later'
  | 'search.performed_later'
  | 'product_interest.created_later'
  | 'back_in_stock.subscribed_later'
  | 'unknown';

/** Where an event originated. */
export type PluginEventSource = 'woocommerce' | 'wordpress' | 'companion_plugin' | 'unknown';

/** Delivery lifecycle for a bridged event. */
export type PluginEventDeliveryStatus =
  | 'queued'
  | 'delivered_later'
  | 'failed_later'
  | 'skipped'
  | 'not_configured';

/**
 * Summary-only payload. Carries opaque references and minimal, non-PII facts — NEVER the raw
 * entity. For example: an order summary may include status + item count + masked total, but
 * never customer name/email/address or line-item detail.
 */
export interface PluginEventPayloadSummary {
  /** The kind of entity this event concerns. */
  entityType: 'order' | 'product' | 'customer' | 'coupon' | 'cart' | 'search' | 'unknown';
  /** Opaque, non-secret reference to the entity (e.g. an id), never PII. */
  entityRef: string;
  /** Short, non-secret, non-PII change summary (e.g. "status: processing → completed"). */
  changeSummary?: string;
  /** ISO-8601 timestamp the change occurred. */
  occurredAt: string;
}

/** A non-secret event envelope. No raw payloads, no PII, no secrets. */
export interface PluginEventEnvelope {
  /** Non-secret event id (also usable as an idempotency key later). */
  eventId: string;
  siteId: SiteId;
  type: PluginEventType;
  source: PluginEventSource;
  /** ISO-8601 timestamp. */
  occurredAt: string;
  summary: PluginEventPayloadSummary;
  deliveryStatus: PluginEventDeliveryStatus;
  /** Non-secret, non-reversible digest placeholder (not computed in the skeleton). */
  payloadDigest?: string;
}
