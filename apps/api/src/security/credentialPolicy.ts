/**
 * Credential policy helpers (backend skeleton).
 *
 * Pure helpers that enforce the "metadata only, never raw secrets" rule when building
 * credential records, and that reject any input carrying raw secret-like fields. NONE of
 * these store, log, or echo a secret value. See `security-model.md` and `credential.ts`.
 */
import type {
  CredentialKind,
  CredentialRecordMetadata,
  CredentialStorageStatus,
} from '../domain/credential';
import type { SiteConnectionCapability, SiteId } from '../domain/site';
import type { TenantId } from '../domain/tenant';
import { createSafeError, type Result } from './errors';
import { containsSensitiveKey, redactSensitiveText } from './redaction';

/**
 * Scan an arbitrary input for raw secret-like field names (recursively) and return the
 * offending field *names* (never values). Empty array means the input is clean.
 */
export function findRawSecretFields(input: unknown, maxDepth = 4): string[] {
  const found: string[] = [];
  walk(input, maxDepth, found);
  return Array.from(new Set(found));
}

function walk(input: unknown, depth: number, found: string[]): void {
  if (input === null || typeof input !== 'object' || depth <= 0) {
    return;
  }
  if (Array.isArray(input)) {
    for (const item of input) {
      walk(item, depth - 1, found);
    }
    return;
  }
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (containsSensitiveKey(key)) {
      found.push(key);
    }
    walk(value, depth - 1, found);
  }
}

/**
 * Assert that an input object carries NO raw secret-like fields. Returns a clean result, or
 * a safe `raw_secret_rejected` error whose details list only the offending field *names*
 * (the raw values are never read into the error). Does not throw.
 */
export function assertNoRawSecretFields(input: unknown): Result<true> {
  const offending = findRawSecretFields(input);
  if (offending.length === 0) {
    return { ok: true, data: true };
  }
  return {
    ok: false,
    error: createSafeError('raw_secret_rejected', undefined, {
      rejectedFieldCount: offending.length,
      rejectedFields: offending.join(', '),
    }),
  };
}

/** Safe input for building credential metadata — must contain NO secret value. */
export interface BuildCredentialMetadataInput {
  tenantId: TenantId;
  siteId: SiteId;
  kind: CredentialKind;
  permissionScope: SiteConnectionCapability[];
  /** Optional non-secret masked label; a safe default is derived from `kind` if omitted. */
  maskedLabel?: string;
  /** Optional non-secret operator notes. */
  notes?: string;
  /** Defaults to `pending_backend_vault` (nothing is actually stored in the skeleton). */
  status?: CredentialStorageStatus;
  /** Optional explicit id; otherwise derived deterministically from site + kind. */
  id?: string;
  /** Optional ISO timestamp override (for deterministic tests/examples). */
  now?: string;
}

function defaultMaskedLabel(kind: CredentialKind): string {
  return `${kind} ••••`;
}

/**
 * Build a `CredentialRecordMetadata` from a safe input. First rejects any raw secret-like
 * fields; then constructs a metadata-only record with a redacted, non-secret masked label
 * and notes. The result NEVER contains a secret value.
 */
export function buildCredentialMetadata(
  input: BuildCredentialMetadataInput,
): Result<CredentialRecordMetadata> {
  const guard = assertNoRawSecretFields(input);
  if (!guard.ok) {
    return guard;
  }
  const createdAt = input.now ?? new Date().toISOString();
  const metadata: CredentialRecordMetadata = {
    id: input.id ?? `cred_${input.siteId}_${input.kind}`,
    tenantId: input.tenantId,
    siteId: input.siteId,
    kind: input.kind,
    status: input.status ?? 'pending_backend_vault',
    createdAt,
    maskedLabel: redactSensitiveText(input.maskedLabel ?? defaultMaskedLabel(input.kind)),
    permissionScope: [...input.permissionScope],
    ...(input.notes ? { notes: redactSensitiveText(input.notes) } : {}),
  };
  return { ok: true, data: metadata };
}

/** Statuses in which a stored credential could (in a future phase) actually be used. */
const USABLE_STATUSES: ReadonlySet<CredentialStorageStatus> = new Set<CredentialStorageStatus>([
  'stored_in_vault_later',
]);

/**
 * Whether a credential's metadata authorizes a given capability. Requires both a usable
 * storage status and the capability present in the credential's scope. In this skeleton no
 * credential is ever in a usable status, so this returns `false` for current mock data —
 * by design.
 */
export function canUseCredentialForCapability(
  metadata: CredentialRecordMetadata,
  capability: SiteConnectionCapability,
): boolean {
  return USABLE_STATUSES.has(metadata.status) && metadata.permissionScope.includes(capability);
}

/** Human-readable, frontend-safe label for a credential storage status. */
export function credentialStatusLabel(status: CredentialStorageStatus): string {
  const labels: Record<CredentialStorageStatus, string> = {
    not_collected: 'Not collected',
    pending_backend_vault: 'Pending backend vault',
    stored_in_vault_later: 'Stored in vault (future)',
    revoked: 'Revoked',
    rotated: 'Rotated',
    invalid: 'Invalid',
  };
  return labels[status];
}
