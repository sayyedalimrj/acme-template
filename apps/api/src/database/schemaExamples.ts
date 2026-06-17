/**
 * Dependency-free example checks for the production schema DESIGN.
 *
 * Pure, runnable assertions that exercise the tenant-isolation, visibility, retention, and
 * scoping contracts. There is NO database, NO network, and NO secrets here — sample records
 * use only safe placeholder values (no real PII, no real credentials). Mirrors the existing
 * `*Examples.ts` pattern in this package. See `security-model.md`.
 */
import {
  canRoleAccessVisibility,
  getFieldVisibility,
  recordHoldsSecretField,
  type DataVisibilityLevel,
  type PlatformRole,
} from './accessPolicy';
import { RETENTION_POLICIES, getRetentionPolicy } from './dataRetention';
import {
  describeReadModelToDatabaseMapping,
  getSchemaTableDescriptor,
  listRequiredTenantScopedTables,
  validateRecordScoping,
  type CredentialMetadataRecord,
} from './schemaDesign';
import {
  assertTenantScope,
  canAccessTenantRecord,
  type TenantScopedQueryContext,
} from './tenantIsolation';

/** A single example assertion result. */
export interface ExampleResult {
  name: string;
  passed: boolean;
  note: string;
}

const ALL_VISIBILITY_LEVELS: DataVisibilityLevel[] = [
  'public_safe',
  'tenant_safe',
  'support_safe',
  'billing_restricted',
  'security_restricted',
  'pii_restricted',
  'secret_never_expose',
];

const ALL_ROLES: PlatformRole[] = [
  'owner',
  'manager',
  'staff',
  'viewer',
  'support_admin',
  'billing_admin',
  'security_admin',
  'system',
];

/** Run all schema-design example checks. */
export function collectSchemaDesignExampleResults(): ExampleResult[] {
  const results: ExampleResult[] = [];

  // 1. Tenant-scoped entity without tenantId is flagged.
  {
    const issues = validateRecordScoping('support_conversations', {
      id: 'conv_1',
      subject: 'Question',
    });
    results.push({
      name: 'tenant-scoped entity without tenantId is flagged',
      passed: issues.some((i) => i.field === 'tenantId'),
      note: 'validateRecordScoping flags a missing tenantId on a tenant-scoped table.',
    });
  }

  // 2. Cross-tenant access denied.
  {
    const context: TenantScopedQueryContext = {
      role: 'owner',
      actorTenantId: 'tenant_a',
      scopes: ['tenant'],
      mode: 'tenant_strict',
    };
    const decision = canAccessTenantRecord(context, { tenantId: 'tenant_b' });
    results.push({
      name: 'cross-tenant access denied',
      passed: !decision.allowed && decision.reason === 'cross_tenant_denied',
      note: 'A merchant of tenant_a cannot read a tenant_b record.',
    });
  }

  // 2b. Same-tenant access allowed (positive control).
  {
    const context: TenantScopedQueryContext = {
      role: 'owner',
      actorTenantId: 'tenant_a',
      scopes: ['tenant'],
      mode: 'tenant_strict',
    };
    const decision = canAccessTenantRecord(context, { tenantId: 'tenant_a' });
    results.push({
      name: 'same-tenant access allowed',
      passed: decision.allowed && decision.reason === 'allowed',
      note: 'A merchant can read their own tenant record.',
    });
  }

  // 3. support_admin without support scope denied.
  {
    const decision = assertTenantScope({
      role: 'support_admin',
      scopes: [],
      targetTenantId: 'tenant_a',
      mode: 'support_scoped',
    });
    results.push({
      name: 'support_admin without support scope denied',
      passed: !decision.allowed && decision.reason === 'missing_support_scope',
      note: 'support_admin requires an explicit support scope (default deny).',
    });
  }

  // 4. billing_admin cannot access security or secret fields.
  {
    const noSecurity = !canRoleAccessVisibility('billing_admin', 'security_restricted');
    const noSecret = !canRoleAccessVisibility('billing_admin', 'secret_never_expose');
    const yesBilling = canRoleAccessVisibility('billing_admin', 'billing_restricted');
    results.push({
      name: 'billing_admin cannot access security secret fields',
      passed: noSecurity && noSecret && yesBilling,
      note: 'billing_admin sees billing_restricted but not security_restricted or secrets.',
    });
  }

  // 5. secret_never_expose fields rejected for every role.
  {
    const passed = ALL_ROLES.every((role) => !canRoleAccessVisibility(role, 'secret_never_expose'));
    results.push({
      name: 'secret_never_expose fields rejected',
      passed,
      note: 'No role — not even system or security_admin — may read secret_never_expose.',
    });
  }

  // 6. SyncedProductSummary maps to a tenant + site + sync scoped table.
  {
    const mapping = describeReadModelToDatabaseMapping().find(
      (m) => m.readModel === 'SyncedProductSummary',
    );
    const descriptor = getSchemaTableDescriptor('synced_products');
    results.push({
      name: 'SyncedProductSummary maps to tenant/site-scoped table',
      passed:
        !!mapping &&
        mapping.tables.includes('synced_products') &&
        !!descriptor &&
        descriptor.tenantScoped &&
        descriptor.siteScoped &&
        descriptor.syncScoped,
      note: 'synced_products is tenant + site + sync scoped.',
    });
  }

  // 7. CredentialMetadataRecord contains no raw secret fields.
  {
    const credential: CredentialMetadataRecord = {
      id: 'cred_1',
      tenantId: 'tenant_a',
      siteId: 'site_1',
      kind: 'woocommerce_rest_key',
      status: 'pending_backend_vault',
      vaultReference: 'vault_ref_opaque_1',
      maskedLabel: 'woocommerce_rest_key ••••',
      permissionScope: ['read_products'],
      createdAt: '2026-01-01T00:00:00.000Z',
    };
    results.push({
      name: 'CredentialMetadataRecord contains no raw secret fields',
      passed: !recordHoldsSecretField(credential),
      note: 'Credential metadata holds an opaque vault reference + masked label only.',
    });
  }

  // 7b. A record with a raw secret-like field IS rejected (negative control).
  {
    const bad = { tenantId: 'tenant_a', consumerSecret: 'should-not-exist' };
    results.push({
      name: 'raw secret-like field rejected',
      passed: recordHoldsSecretField(bad),
      note: 'recordHoldsSecretField flags a raw consumerSecret field name.',
    });
  }

  // 8. Support conversation requires tenantId.
  {
    const without = validateRecordScoping('support_conversations', { id: 'c1', subject: 'x' });
    const withTenant = validateRecordScoping('support_conversations', {
      id: 'c1',
      tenantId: 'tenant_a',
      subject: 'x',
    });
    results.push({
      name: 'support conversation requires tenantId',
      passed: without.length > 0 && withTenant.length === 0,
      note: 'support_conversations is tenant-scoped; site is optional.',
    });
  }

  // 9. Workflow item requires tenantId.
  {
    const without = validateRecordScoping('workflow_items', { id: 'w1', title: 'task' });
    const withTenant = validateRecordScoping('workflow_items', {
      id: 'w1',
      tenantId: 'tenant_a',
      title: 'task',
    });
    results.push({
      name: 'workflow item requires tenantId',
      passed: without.length > 0 && withTenant.length === 0,
      note: 'workflow_items is tenant-scoped.',
    });
  }

  // 10. Every tenant-scoped table is registered and PII fields are gated.
  {
    const tenantTables = listRequiredTenantScopedTables();
    const piiVisible =
      getFieldVisibility('synced_customers', 'emailRestricted') === 'pii_restricted' &&
      getFieldVisibility('synced_customers', 'phoneRestricted') === 'pii_restricted';
    results.push({
      name: 'tenant-scoped catalog + gated PII',
      passed:
        tenantTables.includes('synced_customers') &&
        tenantTables.includes('support_messages') &&
        piiVisible,
      note: 'Customer PII fields are classified pii_restricted; sync/support tables are tenant-scoped.',
    });
  }

  // 11. Retention: audit logs are preserved and audit-protected.
  {
    const audit = getRetentionPolicy('audit_logs');
    const hasAll = RETENTION_POLICIES.length >= 9;
    results.push({
      name: 'retention policy preserves audit logs',
      passed: !!audit && audit.action === 'preserve' && audit.auditPreserved && hasAll,
      note: 'Audit logs are preserved long-term and never dropped by routine retention.',
    });
  }

  return results;
}

/** Eagerly computed example results. */
export const SCHEMA_DESIGN_EXAMPLE_RESULTS: ExampleResult[] = collectSchemaDesignExampleResults();

/** True only if every schema-design example check passes. */
export const ALL_SCHEMA_DESIGN_EXAMPLES_PASS: boolean = SCHEMA_DESIGN_EXAMPLE_RESULTS.every(
  (r) => r.passed,
);
