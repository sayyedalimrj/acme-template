/**
 * tokenStorage: web persistence round-trip (P0.3). On the web the session reference must survive
 * a reload via localStorage; clearing removes it.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
  };
});

describe('tokenStorage (web)', () => {
  it('persists and reloads tokens via web storage', () => {
    const a = require('@/services/tokenStorage');
    a.persistTokens({ token: 'acc-1', refreshToken: 'ref-1' });
    // loadTokens reads localStorage directly, so a fresh read returns the persisted values
    // (this is what lets authApi hydrate the session after a page reload).
    expect(a.loadTokens()).toEqual({ token: 'acc-1', refreshToken: 'ref-1' });
  });

  it('clears tokens', () => {
    const a = require('@/services/tokenStorage');
    a.persistTokens({ token: 'acc-1', refreshToken: 'ref-1' });
    a.clearStoredTokens();
    expect(a.loadTokens()).toEqual({ token: null, refreshToken: null });
  });
});
