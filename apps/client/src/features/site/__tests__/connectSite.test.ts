import { beforeEach, describe, expect, it } from '@jest/globals';

import { resetAdaptersForTests } from '@/adapters';
import { siteService } from '@/services';

beforeEach(() => {
  resetAdaptersForTests();
});

describe('connect site (mock)', () => {
  it('connects a store using only name + URL (no credential fields)', async () => {
    const before = (await siteService.listSites()).length;
    const site = await siteService.connectMockSite({
      name: 'My Store',
      url: 'https://my-store.example.test',
    });

    expect(site.name).toBe('My Store');
    expect(site.url).toBe('https://my-store.example.test');
    expect(site.status).toBe('connected');

    // The returned connection must not carry any secret/credential fields.
    const keys = Object.keys(site);
    ['consumerKey', 'consumerSecret', 'applicationPassword', 'password', 'apiKey'].forEach((k) => {
      expect(keys).not.toContain(k);
    });

    expect((await siteService.listSites()).length).toBe(before + 1);
  });

  it('allows selecting the active site', async () => {
    const switched = await siteService.setActiveSite('site_atelier');
    expect(switched.id).toBe('site_atelier');
    expect((await siteService.getActiveSite())?.id).toBe('site_atelier');
  });

  it('disconnects a store from mock state', async () => {
    const created = await siteService.connectMockSite({
      name: 'Temp',
      url: 'https://temp.example.test',
    });
    const afterConnect = (await siteService.listSites()).length;

    await siteService.disconnectMockSite(created.id);
    expect((await siteService.listSites()).length).toBe(afterConnect - 1);
  });
});
