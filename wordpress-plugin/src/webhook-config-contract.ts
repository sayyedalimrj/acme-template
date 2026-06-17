/**
 * WooCommerce webhook configuration contract (skeleton).
 *
 * Models the PLAN for registering WooCommerce webhooks that point at the backend receiver.
 * CONTRACT ONLY. Real webhook creation, the backend receiver URL, signature verification,
 * idempotency, retry/backoff, and delivery logs are all implemented LATER. No secrets; the
 * receiver URL here is a non-secret placeholder on a fake domain. See `../SECURITY.md`.
 */
import type { SiteId } from './site-identity';

/** WooCommerce webhook topics (compatible with `apps/api` `WebhookEventType`). */
export type WooWebhookTopic =
  | 'order.created'
  | 'order.updated'
  | 'product.created'
  | 'product.updated'
  | 'customer.created'
  | 'customer.updated'
  | 'coupon.created'
  | 'coupon.updated';

/** Registration lifecycle for a topic. `*_later` states are reserved for future phases. */
export type WooWebhookRegistrationStatus =
  | 'not_registered'
  | 'planned'
  | 'registered_later'
  | 'paused'
  | 'failed_later';

/** Delivery policy. All real behavior is deferred to later phases. */
export interface WooWebhookDeliveryPolicy {
  signatureVerification: 'planned';
  idempotency: 'planned';
  retryStrategy: 'none_yet' | 'exponential_backoff_later';
  /** Reserved; not enforced in the skeleton. */
  maxRetriesLater?: number;
  deliveryLogs: 'planned';
}

/** A plan describing which topics to register and how delivery will behave (later). */
export interface WooWebhookConfigurationPlan {
  siteId: SiteId;
  /** Non-secret placeholder for the future backend receiver URL (fake domain). */
  receiverUrlPlaceholder: string;
  topics: { topic: WooWebhookTopic; status: WooWebhookRegistrationStatus }[];
  deliveryPolicy: WooWebhookDeliveryPolicy;
  /** Safe, non-secret notes. */
  notes?: string;
}

/** The topics the plugin will plan to register, all `planned` until the webhook phase. */
export const DEFAULT_WEBHOOK_TOPICS: readonly WooWebhookTopic[] = [
  'order.created',
  'order.updated',
  'product.created',
  'product.updated',
  'customer.created',
  'customer.updated',
  'coupon.created',
  'coupon.updated',
] as const;
