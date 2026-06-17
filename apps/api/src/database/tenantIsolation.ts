/**
 * Tenant isolation contract (design/contracts only — NO SQL, NO DB library).
 *
 * Pure TypeScript predicates that express how the future platform isolates tenant + site
 * data. There is NO query execution and NO database here — `buildTenantScopedWhereClauseDescription`
 * returns a human-readable DESCRIPTION, not runnable SQL.
 *
 * Principles (binding): **default deny**, **least privilege**, **cross-tenant forbidden by
 * default**. Internal staff roles require an explicit matching scope (support/billing/
 * security/system); merchant roles may only reach their own tenant/site. See
 * `security-model.md`.
 */
import type { SiteId } from '../domain/site';
import type { TenantId } from '../domain/tenant';
import { isMerchantRole, type PlatformRole } from './accessPolicy';

/** How a query is scoped against the tenant hierarchy. */
export type TenantIsolationMode =
  | 'tenant_strict'
  | 'site_strict'
  | 'support_scoped'
  | 'billing_scoped'
  | 'security_scoped'
  | 'system_scoped';

/** Explicit scopes a principal may hold; absence means the related access is denied. */
export type AccessScope = 'tenant' | 'site' | 'support' | 'billing' | 'security' | 'system';

/** The context describing who is querying and what they are trying to reach. */
export interface TenantScopedQueryContext {
  role: PlatformRole;
  /** Acting principal's own tenant (merchant). Internal staff usually have none. */
  actorTenantId?: TenantId;
  /** Explicitly granted scopes (default deny without the required scope). */
  scopes: AccessScope[];
  /** Target tenant of the query. */
  targetTenantId?: TenantId;
  /** Target site of the query (for site-scoped access). */
  targetSiteId?: SiteId;
  /** Requested isolation mode. */
  mode: TenantIsolationMode;
}

/** Reason code for an access decision. */
export type TenantAccessReason =
  | 'allowed'
  | 'missing_target_tenant'
  | 'missing_tenant_scope'
  | 'missing_site_scope'
  | 'cross_tenant_denied'
  | 'missing_support_scope'
  | 'missing_billing_scope'
  | 'missing_security_scope'
  | 'missing_system_scope'
  | 'default_deny';

/** Result of an isolation check. Frontend-safe; never includes secrets. */
export interface TenantAccessDecision {
  allowed: boolean;
  reason: TenantAccessReason;
  message: string;
}

function deny(reason: TenantAccessReason, message: string): TenantAccessDecision {
  return { allowed: false, reason, message };
}

function allow(message = 'Access allowed within tenant scope.'): TenantAccessDecision {
  return { allowed: true, reason: 'allowed', message };
}

function hasScope(context: TenantScopedQueryContext, scope: AccessScope): boolean {
  return context.scopes.includes(scope);
}

/**
 * Assert that the context may access the target tenant. Default deny. Merchant roles must act
 * within their own tenant and hold the `tenant` scope; internal staff must hold the explicit
 * scope matching their role (support/billing/security/system).
 */
export function assertTenantScope(context: TenantScopedQueryContext): TenantAccessDecision {
  if (!context.targetTenantId) {
    return deny('missing_target_tenant', 'No target tenant on the query context.');
  }

  if (isMerchantRole(context.role)) {
    if (!hasScope(context, 'tenant')) {
      return deny('missing_tenant_scope', 'Merchant access requires an explicit tenant scope.');
    }
    if (context.actorTenantId !== context.targetTenantId) {
      return deny('cross_tenant_denied', 'Merchant cannot access another tenant.');
    }
    return allow();
  }

  switch (context.role) {
    case 'support_admin':
      return hasScope(context, 'support')
        ? allow('Support access within explicit support scope.')
        : deny('missing_support_scope', 'support_admin requires an explicit support scope.');
    case 'billing_admin':
      return hasScope(context, 'billing')
        ? allow('Billing access within explicit billing scope.')
        : deny('missing_billing_scope', 'billing_admin requires an explicit billing scope.');
    case 'security_admin':
      return hasScope(context, 'security')
        ? allow('Security access within explicit security scope.')
        : deny('missing_security_scope', 'security_admin requires an explicit security scope.');
    case 'system':
      return hasScope(context, 'system')
        ? allow('System access within explicit system scope.')
        : deny('missing_system_scope', 'system jobs require an explicit system scope.');
    default:
      return deny('default_deny', 'No isolation rule matched; default deny.');
  }
}

/**
 * Assert that the context may access the target SITE. Requires a valid tenant decision first,
 * then a present `targetSiteId` plus the `site` scope (or `system` scope for system jobs).
 */
export function assertSiteScope(context: TenantScopedQueryContext): TenantAccessDecision {
  const tenantDecision = assertTenantScope(context);
  if (!tenantDecision.allowed) {
    return tenantDecision;
  }
  if (!context.targetSiteId) {
    return deny('missing_site_scope', 'No target site on the query context.');
  }
  if (!hasScope(context, 'site') && !hasScope(context, 'system')) {
    return deny('missing_site_scope', 'Site access requires an explicit site scope.');
  }
  return allow('Access allowed within site scope.');
}

/**
 * Whether the context may access a specific tenant-scoped record. A record missing `tenantId`
 * is denied (tenant-scoped rows must always carry a tenant). The record's tenant overrides any
 * `targetTenantId` already on the context.
 */
export function canAccessTenantRecord(
  context: TenantScopedQueryContext,
  record: { tenantId?: TenantId },
): TenantAccessDecision {
  if (!record.tenantId) {
    return deny('default_deny', 'Tenant-scoped record is missing tenantId.');
  }
  return assertTenantScope({ ...context, targetTenantId: record.tenantId });
}

/**
 * Whether the context may access a specific site-scoped record. Requires both tenant and site
 * to be present on the record and to satisfy the isolation rules.
 */
export function canAccessSiteRecord(
  context: TenantScopedQueryContext,
  record: { tenantId?: TenantId; siteId?: SiteId },
): TenantAccessDecision {
  if (!record.tenantId) {
    return deny('default_deny', 'Site-scoped record is missing tenantId.');
  }
  if (!record.siteId) {
    return deny('missing_site_scope', 'Site-scoped record is missing siteId.');
  }
  return assertSiteScope({
    ...context,
    targetTenantId: record.tenantId,
    targetSiteId: record.siteId,
  });
}

/**
 * Build a human-readable DESCRIPTION of the WHERE-clause predicates an isolated query must
 * apply. This is documentation only — it is NOT executable SQL and performs no query.
 */
export function buildTenantScopedWhereClauseDescription(context: TenantScopedQueryContext): string {
  const decision = context.targetSiteId ? assertSiteScope(context) : assertTenantScope(context);
  if (!decision.allowed) {
    return `DENY (${decision.reason})`;
  }

  const parts: string[] = ['tenant_id = :targetTenantId'];
  if (context.targetSiteId) {
    parts.push('site_id = :targetSiteId');
  }
  switch (context.mode) {
    case 'support_scoped':
      parts.push('-- support-bounded fields only (support_safe)');
      break;
    case 'billing_scoped':
      parts.push('-- billing-safe fields only (billing_restricted)');
      break;
    case 'security_scoped':
      parts.push('-- security metadata only (security_restricted; never secrets)');
      break;
    case 'system_scoped':
      parts.push('-- system job; explicit system scope');
      break;
    default:
      break;
  }
  return parts.join(' AND ');
}
