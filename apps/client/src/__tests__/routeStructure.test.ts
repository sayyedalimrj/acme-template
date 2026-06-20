/**
 * Regression guard for the PR #56 route fix.
 *
 * The merchant `(app)` group must own `/`, while admin and affiliate must be PATH segments
 * (`/admin`, `/affiliate`) — NOT Expo Router groups `(admin)`/`(affiliate)` that collide with
 * `/` and trap a merchant in an infinite `/access-denied` redirect loop. This test fails loudly
 * if anyone reintroduces the colliding group folders.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from '@jest/globals';

const appDir = resolve(__dirname, '..', '..', 'app');

describe('route structure (PR #56 regression guard)', () => {
  it('keeps admin and affiliate as path folders (not route groups)', () => {
    expect(existsSync(resolve(appDir, 'admin', '_layout.tsx'))).toBe(true);
    expect(existsSync(resolve(appDir, 'admin', 'index.tsx'))).toBe(true);
    expect(existsSync(resolve(appDir, 'affiliate', '_layout.tsx'))).toBe(true);
    expect(existsSync(resolve(appDir, 'affiliate', 'index.tsx'))).toBe(true);
  });

  it('never reintroduces the colliding (admin)/(affiliate) route groups', () => {
    expect(existsSync(resolve(appDir, '(admin)'))).toBe(false);
    expect(existsSync(resolve(appDir, '(affiliate)'))).toBe(false);
  });

  it('keeps the merchant (app) group owning the index route "/"', () => {
    expect(existsSync(resolve(appDir, '(app)', 'index.tsx'))).toBe(true);
    expect(existsSync(resolve(appDir, '(auth)', '_layout.tsx'))).toBe(true);
  });
});
