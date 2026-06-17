/**
 * Health check contract (skeleton).
 *
 * Models the diagnostic health report the companion plugin would produce. CONTRACT ONLY —
 * there is NO health endpoint and NO probing logic here. All output is frontend-safe and
 * non-secret. See `../SECURITY.md`.
 */
import type { SiteId } from './site-identity';

/** Outcome of a single health check item. */
export type HealthCheckStatus = 'pass' | 'warn' | 'fail' | 'unknown';

/** How important a failing item is. */
export type HealthCheckSeverity = 'info' | 'warning' | 'critical';

/** Stable identifiers for the health checks the plugin will run. */
export type HealthCheckId =
  | 'wp_rest_api_reachable'
  | 'woocommerce_active'
  | 'https_enabled'
  | 'permalink_rest_readiness'
  | 'plugin_version'
  | 'webhook_readiness'
  | 'scheduled_action_readiness'
  | 'background_job_readiness';

/** A single health check result. */
export interface HealthCheckItem {
  id: HealthCheckId;
  /** Safe, human-readable label. */
  label: string;
  status: HealthCheckStatus;
  severity: HealthCheckSeverity;
  /** Safe, non-secret detail (no stack traces, no secrets). */
  detail?: string;
}

/** A full health check report. */
export interface PluginHealthCheck {
  siteId?: SiteId;
  /** ISO-8601 timestamp. */
  generatedAt: string;
  /** Rolled-up status across all items. */
  overall: HealthCheckStatus;
  items: HealthCheckItem[];
}

/**
 * Documentation of the checks the plugin will perform, with default severities. The
 * `*_readiness` placeholders cover infrastructure that does not exist yet.
 */
export const HEALTH_CHECK_DEFINITIONS: readonly {
  id: HealthCheckId;
  label: string;
  severity: HealthCheckSeverity;
}[] = [
  { id: 'wp_rest_api_reachable', label: 'WordPress REST API reachable', severity: 'critical' },
  { id: 'woocommerce_active', label: 'WooCommerce active', severity: 'critical' },
  { id: 'https_enabled', label: 'HTTPS enabled', severity: 'critical' },
  { id: 'permalink_rest_readiness', label: 'Permalink / REST readiness', severity: 'warning' },
  { id: 'plugin_version', label: 'Companion plugin version', severity: 'info' },
  { id: 'webhook_readiness', label: 'Webhook readiness', severity: 'warning' },
  {
    id: 'scheduled_action_readiness',
    label: 'Scheduled action readiness (placeholder)',
    severity: 'info',
  },
  {
    id: 'background_job_readiness',
    label: 'Background job readiness (placeholder)',
    severity: 'info',
  },
] as const;
