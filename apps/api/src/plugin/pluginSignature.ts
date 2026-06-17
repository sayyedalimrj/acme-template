/**
 * Plugin signature placeholder (backend skeleton).
 *
 * Builds a deterministic, NON-SECRET base string from a sync envelope and "verifies" it — but
 * there is NO real secret and NO real cryptography. Verification always returns
 * `not_configured`. Real HMAC (shared secret in the backend vault) or asymmetric signature
 * verification arrives in a later, security-reviewed phase. No secret is ever read, stored, or
 * committed. See `security-model.md`.
 */
import type { PluginSignatureVerificationResult, PluginSyncEnvelope } from './pluginSyncEnvelope';

/**
 * Build the canonical, non-secret base string a future signature would cover. Uses only
 * non-secret envelope identity fields; never includes payload PII or any secret.
 *
 * @param envelope Sync envelope.
 * @returns A deterministic base string (safe to log).
 */
export function buildSignatureBaseString(envelope: PluginSyncEnvelope): string {
  const source = envelope?.source;
  return [
    envelope?.schemaVersion ?? '',
    envelope?.generatedAt ?? '',
    source?.plugin ?? '',
    source?.pluginVersion ?? '',
    source?.siteUrl ?? '',
  ].join('|');
}

/**
 * Placeholder verification. ALWAYS returns `not_configured` / `verified: false` — no signing
 * secret exists in the skeleton and no real verification is performed. Never reads or echoes
 * any signature value.
 *
 * @param _envelope Sync envelope (unused; signature verification is not configured).
 */
export function verifyPluginSignaturePlaceholder(
  _envelope: PluginSyncEnvelope,
): PluginSignatureVerificationResult {
  return {
    verified: false,
    status: 'not_configured',
    algorithm: 'none',
    reason: 'Plugin signature verification is not configured in the backend skeleton.',
  };
}
