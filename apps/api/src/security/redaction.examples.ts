/**
 * Dependency-free example checks (backend skeleton).
 *
 * This file stands in for unit tests: there is NO test framework in `apps/api` (adding one
 * would require dependencies, which is out of scope). Each check is a pure assertion that
 * returns a `{ name, passed }` result, so it can be inspected, rendered in docs, or run by a
 * future test runner without changes.
 *
 * All inputs are obviously-fake placeholders — NO real secrets, and nothing that resembles a
 * real token. These examples demonstrate that the security helpers behave as required.
 */
import {
  createNotImplementedWebhookReceiver,
  verifyWebhookSignaturePlaceholder,
} from '../adapters/webhookReceiver';
import { assertNoRawSecretFields, buildCredentialMetadata } from './credentialPolicy';
import { createSafeError } from './errors';
import { containsSensitiveText, redactSensitiveText } from './redaction';

export interface ExampleResult {
  name: string;
  passed: boolean;
  /** Safe, non-secret note describing what was observed. */
  note: string;
}

/** Run every example check and collect results (pure; no secrets involved). */
export function collectRedactionExampleResults(): ExampleResult[] {
  const results: ExampleResult[] = [];

  // 1. assertNoRawSecretFields rejects raw credential field names.
  {
    const rejected = assertNoRawSecretFields({ consumerSecret: 'placeholder-value' });
    const clean = assertNoRawSecretFields({ siteId: 'site_demo_1', kind: 'woocommerce_rest_key' });
    const passed = !rejected.ok && rejected.error.code === 'raw_secret_rejected' && clean.ok;
    results.push({
      name: 'assertNoRawSecretFields rejects raw secret fields',
      passed,
      note: 'A "consumerSecret" field is rejected; metadata-only input passes.',
    });
  }

  // 2. redactSensitiveText redacts known patterns (and never echoes the raw value).
  {
    const samples = [
      'Authorization: Bearer EXAMPLE',
      'consumer_secret=EXAMPLE',
      'api_key: EXAMPLE',
      'ck_EXAMPLE',
    ];
    const redactedAll = samples.every((s) => {
      const redacted = redactSensitiveText(s);
      return (
        containsSensitiveText(s) && redacted.includes('[REDACTED]') && !redacted.includes('EXAMPLE')
      );
    });
    results.push({
      name: 'redactSensitiveText redacts known patterns',
      passed: redactedAll,
      note: 'Bearer tokens, key/secret assignments, and ck_/cs_ prefixes are redacted.',
    });
  }

  // 3. buildCredentialMetadata builds metadata only — no raw secret values.
  {
    const built = buildCredentialMetadata({
      tenantId: 'tenant_demo_1',
      siteId: 'site_demo_1',
      kind: 'woocommerce_rest_key',
      permissionScope: ['read_products', 'read_orders'],
      notes: 'Connected via mock flow',
      now: '2026-06-16T08:00:00.000Z',
    });
    const serialized = built.ok ? JSON.stringify(built.data).toLowerCase() : '';
    const noSecretFields =
      built.ok &&
      !('secret' in built.data) &&
      !serialized.includes('consumersecret') &&
      !serialized.includes('tokenvalue') &&
      !serialized.includes('"password"');
    results.push({
      name: 'buildCredentialMetadata excludes raw secret values',
      passed: Boolean(noSecretFields),
      note: 'Result contains only metadata fields (id, kind, status, maskedLabel, scope).',
    });
  }

  // 4. buildCredentialMetadata rejects inputs carrying raw secret fields.
  {
    const built = buildCredentialMetadata({
      tenantId: 'tenant_demo_1',
      siteId: 'site_demo_1',
      kind: 'woocommerce_rest_key',
      permissionScope: ['read_products'],
      // Intentionally illegal raw field to prove rejection (value is a placeholder).
      consumerSecret: 'placeholder-value',
    } as never);
    results.push({
      name: 'buildCredentialMetadata rejects raw secret input',
      passed: !built.ok && built.error.code === 'raw_secret_rejected',
      note: 'A raw "consumerSecret" field causes a safe raw_secret_rejected error.',
    });
  }

  // 5. createSafeError redacts details and never exposes secret-named fields or stacks.
  {
    const err = createSafeError('internal_error', 'Authorization: Bearer EXAMPLE', {
      token: 'placeholder-value',
      note: 'safe-note',
      attempts: 2,
    });
    const details = err.details ?? {};
    const passed =
      !('stack' in err) &&
      err.message.includes('[REDACTED]') &&
      !('token' in details) &&
      details.note === 'safe-note' &&
      details.attempts === 2;
    results.push({
      name: 'createSafeError redacts message + details',
      passed,
      note: 'Secret-named detail dropped, message redacted, safe fields kept, no stack.',
    });
  }

  // 6. Webhook signature verification placeholder reports not_configured.
  {
    const receiver = createNotImplementedWebhookReceiver();
    const verification = verifyWebhookSignaturePlaceholder();
    const passed =
      typeof receiver.receive === 'function' &&
      verification.verified === false &&
      verification.status === 'not_configured';
    results.push({
      name: 'webhook signature verification is not configured',
      passed,
      note: 'verifyWebhookSignaturePlaceholder always returns not_configured / false.',
    });
  }

  return results;
}

/** Eagerly computed results (pure) — handy for docs and a future test runner. */
export const REDACTION_EXAMPLE_RESULTS: ExampleResult[] = collectRedactionExampleResults();

/** True only if every example check passes. */
export const ALL_REDACTION_EXAMPLES_PASS: boolean = REDACTION_EXAMPLE_RESULTS.every(
  (r) => r.passed,
);
