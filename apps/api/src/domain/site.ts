/**
 * Site domain model (backend skeleton).
 *
 * A site is a connected (or to-be-connected) WordPress/WooCommerce store owned by a tenant.
 * The model holds only frontend-safe connection metadata — never credentials. Secrets are
 * referenced indirectly via credential *metadata* (see `credential.ts`) and only ever live
 * in the future backend vault. See `security-model.md`.
 */
import type { TenantId } from './tenant';

/** Opaque site identifier. The client only ever holds this non-secret reference. */
export type SiteId = string;

/**
 * Connection lifecycle of a site. Mirrors the secure onboarding/connection flow: a site is
 * never "connected" with real credentials in this skeleton — the furthest mock state is
 * `connected_mock`, and real read access (`connected_read_only`) arrives in a later phase.
 */
export type SiteConnectionStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_secure_connection'
  | 'connected_mock'
  | 'connected_read_only'
  | 'connection_error'
  | 'suspended'
  | 'archived';

/** Underlying platform of the site. */
export type SitePlatform = 'woocommerce' | 'wordpress' | 'unknown';

/** Deployment environment of the site. */
export type SiteEnvironment = 'production' | 'staging' | 'local' | 'unknown';

/**
 * A capability the connection is (or will be) authorized for. Read capabilities come first;
 * `*_later` capabilities are reserved for the controlled-mutation and notification phases
 * and are never active in this skeleton.
 */
export type SiteConnectionCapability =
  | 'read_products'
  | 'read_orders'
  | 'read_customers'
  | 'read_reports'
  | 'receive_webhooks'
  | 'mutate_products_later'
  | 'mutate_orders_later'
  | 'send_notifications_later';

/** Health probe state for a site connection. */
export type SiteConnectionHealthState = 'unknown' | 'healthy' | 'degraded' | 'unreachable';

/** Result of a (future) connection health check. Frontend-safe; never includes secrets. */
export interface SiteConnectionHealth {
  state: SiteConnectionHealthState;
  /** ISO-8601 timestamp of the last check, if any. */
  checkedAt?: string;
  /** Short, safe, human-readable status note (no secrets, no stack traces). */
  message?: string;
}

/** A connected (or pending) WordPress/WooCommerce store. Frontend-safe metadata only. */
export interface Site {
  id: SiteId;
  tenantId: TenantId;
  /** Display name (frontend-safe). */
  displayName: string;
  /** Public site URL/domain (frontend-safe, non-secret). */
  url: string;
  platform: SitePlatform;
  environment: SiteEnvironment;
  status: SiteConnectionStatus;
  /** Capabilities the connection is authorized for (read-only in this skeleton). */
  capabilities: SiteConnectionCapability[];
  health: SiteConnectionHealth;
  /** ISO-8601 timestamps. */
  createdAt: string;
  connectedAt?: string;
  lastSyncAt?: string;
}
