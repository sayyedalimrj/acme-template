/**
 * Plugin signed-sync verification (HMAC-SHA256).
 *
 * Matches the WordPress companion plugin's canonical base string exactly:
 *   site_id \n tenant_id \n timestamp \n nonce \n plugin_version \n sha256_hex(body)
 * where `body` is the EXACT raw request body bytes the plugin signed. The signing secret is
 * resolved from the credential vault per site and is never logged. Comparison is constant-time.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export interface SignatureInput {
  siteId: string;
  tenantId?: string;
  timestamp: string;
  nonce: string;
  pluginVersion?: string;
  /** Exact raw body string the plugin signed. */
  bodyString: string;
}

export function buildBaseString(input: SignatureInput): string {
  const bodyHash = createHash('sha256').update(input.bodyString ?? '', 'utf8').digest('hex');
  return [
    input.siteId,
    input.tenantId ?? '',
    input.timestamp,
    input.nonce,
    input.pluginVersion ?? '',
    bodyHash,
  ].join('\n');
}

export function computeSignature(input: SignatureInput, signingSecret: string): string {
  return createHmac('sha256', signingSecret).update(buildBaseString(input), 'utf8').digest('hex');
}

export function verifySignature(
  input: SignatureInput,
  signingSecret: string,
  provided: string,
): boolean {
  if (!provided || !signingSecret) return false;
  const expected = computeSignature(input, signingSecret);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
