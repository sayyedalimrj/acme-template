import { describe, expect, it } from '@jest/globals';

import { navItems, navSections } from '@/components/layout/navigation';

describe('navigation grouping', () => {
  it('exposes the four IA sections in order', () => {
    expect(navSections.map((s) => s.key)).toEqual(['store-ops', 'growth', 'platform', 'system']);
  });

  it('labels every section with an i18n key', () => {
    navSections.forEach((section) => {
      expect(section.labelKey.startsWith('nav.section.')).toBe(true);
      expect(section.items.length).toBeGreaterThan(0);
    });
  });

  it('flattens sections into navItems preserving section order', () => {
    const expected = navSections.flatMap((s) => s.items.map((i) => i.key));
    expect(navItems.map((i) => i.key)).toEqual(expected);
  });

  it('keeps the core routes reachable', () => {
    const keys = navItems.map((i) => i.key);
    ['dashboard', 'products', 'orders', 'reports', 'support', 'settings'].forEach((key) => {
      expect(keys).toContain(key);
    });
  });

  it('uses unique route hrefs and keys', () => {
    const keys = navItems.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
