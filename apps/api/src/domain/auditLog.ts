/**
 * Audit log model (backend skeleton).
 *
 * Defines the shape of an auditable record for privileged actions. NO real storage exists
 * here; a tiny in-memory sink is provided only for examples/tests. Audit details must be
 * frontend-safe and redacted — entries must NEVER contain raw credentials (the sink runs
 * details through redaction). See `security-model.md`.
 */
import type { ApiRole, ApiUserId } from './user';
import type { SiteId } from './site';
import type { TenantId } from './tenant';

/** Who performed an action. */
export interface AuditActor {
  type: 'user' | 'system' | 'support';
  id?: ApiUserId;
  role?: ApiRole;
}

/** What action was performed. */
export type AuditAction =
  | 'site.connection.requested'
  | 'credential.metadata.created'
  | 'credential.raw_secret.rejected'
  | 'site.connection.verified'
  | 'woocommerce.proxy.requested'
  | 'webhook.received'
  | 'webhook.rejected'
  | 'product.mutation.requested_later'
  | 'notification.send.requested_later'
  | 'ai.provider.requested_later';

/** What the action targeted. */
export interface AuditTarget {
  type:
    | 'tenant'
    | 'site'
    | 'credential'
    | 'webhook'
    | 'product'
    | 'order'
    | 'customer'
    | 'notification';
  id?: string;
}

/** Risk classification of an audited action. */
export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * A single audit log entry. `details` must be frontend-safe and redacted (no secrets, no
 * stack traces, no raw values).
 */
export interface AuditLogEntry {
  id: string;
  tenantId?: TenantId;
  siteId?: SiteId;
  actor: AuditActor;
  action: AuditAction;
  target: AuditTarget;
  riskLevel: AuditRiskLevel;
  /** ISO-8601 timestamp. */
  at: string;
  /** Redacted, non-secret context. */
  details?: Record<string, string | number | boolean>;
}
