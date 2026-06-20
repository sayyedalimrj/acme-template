import { openSecret, sealSecret } from '../services/security/credentialVault';
import { buildBaseString, computeSignature, verifySignature } from '../services/plugin/signature';
import { isTimestampFresh } from '../services/plugin/replayGuard';

describe('credential vault (AES-256-GCM)', () => {
  it('seals and opens a secret (round-trip)', () => {
    const secret = { consumerKey: 'ck_abc', consumerSecret: 'cs_xyz', storeUrl: 'https://s.example' };
    const sealed = sealSecret(secret);
    expect(sealed.iv).toBeTruthy();
    expect(sealed.authTag).toBeTruthy();
    expect(sealed.ciphertext).toBeTruthy();
    // ciphertext must not contain the plaintext secret
    expect(sealed.ciphertext).not.toContain('cs_xyz');
    expect(openSecret(sealed)).toEqual(secret);
  });

  it('fails to open a tampered ciphertext (GCM auth)', () => {
    const sealed = sealSecret({ a: 1 });
    const tampered = { ...sealed, ciphertext: Buffer.from('garbage').toString('base64') };
    expect(() => openSecret(tampered)).toThrow();
  });
});

describe('plugin signature (HMAC-SHA256)', () => {
  const input = {
    siteId: 'site-1',
    tenantId: 'tenant-1',
    timestamp: '2026-01-01T00:00:00.000Z',
    nonce: 'nonce-1',
    pluginVersion: '1.0.0',
    bodyString: '{"schemaVersion":"wcos.sync.v1"}',
  };

  it('verifies a correct signature and rejects a wrong one', () => {
    const sig = computeSignature(input, 'secret-key');
    expect(verifySignature(input, 'secret-key', sig)).toBe(true);
    expect(verifySignature(input, 'wrong-key', sig)).toBe(false);
    expect(verifySignature(input, 'secret-key', 'deadbeef')).toBe(false);
  });

  it('base string includes a hash of the body, not the raw body', () => {
    const base = buildBaseString(input);
    expect(base).toContain('site-1');
    expect(base).not.toContain('schemaVersion'); // body is hashed, not embedded
  });
});

describe('replay timestamp window', () => {
  it('accepts fresh and rejects stale timestamps', () => {
    expect(isTimestampFresh(new Date().toISOString())).toBe(true);
    expect(isTimestampFresh(new Date(Date.now() - 60 * 60 * 1000).toISOString())).toBe(false);
    expect(isTimestampFresh('not-a-date')).toBe(false);
  });
});
