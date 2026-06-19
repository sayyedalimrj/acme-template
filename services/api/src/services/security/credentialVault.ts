/**
 * Credential vault — authenticated encryption (AES-256-GCM) for secrets at rest.
 *
 * Used to store WooCommerce REST consumer key/secret and plugin signing secrets. The master key
 * comes ONLY from the backend environment (`CREDENTIAL_ENCRYPTION_KEY`) — never the DB, never
 * git, never the frontend. We persist only the envelope: { keyVersion, iv, authTag, ciphertext }.
 * Plaintext is returned solely to server-side callers that need to use the secret (e.g. the
 * WooCommerce client) and is NEVER returned to API responses.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

import { env, isProduction } from '../../env';

export interface SealedSecret {
  keyVersion: number;
  iv: string; // base64
  authTag: string; // base64
  ciphertext: string; // base64
}

const ALGO = 'aes-256-gcm';

/**
 * Resolve the 32-byte master key. Accepts hex (64 chars) or base64. In dev, if unset, derive a
 * deterministic key from JWT_SECRET so the app runs without extra setup (warned once).
 */
let warned = false;
function masterKey(): Buffer {
  const raw = env.CREDENTIAL_ENCRYPTION_KEY;
  if (raw) {
    // hex?
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
    const b64 = Buffer.from(raw, 'base64');
    if (b64.length === 32) return b64;
    throw new Error('CREDENTIAL_ENCRYPTION_KEY must be 32 bytes (hex 64 chars or base64).');
  }
  if (isProduction) {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY is required in production.');
  }
  if (!warned) {
    // eslint-disable-next-line no-console
    console.warn('[vault] CREDENTIAL_ENCRYPTION_KEY unset — deriving a dev key from JWT_SECRET.');
    warned = true;
  }
  return createHash('sha256').update(`vault-dev:${env.JWT_SECRET}`).digest();
}

/** Encrypt a JSON-serializable secret into a sealed envelope. */
export function sealSecret(secret: unknown): SealedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, masterKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(secret), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    keyVersion: env.CREDENTIAL_KEY_VERSION,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

/** Decrypt a sealed envelope back to its original value. Throws on tampering (GCM auth fail). */
export function openSecret<T = unknown>(sealed: SealedSecret): T {
  const decipher = createDecipheriv(ALGO, masterKey(), Buffer.from(sealed.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(sealed.authTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}
