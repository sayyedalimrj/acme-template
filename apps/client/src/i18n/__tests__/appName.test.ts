import { describe, expect, it } from '@jest/globals';

import { appConfig } from '@/config/app.config';
import { catalog, en } from '@/i18n/strings';

describe('app naming', () => {
  it('uses a neutral, non-technical brand name (no platform terms)', () => {
    expect(en['app.name']).toBe('Store Manager');
    expect(en['app.name']).not.toMatch(/WooCommerce/i);
    expect(en['app.name']).not.toMatch(/WordPress/i);
    expect(appConfig.appName).toBe('Store Manager');
    expect(appConfig.appName).not.toMatch(/WooCommerce/i);
    expect(appConfig.appName).not.toMatch(/WordPress/i);
  });

  it('uses a simple Persian store name for the app brand', () => {
    expect(catalog.fa['app.name']).toBe('مدیریت فروشگاه');
  });
});
