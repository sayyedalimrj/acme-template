import { formatTemplate } from '@/i18n/I18nProvider';

function flattenPages<T>(pages: { items: T[] }[]): T[] {
  return pages.flatMap((p) => p.items);
}

describe('pagination helpers', () => {
  it('flattenPages accumulates items without replacing prior pages', () => {
    const merged = flattenPages([
      { items: [{ id: 'a' }, { id: 'b' }] },
      { items: [{ id: 'c' }] },
    ]);
    expect(merged.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  });

  it('formatTemplate interpolates pagination copy', () => {
    expect(formatTemplate('{shown} / {total}', { shown: '20', total: '45' })).toBe('20 / 45');
  });
});
