/**
 * Site identity contract (skeleton).
 *
 * Safe, non-secret description of a WordPress/WooCommerce site that the companion plugin
 * would report during connection/health. CRITICAL: contains NO admin username/password, NO
 * application password, and NO WooCommerce consumer key/secret. The `adminUrl` is optional
 * and should be omitted/redacted by default. See `../SECURITY.md`.
 *
 * `SiteId` / `TenantId` are kept name-compatible with `apps/api` (opaque string references)
 * but intentionally NOT imported, to avoid cross-package coupling.
 */

/** Opaque site reference (compatible with `apps/api` `SiteId`). */
export type SiteId = string;

/** Opaque tenant reference (compatible with `apps/api` `TenantId`). */
export type TenantId = string;

/** Whether the backend has verified the plugin/site identity. */
export type SiteIdentityVerificationStatus = 'unverified' | 'pending' | 'verified' | 'failed';

/** Safe WordPress environment facts (no secrets). */
export interface WordPressEnvironment {
  wpVersion: string;
  phpVersion: string;
  /** IANA timezone string, e.g. "Asia/Tehran". */
  timezone: string;
  /** WordPress locale, e.g. "fa_IR". */
  locale: string;
  multisite: boolean;
  httpsEnabled: boolean;
  /** Whether a non-default permalink structure is present (REST/pretty links readiness). */
  permalinkStructurePresent: boolean;
  /** Whether the WordPress REST API is reachable. */
  restApiAvailable: boolean;
}

/** Safe WooCommerce environment facts (no secrets). */
export interface WooCommerceEnvironment {
  /** Whether the WooCommerce plugin is active on the site. */
  active: boolean;
  /** Detected WooCommerce version, if active. */
  wooCommerceVersion?: string;
}

/**
 * A point-in-time snapshot of which companion capabilities the site appears to support.
 * Derived from environment + WordPress/WooCommerce capability checks (no secrets).
 */
export interface SiteCapabilitySnapshot {
  /** ISO-8601 timestamp. */
  detectedAt: string;
  capabilities: {
    /** Capability name (see `capabilities-contract.ts`). */
    capability: string;
    available: boolean;
    /** Safe, non-secret note (e.g. "WooCommerce inactive"). */
    note?: string;
  }[];
}

/** Safe site identity reported by the plugin. No credentials of any kind. */
export interface SiteIdentity {
  /** Public site URL (frontend-safe). */
  siteUrl: string;
  /** WordPress home URL (frontend-safe). */
  homeUrl: string;
  /**
   * Optional admin URL. Sensitive (reveals the login surface) — omit or redact by default;
   * never required for connection.
   */
  adminUrl?: string;
  wordpress: WordPressEnvironment;
  woocommerce: WooCommerceEnvironment;
  verificationStatus: SiteIdentityVerificationStatus;
  /** Opaque references, populated only once a connection exists (never secrets). */
  siteId?: SiteId;
  tenantId?: TenantId;
}
