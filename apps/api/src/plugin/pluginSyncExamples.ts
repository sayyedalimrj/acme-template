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
import { verifyPluginSignaturePlaceholder } from './pluginSignature';
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

/** True only if every example check passes. */
export const ALL_PLUGIN_SYNC_EXAMPLES_PASS: boolean = PLUGIN_SYNC_EXAMPLE_RESULTS.every(
  (r) => r.passed,
);
