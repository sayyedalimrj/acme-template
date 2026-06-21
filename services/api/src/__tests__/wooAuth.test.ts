/**
 * WooCommerce auth strategy + error mapping (PR60 regression hardening).
 *
 * The central Woo request builder must, over HTTPS, try QUERY-STRING auth first (robust against
 * hosts that drop the Authorization header) and fall back to Basic auth on 401/403. Errors map to
 * SPECIFIC codes (never a generic timeout): woo_auth_failed (401), woo_forbidden (403),
 * woo_timeout (abort), woo_network_error (connection). Secrets are redacted from thrown errors and
 * full query-auth URLs are never logged.
 *
 * `../util/ssrf` is mocked so no real network/DNS is touched; `safeFetch` is driven per scenario.
 */
const mockSafeFetch = jest.fn();
jest.mock('../util/ssrf', () => ({
  assertSafeOutboundUrl: jest.fn().mockResolvedValue(undefined),
  normalizeAndValidateStoreUrl: jest.fn(async (u: string) => u),
  safeFetch: (...args: unknown[]) => mockSafeFetch(...args),
}));

import { verifyWooCredentials, type WooCredentials } from '../services/woocommerce/wooClient';

const CREDS: WooCredentials = {
  storeUrl: 'https://shop.example',
  consumerKey: 'ck_LIVEKEY1234567890',
  consumerSecret: 'cs_SUPERSECRETVALUE0987654321',
};

interface FakeResponse {
  status: number;
  ok: boolean;
  headers: { get: (h: string) => string | null };
  json: () => Promise<unknown>;
}

function resp(status: number, body: unknown = [], total = '1'): FakeResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: (h: string) => (h.toLowerCase() === 'x-wp-total' ? total : null) },
    json: async () => body,
  };
}

function abortError(): Error {
  const e = new Error('The operation was aborted');
  e.name = 'AbortError';
  return e;
}

const usesQueryAuth = (url: string): boolean => url.includes('consumer_secret=');

beforeEach(() => {
  mockSafeFetch.mockReset();
});

describe('Woo auth strategy', () => {
  it('succeeds with query-string auth on the first try (HTTPS default)', async () => {
    mockSafeFetch.mockImplementation(async (url: string) => {
      // Every endpoint (products / currencies / system_status) answers 200 over query auth.
      expect(usesQueryAuth(url)).toBe(true);
      if (url.includes('currencies')) return resp(200, { code: 'IRT' });
      if (url.includes('system_status')) return resp(200, { environment: { version: '9.0' } });
      return resp(200, []);
    });
    const res = await verifyWooCredentials(CREDS);
    expect(res.ok).toBe(true);
    expect(res.currency).toBe('IRT');
  });

  it('falls back to Basic auth when query auth is rejected (401)', async () => {
    mockSafeFetch.mockImplementation(async (url: string, init: { headers?: Record<string, string> }) => {
      if (url.includes('/products')) {
        if (usesQueryAuth(url)) return resp(401, { code: 'woocommerce_rest_cannot_view' });
        // Basic-auth attempt carries an Authorization header and succeeds.
        expect(init.headers?.Authorization).toMatch(/^Basic /);
        return resp(200, []);
      }
      return resp(200, url.includes('currencies') ? { code: 'IRT' } : {});
    });
    const res = await verifyWooCredentials(CREDS);
    expect(res.ok).toBe(true);
  });

  it('maps a 401 from both strategies to woo_auth_failed', async () => {
    mockSafeFetch.mockResolvedValue(resp(401, { code: 'woocommerce_rest_cannot_view' }));
    await expect(verifyWooCredentials(CREDS)).rejects.toMatchObject({ code: 'woo_auth_failed' });
  });

  it('maps a 403 from both strategies to woo_forbidden', async () => {
    mockSafeFetch.mockResolvedValue(resp(403, { code: 'woocommerce_rest_authentication_error' }));
    await expect(verifyWooCredentials(CREDS)).rejects.toMatchObject({ code: 'woo_forbidden' });
  });

  it('maps an abort/timeout to woo_timeout (no fallback, no generic message)', async () => {
    mockSafeFetch.mockRejectedValue(abortError());
    await expect(verifyWooCredentials(CREDS)).rejects.toMatchObject({ code: 'woo_timeout' });
  });

  it('maps a connection failure to woo_network_error', async () => {
    mockSafeFetch.mockRejectedValue(new Error('fetch failed'));
    await expect(verifyWooCredentials(CREDS)).rejects.toMatchObject({ code: 'woo_network_error' });
  });
});

describe('Woo secret redaction', () => {
  it('redacts the consumer secret from a thrown error message', async () => {
    mockSafeFetch.mockRejectedValue(
      new Error(`upstream boom https://shop.example/wp-json/wc/v3/products?consumer_secret=${CREDS.consumerSecret}`),
    );
    try {
      await verifyWooCredentials(CREDS);
      throw new Error('expected rejection');
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).not.toContain(CREDS.consumerSecret);
      expect(msg).not.toContain(CREDS.consumerKey);
    }
  });

  it('never logs a full query-auth URL containing the secret', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockSafeFetch.mockResolvedValue(resp(401, {}));
    await expect(verifyWooCredentials(CREDS)).rejects.toBeTruthy();
    for (const spy of [logSpy, errSpy, warnSpy]) {
      for (const call of spy.mock.calls) {
        expect(JSON.stringify(call)).not.toContain(CREDS.consumerSecret);
      }
    }
    logSpy.mockRestore();
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
