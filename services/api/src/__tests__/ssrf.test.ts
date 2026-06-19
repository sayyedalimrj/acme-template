import { isBlockedIp, normalizeAndValidateStoreUrl } from '../util/ssrf';

describe('SSRF IP blocking', () => {
  it('blocks loopback, private, link-local, and metadata ranges', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true);
    expect(isBlockedIp('10.0.0.5')).toBe(true);
    expect(isBlockedIp('192.168.1.1')).toBe(true);
    expect(isBlockedIp('172.16.0.1')).toBe(true);
    expect(isBlockedIp('169.254.169.254')).toBe(true);
    expect(isBlockedIp('0.0.0.0')).toBe(true);
    expect(isBlockedIp('::1')).toBe(true);
    expect(isBlockedIp('fc00::1')).toBe(true);
    expect(isBlockedIp('fe80::1')).toBe(true);
  });

  it('allows public IPs', () => {
    expect(isBlockedIp('8.8.8.8')).toBe(false);
    expect(isBlockedIp('1.1.1.1')).toBe(false);
  });
});

describe('normalizeAndValidateStoreUrl', () => {
  it('rejects localhost and private literal IPs', async () => {
    await expect(normalizeAndValidateStoreUrl('http://127.0.0.1')).rejects.toMatchObject({
      code: 'unsafe_store_url',
    });
    await expect(normalizeAndValidateStoreUrl('https://192.168.0.1')).rejects.toMatchObject({
      code: 'unsafe_store_url',
    });
    await expect(normalizeAndValidateStoreUrl('localhost')).rejects.toMatchObject({
      code: 'unsafe_store_url',
    });
  });

  it('rejects non-http schemes and embedded credentials', async () => {
    await expect(normalizeAndValidateStoreUrl('ftp://shop.example')).rejects.toMatchObject({
      code: 'unsafe_store_url',
    });
    await expect(normalizeAndValidateStoreUrl('https://user:pass@shop.example')).rejects.toMatchObject({
      code: 'unsafe_store_url',
    });
  });

  it('prepends https and trims trailing slash for public hosts', async () => {
    const url = await normalizeAndValidateStoreUrl('woocommerce.com/');
    expect(url).toBe('https://woocommerce.com');
  });
});
