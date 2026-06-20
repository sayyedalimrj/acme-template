/**
 * Production runtime config hardening (PR #57 Task 4).
 *
 * In a production build the app must NEVER silently fall back to mock data and must NEVER show
 * the wrong portal: a missing/invalid API base URL or a portal-mismatched config.json becomes a
 * blocking, visible Persian error. Non-production keeps the self-contained mock behavior.
 */
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import {
  BUILD_PORTAL,
  applyRemoteConfigForTests,
  getConfigError,
  isApiConfigured,
  resetRuntimeConfigForTests,
  setProductionRuntimeForTests,
} from '@/config/runtimeConfig';

// A portal that is guaranteed to differ from the build portal (merchant in tests).
const OTHER_PORTAL = BUILD_PORTAL === 'admin' ? 'affiliate' : 'admin';

beforeEach(() => {
  resetRuntimeConfigForTests();
});

afterEach(() => {
  setProductionRuntimeForTests(false);
  resetRuntimeConfigForTests();
});

describe('production runtime: blocking config errors', () => {
  beforeEach(() => setProductionRuntimeForTests(true));

  it('blocks (visible error) when the API base URL is missing — never silent mock', () => {
    const cfg = applyRemoteConfigForTests({ apiBaseUrl: '', portal: BUILD_PORTAL });
    expect(cfg.configError).toBeTruthy();
    expect(cfg.configError).toMatch(/config\.json/);
    expect(getConfigError()).toBe(cfg.configError);
  });

  it('blocks when the API base URL is not a valid http(s) URL', () => {
    const cfg = applyRemoteConfigForTests({ apiBaseUrl: 'not-a-url', portal: BUILD_PORTAL });
    expect(cfg.configError).toBeTruthy();
  });

  it('blocks when config.json declares a mismatched portal (wrong host)', () => {
    const cfg = applyRemoteConfigForTests({
      apiBaseUrl: 'https://api.jet-web.ir',
      portal: OTHER_PORTAL,
    });
    expect(cfg.configError).toBeTruthy();
    expect(cfg.portal).toBe(BUILD_PORTAL); // never switches to the wrong portal
  });

  it('blocks when config.json declares an invalid portal value', () => {
    const cfg = applyRemoteConfigForTests({
      apiBaseUrl: 'https://api.jet-web.ir',
      portal: 'bogus' as never,
    });
    expect(cfg.configError).toBeTruthy();
  });

  it('accepts a valid production config (real API + matching portal)', () => {
    const cfg = applyRemoteConfigForTests({
      apiBaseUrl: 'https://api.jet-web.ir',
      portal: BUILD_PORTAL,
    });
    expect(cfg.configError).toBeUndefined();
    expect(cfg.apiBaseUrl).toBe('https://api.jet-web.ir');
    expect(isApiConfigured()).toBe(true);
  });

  it('accepts a valid http (local-preview) API base URL', () => {
    const cfg = applyRemoteConfigForTests({
      apiBaseUrl: 'http://192.168.101.181',
      portal: BUILD_PORTAL,
    });
    expect(cfg.configError).toBeUndefined();
  });
});

describe('non-production runtime: mock is allowed (no blocking error)', () => {
  beforeEach(() => setProductionRuntimeForTests(false));

  it('keeps mock mode with an empty API base URL and no blocking error', () => {
    const cfg = applyRemoteConfigForTests({ apiBaseUrl: '', portal: BUILD_PORTAL });
    expect(cfg.configError).toBeUndefined();
    expect(isApiConfigured()).toBe(false);
  });

  it('surfaces a portal mismatch only as a non-blocking warning', () => {
    const cfg = applyRemoteConfigForTests({ apiBaseUrl: 'http://test', portal: OTHER_PORTAL });
    expect(cfg.configError).toBeUndefined();
    expect(cfg.configWarning).toMatch(/config\.json/);
    expect(cfg.portal).toBe(BUILD_PORTAL);
  });
});
