import { describe, expect, it } from '@jest/globals';

import { appConfig } from '@/config/app.config';
import { catalog, en } from '@/i18n/strings';

describe('app naming', () => {
  it('no longer brands the app as a WooCommerce dashboard', () => {
    expect(en['app.name']).toBe('WordPress Commerce OS');
    expect(en['app.name']).not.toMatch(/WooCommerce/i);
    expect(appConfig.appName).toBe('WordPress Commerce OS');
    expect(appConfig.appName).not.toMatch(/WooCommerce/i);
  });

  it('uses the Persian platform name for the app brand', () => {
    expect(catalog.fa['app.name']).toBe('پلتفرم مدیریت و رشد فروشگاه‌های وردپرسی');
  });
});
