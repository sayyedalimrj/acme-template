/**
 * Credential vault placeholder (backend skeleton).
 *
 * CRITICAL: This model stores **metadata only**. It must NEVER contain a secret value.
 * There are deliberately no `secret`, `password`, `tokenValue`, `consumerSecret`,
 * `consumerKey`, or any raw-credential fields on `CredentialRecordMetadata`. Raw secrets
 * will only ever live in the future encrypted backend vault, never in this type, the
 * client, mocks, tests, or git. The credential policy helpers actively reject raw secret
 * fields (see `../security/credentialPolicy.ts`). See `security-model.md`.
 */
import type { SiteConnectionCapability, SiteId } from './site';
import type { TenantId } from './tenant';

/** Opaque credential-record identifier (refers to a vault entry; not the secret itself). */
export type CredentialId = string;

/**
 * The kind of credential a vault entry represents. `*_later` kinds are reserved for future
 * provider phases and are never collected in this skeleton.
 */
export type CredentialKind =
  | 'wordpress_application_password'
  | 'woocommerce_rest_key'
  | 'companion_plugin_token'
  | 'webhook_secret'
  | 'sms_provider_key_later'
  | 'ai_provider_key_later';

/**
 * Storage lifecycle of a credential. In this skeleton nothing is ever actually stored:
 * the furthest real state is `pending_backend_vault`; `stored_in_vault_later` is reserved
 * for when the encrypted vault exists.
 */
export type CredentialStorageStatus =
  | 'not_collected'
  | 'pending_backend_vault'
  | 'stored_in_vault_later'
  | 'revoked'
  | 'rotated'
  | 'invalid';

/**
 * Metadata describing a credential vault entry. Contains NO secret value — only references,
 * timestamps, a masked (non-reversible) display label, and the capabilities the credential
 * is scoped to.
 */
export interface CredentialRecordMetadata {
  id: CredentialId;
  tenantId: TenantId;
  siteId: SiteId;
  kind: CredentialKind;
  status: CredentialStorageStatus;
  /** ISO-8601 timestamps. */
  createdAt: string;
  rotatedAt?: string;
  lastUsedAt?: string;
  /**
   * A masked, non-secret display label (e.g. "woocommerce_rest_key ••••"). Must never
   * reveal or resemble a real secret value; passed through redaction on construction.
   */
  maskedLabel: string;
  /** Capabilities this credential is authorized to enable. */
  permissionScope: SiteConnectionCapability[];
  /** Optional non-secret operator notes (redacted on construction). */
  notes?: string;
}
