/**
 * Dependency-free example checks for the plugin sync foundation (backend skeleton).
 *
 * Stands in for unit tests (no test framework in `apps/api`). Each check is a pure assertion
 * returning `{ name, passed, note }`. All inputs come from the safe fixtures (no real PII, no
 * secrets, reserved example domain only). Demonstrates that validators/ingestor/signature
 * behave as required.
 */
import {
  disconnectPluginConnectionPlaceholder,
  getPluginConnectionStatus,
  registerPluginConnectionPlaceholder,
  resetPluginConnectionRegistry,
} from './pluginConnectionRegistry';
import { ingestPluginEventBatch } from './pluginEventIngestor';
import { hmacSha256Hex, sha256Hex } from './pluginCrypto';
import { handlePluginSyncDelivery } from './pluginDeliveryEndpoint';
import type { PluginDeliveryHandlerContext } from './pluginDeliveryResponse';
import type { PluginDeliveryRequest } from './pluginDeliveryRequest';
import { createInMemoryReplayGuard } from './pluginReplayGuard';
import { signPluginSyncPayload, verifyPluginSignaturePlaceholder } from './pluginSignature';
import {
  notConfiguredSigningSecretProvider,
  type PluginSigningSecretProvider,
} from './pluginSigningSecret';
import type { PluginSyncEnvelope } from './pluginSyncEnvelope';
import {
  buildSyncEnvelopeWithOversizeProducts,
  buildSyncEnvelopeWithRawEmail,
  buildSyncEnvelopeWithRawPhone,
  buildSyncEnvelopeWithSecret,
  buildValidEventBatch,
  buildValidSyncEnvelope,
} from './pluginSyncFixtures';
import { ingestPluginSyncEnvelope } from './pluginSyncIngestor';
import { validatePluginSyncEnvelope } from './pluginSyncValidator';
import { createInMemoryPluginSyncRepository } from './pluginSyncRepository';
import { persistPluginEventBatch, persistValidatedPluginSync } from './pluginSyncPersistence';

export interface ExampleResult {
  name: string;
  passed: boolean;
  note: string;
}

/** Run every example check and collect results (pure; no secrets/PII involved). */
export function collectPluginSyncExampleResults(): ExampleResult[] {
  const results: ExampleResult[] = [];

  // 1. Valid envelope passes validation.
  {
    const validation = validatePluginSyncEnvelope(buildValidSyncEnvelope());
    results.push({
      name: 'valid sync envelope passes',
      passed: validation.valid && validation.errors.length === 0,
      note: 'A safe, summary-only envelope validates with no errors.',
    });
  }

  // 2. Raw email is rejected.
  {
    const validation = validatePluginSyncEnvelope(buildSyncEnvelopeWithRawEmail());
    results.push({
      name: 'raw email fails',
      passed: !validation.valid && validation.errors.some((e) => e.code.startsWith('raw_pii')),
      note: 'An email-shaped value is rejected as raw PII.',
    });
  }

  // 3. Raw phone is rejected.
  {
    const validation = validatePluginSyncEnvelope(buildSyncEnvelopeWithRawPhone());
    results.push({
      name: 'raw phone fails',
      passed: !validation.valid && validation.errors.some((e) => e.code.startsWith('raw_pii')),
      note: 'A PII phone field is rejected.',
    });
  }

  // 4. Secret-looking field is rejected.
  {
    const validation = validatePluginSyncEnvelope(buildSyncEnvelopeWithSecret());
    results.push({
      name: 'secret-looking key fails',
      passed: !validation.valid && validation.errors.some((e) => e.code === 'raw_secret_field'),
      note: 'A "consumerSecret" field is rejected as a raw secret.',
    });
  }

  // 5. Oversize resource list is flagged.
  {
    const validation = validatePluginSyncEnvelope(buildSyncEnvelopeWithOversizeProducts());
    results.push({
      name: 'oversize resource list fails',
      passed:
        !validation.valid && validation.errors.some((e) => e.code === 'resource_list_oversize'),
      note: 'A products array beyond the cap is rejected.',
    });
  }

  // 6. Signature placeholder reports not_configured.
  {
    const verification = verifyPluginSignaturePlaceholder(buildValidSyncEnvelope());
    results.push({
      name: 'signature placeholder returns not_configured',
      passed: verification.verified === false && verification.status === 'not_configured',
      note: 'verifyPluginSignaturePlaceholder always returns not_configured / false.',
    });
  }

  // 7. Ingestion returns a normalized in-memory snapshot.
  {
    const result = ingestPluginSyncEnvelope(buildValidSyncEnvelope());
    const snapshot = result.snapshot;
    const passed =
      result.accepted &&
      !!snapshot &&
      snapshot.counts.products === 2 &&
      snapshot.counts.orders === 1 &&
      snapshot.counts.customers === 1;
    results.push({
      name: 'ingestion returns normalized snapshot',
      passed,
      note: 'A valid envelope ingests to an in-memory snapshot with expected counts.',
    });
  }

  // 8. Event batch ingestion accepts safe events and rejects a secret-bearing one.
  {
    const ok = ingestPluginEventBatch(buildValidEventBatch());
    const bad = ingestPluginEventBatch([
      { event_type: 'order.created', consumerSecret: 'placeholder-value' },
    ]);
    results.push({
      name: 'event batch validation',
      passed: ok.accepted && ok.count === 2 && !bad.accepted,
      note: 'Safe events are accepted; a secret-bearing event is rejected.',
    });
  }

  // 9. Connection registry holds metadata only and rejects secret-bearing input.
  {
    resetPluginConnectionRegistry();
    const okReg = registerPluginConnectionPlaceholder({
      siteId: 'site_local_demo',
      tenantId: 'tenant_local_demo',
      pluginVersion: '0.3.0',
      siteUrl: 'https://example-store.test',
      connectionStatus: 'local_ready',
      deliveryStatus: 'local_preview_only',
      capabilities: ['read_products', 'read_orders'],
    });
    const status = getPluginConnectionStatus('site_local_demo');
    const badReg = registerPluginConnectionPlaceholder({
      siteId: 'site_x',
      pluginVersion: '0.3.0',
      siteUrl: 'https://example-store.test',
      connectionStatus: 'local_ready',
      // Illegal raw secret field (benign placeholder value).
      consumerSecret: 'placeholder-value',
    } as never);
    const disc = disconnectPluginConnectionPlaceholder('site_local_demo');
    resetPluginConnectionRegistry();
    results.push({
      name: 'connection registry metadata-only',
      passed: okReg.ok && status.ok && !badReg.ok && disc.ok,
      note: 'Registers metadata, reads it back, rejects raw secrets, and disconnects.',
    });
  }

  return results;
}

/** Eagerly computed results (pure) — handy for docs and a future test runner. */
export const PLUGIN_SYNC_EXAMPLE_RESULTS: ExampleResult[] = collectPluginSyncExampleResults();

// ---------------------------------------------------------------------------
// Signed delivery example checks (signature + replay + handler).
// ---------------------------------------------------------------------------

/** Obviously test-only, non-production, non-token-like signing material. */
const TEST_SIGNING_MATERIAL = 'dev-only-signing-material-not-production';
const BASE_NOW = Date.parse('2026-06-17T08:00:00.000Z');

const testSigningProvider: PluginSigningSecretProvider = (siteId) => ({
  metadata: { siteId, status: 'configured_in_backend_later' },
  material: TEST_SIGNING_MATERIAL,
});

interface SignedRequestOverrides {
  timestamp?: string;
  nonce?: string;
  signature?: string;
  omitSignature?: boolean;
}

function buildSignedRequest(
  envelope: PluginSyncEnvelope,
  material: string,
  overrides: SignedRequestOverrides = {},
): PluginDeliveryRequest {
  const bodyString = JSON.stringify(envelope);
  const timestamp = overrides.timestamp ?? new Date(BASE_NOW).toISOString();
  const nonce = overrides.nonce ?? 'nonce-abc-123';
  const siteId = envelope.payload.connection?.siteId ?? 'site_local_demo';
  const tenantId = envelope.payload.connection?.tenantId;
  const pluginVersion = envelope.source.pluginVersion;
  const signature =
    overrides.signature ??
    signPluginSyncPayload(
      { siteId, tenantId, timestamp, nonce, pluginVersion, bodyString },
      material,
    );
  const headers: PluginDeliveryRequest['headers'] = {
    'x-wcos-site-id': siteId,
    'x-wcos-tenant-id': tenantId,
    'x-wcos-timestamp': timestamp,
    'x-wcos-nonce': nonce,
    'x-wcos-plugin-version': pluginVersion,
  };
  if (!overrides.omitSignature) {
    headers['x-wcos-signature'] = signature;
  }
  return { headers, body: { envelope }, rawBody: bodyString };
}

function freshContext(provider: PluginSigningSecretProvider): PluginDeliveryHandlerContext {
  return {
    security: {
      signatureProvider: provider,
      replayGuard: createInMemoryReplayGuard(),
      now: BASE_NOW,
      maxSkewSeconds: 300,
    },
  };
}

/** Run signed-delivery example checks. */
export function collectSignedDeliveryExampleResults(): ExampleResult[] {
  const results: ExampleResult[] = [];

  // 0. Crypto known-answer test (proves the dependency-free HMAC is correct).
  {
    const sha = sha256Hex('abc');
    const mac = hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog');
    const passed =
      sha === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad' &&
      mac === 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8';
    results.push({
      name: 'crypto HMAC-SHA256 known-answer',
      passed,
      note: 'Pure SHA-256/HMAC matches published test vectors.',
    });
  }

  // 1. Valid signed delivery accepted.
  {
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'valid signed delivery accepted',
      passed: result.accepted && result.statusCodeSuggestion === 202 && !!result.snapshot,
      note: 'A correctly signed, fresh request is accepted with an in-memory snapshot.',
    });
  }

  // 2. Missing signature rejected.
  {
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL, {
      omitSignature: true,
    });
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'missing signature rejected',
      passed: !result.accepted && result.errorCode === 'missing_headers',
      note: 'A request without the signature header is rejected.',
    });
  }

  // 3. Invalid signature rejected.
  {
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL, {
      signature: 'deadbeef'.repeat(8),
    });
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'invalid signature rejected',
      passed: !result.accepted && result.errorCode === 'invalid_signature',
      note: 'A tampered signature fails verification.',
    });
  }

  // 4. Stale timestamp rejected.
  {
    const staleTs = new Date(BASE_NOW - 10 * 60 * 1000).toISOString();
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL, {
      timestamp: staleTs,
    });
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'stale timestamp rejected',
      passed: !result.accepted && result.errorCode === 'invalid_timestamp',
      note: 'A timestamp outside the skew window is rejected.',
    });
  }

  // 5. Replayed nonce rejected.
  {
    const ctx = freshContext(testSigningProvider);
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const first = handlePluginSyncDelivery(req, ctx);
    const second = handlePluginSyncDelivery(req, ctx);
    results.push({
      name: 'replayed nonce rejected',
      passed: first.accepted && !second.accepted && second.errorCode === 'replayed',
      note: 'The same signed request replayed against the same guard is rejected.',
    });
  }

  // 6. Raw PII payload rejected (signature valid, envelope invalid).
  {
    const env = buildSyncEnvelopeWithRawEmail();
    const req = buildSignedRequest(env, TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'raw PII payload rejected',
      passed: !result.accepted && result.errorCode === 'invalid_payload',
      note: 'A correctly signed but PII-bearing payload is rejected at validation.',
    });
  }

  // 7. Secret-looking payload rejected.
  {
    const req = buildSignedRequest(buildSyncEnvelopeWithSecret(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'secret-looking payload rejected',
      passed: !result.accepted && result.errorCode === 'invalid_payload',
      note: 'A correctly signed but secret-bearing payload is rejected at validation.',
    });
  }

  // 8. Oversized list rejected.
  {
    const req = buildSignedRequest(buildSyncEnvelopeWithOversizeProducts(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'oversized list rejected',
      passed: !result.accepted && result.errorCode === 'invalid_payload',
      note: 'A correctly signed but oversized payload is rejected at validation.',
    });
  }

  // 9. Signature provider not configured rejected safely.
  {
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(req, freshContext(notConfiguredSigningSecretProvider));
    results.push({
      name: 'signature provider not configured rejected',
      passed: !result.accepted && result.errorCode === 'signature_not_configured',
      note: 'When no signing material is configured, delivery is safely rejected.',
    });
  }

  return results;
}

/** Combined results across the read-only sync checks and the signed-delivery checks. */
export const SIGNED_DELIVERY_EXAMPLE_RESULTS: ExampleResult[] =
  collectSignedDeliveryExampleResults();

// ---------------------------------------------------------------------------
// Controlled DEV read-only sync persistence example checks (in-memory only).
// ---------------------------------------------------------------------------

/** Build a handler context wired for controlled dev persistence (in-memory repository). */
function persistContext(
  provider: PluginSigningSecretProvider,
  repository: ReturnType<typeof createInMemoryPluginSyncRepository>,
  mode: 'validate_only' | 'validate_and_persist_dev',
): PluginDeliveryHandlerContext {
  return {
    security: {
      signatureProvider: provider,
      replayGuard: createInMemoryReplayGuard(),
      now: BASE_NOW,
      maxSkewSeconds: 300,
    },
    persistence: { mode, repository, source: 'signed_delivery_dev' },
  };
}

/** Run controlled dev persistence example checks (all in-memory; nothing is stored to disk). */
export function collectDevPersistenceExampleResults(): ExampleResult[] {
  const results: ExampleResult[] = [];
  const siteId = 'site_local_demo';

  // 1. Valid signed delivery accepted WITHOUT persistence (no persistence context).
  {
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(req, freshContext(testSigningProvider));
    results.push({
      name: 'valid signed delivery accepted without persistence',
      passed:
        result.accepted &&
        result.persisted === false &&
        result.persistenceStatus === 'accepted_not_persisted',
      note: 'With no persistence context the handler validates but never persists.',
    });
  }

  // 2. Valid signed delivery persisted in dev mode + 3/4/5 repository reads.
  {
    const repository = createInMemoryPluginSyncRepository();
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(
      req,
      persistContext(testSigningProvider, repository, 'validate_and_persist_dev'),
    );
    const snapshot = repository.getSiteSnapshot(siteId);
    const runs = repository.listSyncRuns(siteId);
    const audit = repository.listAuditEntries(siteId);

    results.push({
      name: 'valid signed delivery persisted in dev mode',
      passed:
        result.accepted &&
        result.persisted === true &&
        result.persistenceStatus === 'accepted_persisted_dev',
      note: 'validate_and_persist_dev stores a normalized snapshot in the in-memory repo.',
    });
    results.push({
      name: 'repository returns site snapshot',
      passed:
        !!snapshot &&
        snapshot.siteId === siteId &&
        snapshot.counts.products === 2 &&
        snapshot.counts.orders === 1 &&
        snapshot.counts.customers === 1 &&
        snapshot.products.every((p) => !('email' in p)),
      note: 'getSiteSnapshot returns the normalized, summary-only snapshot.',
    });
    results.push({
      name: 'sync run recorded',
      passed: runs.length === 1 && runs[0].status === 'accepted_persisted_dev' && runs[0].persisted,
      note: 'A persisted sync run is recorded for the site.',
    });
    results.push({
      name: 'audit entry recorded',
      passed:
        audit.length === 1 &&
        audit[0].status === 'accepted_persisted_dev' &&
        audit[0].action === 'plugin.sync.persisted.dev',
      note: 'A summary-only audit entry is recorded for the persisted run.',
    });
  }

  // 6. validate_only mode never persists (even with a repository).
  {
    const repository = createInMemoryPluginSyncRepository();
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const result = handlePluginSyncDelivery(
      req,
      persistContext(testSigningProvider, repository, 'validate_only'),
    );
    results.push({
      name: 'validate_only mode never persists',
      passed:
        result.accepted &&
        result.persisted === false &&
        repository.listSiteSnapshots().length === 0 &&
        repository.listSyncRuns().length === 0,
      note: 'validate_only never writes to the repository, even when one is provided.',
    });
  }

  // 7. Raw PII rejected before persistence.
  {
    const repository = createInMemoryPluginSyncRepository();
    const result = persistValidatedPluginSync(buildSyncEnvelopeWithRawEmail(), {
      repository,
      mode: 'validate_and_persist_dev',
      now: BASE_NOW,
    });
    results.push({
      name: 'raw PII rejected before persistence',
      passed:
        result.persisted === false &&
        result.status === 'rejected_pii_detected' &&
        repository.listSiteSnapshots().length === 0,
      note: 'A PII-bearing envelope is rejected and nothing is stored.',
    });
  }

  // 8. Secret-looking payload rejected before persistence.
  {
    const repository = createInMemoryPluginSyncRepository();
    const result = persistValidatedPluginSync(buildSyncEnvelopeWithSecret(), {
      repository,
      mode: 'validate_and_persist_dev',
      now: BASE_NOW,
    });
    results.push({
      name: 'secret-looking payload rejected before persistence',
      passed:
        result.persisted === false &&
        result.status === 'rejected_secret_detected' &&
        repository.listSiteSnapshots().length === 0,
      note: 'A secret-bearing envelope is rejected and nothing is stored.',
    });
  }

  // 9. Invalid signature not persisted.
  {
    const repository = createInMemoryPluginSyncRepository();
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL, {
      signature: 'deadbeef'.repeat(8),
    });
    const result = handlePluginSyncDelivery(
      req,
      persistContext(testSigningProvider, repository, 'validate_and_persist_dev'),
    );
    results.push({
      name: 'invalid signature not persisted',
      passed:
        !result.accepted &&
        result.errorCode === 'invalid_signature' &&
        result.persistenceStatus === 'rejected_invalid_signature' &&
        repository.listSiteSnapshots().length === 0,
      note: 'A tampered signature is rejected and nothing is stored.',
    });
  }

  // 10. Replayed nonce not persisted twice.
  {
    const repository = createInMemoryPluginSyncRepository();
    const ctx = persistContext(testSigningProvider, repository, 'validate_and_persist_dev');
    const req = buildSignedRequest(buildValidSyncEnvelope(), TEST_SIGNING_MATERIAL);
    const first = handlePluginSyncDelivery(req, ctx);
    const second = handlePluginSyncDelivery(req, ctx);
    results.push({
      name: 'replayed nonce not persisted',
      passed:
        first.persisted === true &&
        !second.accepted &&
        second.persistenceStatus === 'rejected_replay' &&
        repository.listSyncRuns().length === 1,
      note: 'A replayed request is rejected; only the first delivery is persisted.',
    });
  }

  // 11. Event batch persisted in dev mode; secret event rejected.
  {
    const repository = createInMemoryPluginSyncRepository();
    const ok = persistPluginEventBatch(buildValidEventBatch(), {
      repository,
      mode: 'validate_and_persist_dev',
      siteId,
      now: BASE_NOW,
    });
    const bad = persistPluginEventBatch(
      [{ event_type: 'order.created', consumerSecret: 'placeholder-value' }],
      { repository, mode: 'validate_and_persist_dev', siteId, now: BASE_NOW },
    );
    results.push({
      name: 'event batch persistence',
      passed:
        ok.status === 'accepted_persisted_dev' &&
        ok.persisted &&
        bad.status === 'rejected_secret_detected' &&
        !bad.persisted &&
        repository.listSyncRuns(siteId).length === 1,
      note: 'A safe event batch persists a run; a secret-bearing batch is rejected.',
    });
  }

  return results;
}

/** Eagerly computed controlled-dev-persistence results. */
export const DEV_PERSISTENCE_EXAMPLE_RESULTS: ExampleResult[] =
  collectDevPersistenceExampleResults();

/** True only if every example check passes. */
export const ALL_PLUGIN_SYNC_EXAMPLES_PASS: boolean = [
  ...PLUGIN_SYNC_EXAMPLE_RESULTS,
  ...SIGNED_DELIVERY_EXAMPLE_RESULTS,
  ...DEV_PERSISTENCE_EXAMPLE_RESULTS,
].every((r) => r.passed);
