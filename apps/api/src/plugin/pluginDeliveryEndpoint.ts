/**
 * Framework-agnostic signed-delivery handler (backend skeleton).
 *
 * `handlePluginSyncDelivery` is a PURE function: it validates headers, the timestamp/replay
 * window, resolves injected signing material, verifies the HMAC signature, validates the sync
 * envelope, and ingests an in-memory snapshot — returning a `PluginDeliveryResult` with a
 * suggested status code. It supports two modes via the OPTIONAL persistence context:
 * `validate_only` (default — never persists) and `validate_and_persist_dev` (persists an
 * accepted snapshot to the IN-MEMORY dev repository only). There is NO HTTP server, NO
 * Express/Fastify/Nest, NO deployment, NO database, and NO external network. See
 * `security-model.md`.
 */
import { createSafeError, type SafeApiError } from '../security/errors';
import type {
  PluginDeliveryErrorCode,
  PluginDeliveryHandlerContext,
  PluginDeliveryResult,
} from './pluginDeliveryResponse';
import type { PluginDeliveryRequest } from './pluginDeliveryRequest';
import { checkReplayWindow } from './pluginReplayGuard';
import { verifyPluginSyncSignature } from './pluginSignature';
import { ingestPluginSyncEnvelope } from './pluginSyncIngestor';
import { persistValidatedPluginSync } from './pluginSyncPersistence';
import {
  classifyValidationIssues,
  isPersistMode,
  mapDeliveryErrorCodeToStatus,
} from './pluginSyncState';
import type { PluginSyncIssue } from './pluginSyncEnvelope';

const ACCEPTED_AUDIT = 'plugin.sync.delivery.accepted';
const REJECTED_AUDIT = 'plugin.sync.delivery.rejected';

/** Map a delivery error code to a safe API error (no secrets, no stack). */
function toSafeError(code: PluginDeliveryErrorCode, message: string): SafeApiError {
  switch (code) {
    case 'missing_headers':
    case 'invalid_payload':
      return createSafeError('validation_error', message);
    case 'invalid_timestamp':
    case 'invalid_signature':
      return createSafeError('unauthorized', message);
    case 'replayed':
      return createSafeError('conflict', message);
    case 'signature_not_configured':
      return createSafeError('not_configured', message);
    case 'internal_error':
    default:
      return createSafeError('internal_error', message);
  }
}

function reject(
  statusCodeSuggestion: number,
  errorCode: PluginDeliveryErrorCode,
  message: string,
  warnings: PluginSyncIssue[],
): PluginDeliveryResult {
  return {
    accepted: false,
    statusCodeSuggestion,
    errorCode,
    error: toSafeError(errorCode, message),
    warnings,
    auditActionSuggestion: REJECTED_AUDIT,
    persistenceStatus: mapDeliveryErrorCodeToStatus(errorCode),
    persisted: false,
  };
}

/**
 * Handle a signed sync delivery request. Pure + framework-agnostic.
 *
 * Order: required headers → timestamp/replay window → resolve signing material → verify
 * signature → record replay → validate envelope → ingest snapshot.
 */
export function handlePluginSyncDelivery(
  request: PluginDeliveryRequest,
  context: PluginDeliveryHandlerContext,
): PluginDeliveryResult {
  const warnings: PluginSyncIssue[] = [];
  const headers = request?.headers ?? {};
  const siteId = headers['x-wcos-site-id'];
  const timestamp = headers['x-wcos-timestamp'];
  const nonce = headers['x-wcos-nonce'];
  const signature = headers['x-wcos-signature'];

  // 1. Required headers.
  if (!siteId || !timestamp || !nonce || !signature) {
    return reject(400, 'missing_headers', 'Required signing headers are missing.', warnings);
  }

  // 2. Timestamp / replay window.
  const now = context.security.now ?? Date.now();
  const maxSkewSeconds = context.security.maxSkewSeconds ?? 300;
  const window = checkReplayWindow(timestamp, now, maxSkewSeconds);
  if (!window.withinWindow) {
    return reject(401, 'invalid_timestamp', window.reason ?? 'Timestamp rejected.', warnings);
  }

  // 3. Resolve signing material (injected provider).
  const resolution = context.security.signatureProvider(siteId);
  if (!resolution || resolution.metadata.status === 'not_configured' || !resolution.material) {
    return reject(
      503,
      'signature_not_configured',
      'Signing material is not configured for this site.',
      warnings,
    );
  }

  // 4. Verify signature over the exact signed body.
  const bodyString =
    typeof request.rawBody === 'string'
      ? request.rawBody
      : JSON.stringify(request.body?.envelope ?? {});
  const verification = verifyPluginSyncSignature(
    {
      siteId,
      tenantId: headers['x-wcos-tenant-id'],
      timestamp,
      nonce,
      pluginVersion: headers['x-wcos-plugin-version'],
      bodyString,
      signature,
    },
    resolution.material,
  );
  if (!verification.verified) {
    return reject(401, 'invalid_signature', 'Signature verification failed.', warnings);
  }

  // 5. Record replay (only once the signature is verified).
  const replay = context.security.replayGuard.recordOrReject({
    siteId,
    timestamp,
    nonce,
    signature,
  });
  if (!replay.accepted) {
    return reject(409, 'replayed', replay.reason ?? 'Replay detected.', warnings);
  }

  // 6. Validate + ingest the envelope (in-memory only).
  const ingest = ingestPluginSyncEnvelope(request.body?.envelope);
  warnings.push(...ingest.validation.warnings);
  if (!ingest.accepted) {
    return {
      accepted: false,
      statusCodeSuggestion: 422,
      errorCode: 'invalid_payload',
      error: createSafeError('validation_error', 'Sync payload failed validation.', {
        errorCount: ingest.validation.errors.length,
      }),
      warnings,
      auditActionSuggestion: REJECTED_AUDIT,
      persistenceStatus: classifyValidationIssues(ingest.validation.errors),
      persisted: false,
    };
  }

  // 7. Accepted. Optionally persist to the in-memory dev repository (controlled dev mode).
  const persistence = context.persistence;
  if (persistence && isPersistMode(persistence.mode) && persistence.repository) {
    const persistResult = persistValidatedPluginSync(request.body?.envelope, {
      repository: persistence.repository,
      mode: persistence.mode,
      source: persistence.source ?? 'signed_delivery_dev',
      now,
      generateId: persistence.generateId,
    });
    return {
      accepted: true,
      statusCodeSuggestion: 202,
      warnings,
      snapshot: ingest.snapshot,
      auditActionSuggestion: ACCEPTED_AUDIT,
      persistenceStatus: persistResult.status,
      persisted: persistResult.persisted,
      persistence: persistResult,
    };
  }

  // Accepted, validate-only (default safe path): nothing is persisted.
  return {
    accepted: true,
    statusCodeSuggestion: 202,
    warnings,
    snapshot: ingest.snapshot,
    auditActionSuggestion: ACCEPTED_AUDIT,
    persistenceStatus: 'accepted_not_persisted',
    persisted: false,
  };
}
