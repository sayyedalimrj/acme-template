import { beforeEach, describe, expect, it } from '@jest/globals';

import {
  BUILD_PORTAL,
  applyRemoteConfigForTests,
  canonicalizePortal,
  getRuntimeConfig,
  resetRuntimeConfigForTests,
} from '@/config/runtimeConfig';
import { getActivePortal } from '@/config/portal.config';
import { allowedPortalsForRole, roleCanUsePortal } from '@/config/portalAccess';

describe('runtimeConfig portal isolation', () => {
  beforeEach(() => {
    resetRuntimeConfigForTests();
  });

  it('defaults to build-time portal when config.json is absent', () => {
    expect(getRuntimeConfig().portal).toBe(BUILD_PORTAL);
    expect(getActivePortal()).toBe(BUILD_PORTAL);
  });

  it('ignores mismatched config.json portal with a warning', () => {
    const cfg = applyRemoteConfigForTests({ apiBaseUrl: 'http://test', portal: 'admin' });
    if (BUILD_PORTAL === 'admin') {
      expect(cfg.portal).toBe('admin');
      return;
    }
    expect(cfg.portal).toBe(BUILD_PORTAL);
    expect(cfg.configWarning).toMatch(/config\.json/);
  });

  it('canonicalizes partner → affiliate', () => {
    expect(canonicalizePortal('partner')).toBe('affiliate');
    expect(canonicalizePortal('bogus')).toBeNull();
  });
});

describe('portalAccess client mirror', () => {
  it('merchant cannot use admin portal', () => {
    expect(roleCanUsePortal('merchant_owner', 'admin')).toBe(false);
    expect(allowedPortalsForRole('merchant_owner')).toEqual(['merchant']);
  });

  it('affiliate cannot use merchant portal', () => {
    expect(roleCanUsePortal('affiliate', 'merchant')).toBe(false);
  });

  it('platform_admin may use all portals', () => {
    expect(roleCanUsePortal('platform_admin', 'merchant')).toBe(true);
    expect(roleCanUsePortal('platform_admin', 'admin')).toBe(true);
    expect(roleCanUsePortal('platform_admin', 'affiliate')).toBe(true);
  });
});
