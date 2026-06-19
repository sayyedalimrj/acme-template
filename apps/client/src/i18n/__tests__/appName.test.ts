import { describe, expect, it } from '@jest/globals';

import { appConfig } from '@/config/app.config';
import { catalog, en } from '@/i18n/strings';

describe('app naming', () => {
  it('no longer brands the app with a platform/technical name', () => {
    expect(en['app.name']).toBe('Store Manager');
    expect(en['app.name']).not.toMatch(/WooCommerce/i);
    expect(en['app.name']).not.toMatch(/WordPress/i);
    expect(appConfig.appName).toBe('Store Manager');
    expect(appConfig.appName).not.toMatch(/WooCommerce/i);
    expect(appConfig.appName).not.toMatch(/WordPress/i);
  });

  it('uses a clean Persian store brand (no platform name)', () => {
    expect(catalog.fa['app.name']).toBe('مدیریت فروشگاه');
    expect(catalog.fa['app.name']).not.toMatch(/وردپرس/);
  });
});
