/**
 * Plugin sync signature (backend skeleton).
 *
 * HMAC-SHA256 signing/verification over a canonical, NON-SECRET base string. The signing
 * material is ALWAYS injected by the caller (resolved from the future backend vault via a
 * `PluginSigningSecretProvider`); it is never hard-coded, stored, or committed. The crypto is
 * dependency-free (pure SHA-256/HMAC in `pluginCrypto`). The legacy
 * `verifyPluginSignaturePlaceholder` is retained for callers that have no signing material
 * (returns `not_configured`). See `security-model.md`.
 */
import { hmacSha256Hex, sha256Hex } from './pluginCrypto';
import type { PluginSignatureVerificationResult, PluginSyncEnvelope } from './pluginSyncEnvelope';

/** Algorithm label for the computed signatures. */
export const PLUGIN_SIGNATURE_ALGORITHM = 'hmac-sha256';

/**
 * Canonical input the signature covers. All fields are NON-SECRET; `bodyString` is the exact
 * serialized payload bytes the plugin signed. `signature` is only used by verification.
 */
export interface PluginSignatureInput {
  siteId: string;
  tenantId?: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  nonce: string;
  pluginVersion?: string;
  /** Exact serialized payload (e.g. the JSON body). */
  bodyString: string;
  /** Provided signature to verify (verification only). */
  signature?: string;
}

/**
 * Build the canonical, non-secret base string the signature covers. The body is reduced to a
 * SHA-256 hash so the base string never contains payload PII and is safe to log.
 */
export function buildSignatureBaseString(input: PluginSignatureInput): string {
  return [
    input.siteId,
    input.tenantId ?? '',
    input.timestamp,
    input.nonce,
    input.pluginVersion ?? '',
    sha256Hex(input.bodyString ?? ''),
  ].join('\n');
}

/** Compute the HMAC-SHA256 signature (hex) over the canonical base string. */
export function signPluginSyncPayload(
  input: PluginSignatureInput,
  signingMaterial: string,
): string {
  return hmacSha256Hex(signingMaterial, buildSignatureBaseString(input));
}

/** Constant-time-ish comparison of two hex signatures (length-safe). */
export function safeCompareSignatures(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Verify a provided signature against the recomputed HMAC using injected signing material. */
export function verifyPluginSyncSignature(
  input: PluginSignatureInput,
  signingMaterial: string,
): PluginSignatureVerificationResult {
  if (!input.signature) {
    return {
      verified: false,
      status: 'invalid',
      algorithm: PLUGIN_SIGNATURE_ALGORITHM,
      reason: 'No signature provided.',
    };
  }
  if (!signingMaterial) {
    return {
      verified: false,
      status: 'not_configured',
      algorithm: PLUGIN_SIGNATURE_ALGORITHM,
      reason: 'No signing material was provided.',
    };
  }
  const expected = signPluginSyncPayload(input, signingMaterial);
  const verified = safeCompareSignatures(input.signature, expected);
  return {
    verified,
    status: verified ? 'valid' : 'invalid',
    algorithm: PLUGIN_SIGNATURE_ALGORITHM,
    reason: verified ? undefined : 'Signature does not match.',
  };
}

/**
 * Legacy placeholder verification for an envelope with NO injected signing material. ALWAYS
 * returns `not_configured` / `verified: false`. Never reads or echoes any signature value.
 *
 * @param _envelope Sync envelope (unused; verification is not configured).
 */
export function verifyPluginSignaturePlaceholder(
  _envelope: PluginSyncEnvelope,
): PluginSignatureVerificationResult {
  return {
    verified: false,
    status: 'not_configured',
    algorithm: 'none',
    reason: 'Plugin signature verification is not configured (no signing material injected).',
  };
}
