/**
 * Store/site switching fully switches the data context (PR #57 Task 3).
 *
 * 1. Switching the active site REMOVES all site-scoped React Query cache (`['site', ...]`), so
 *    Store A's cached data can never be shown after switching to Store B.
 * 2. The data layer returns a different, stable per-store view, and re-selecting a store restores
 *    its own view (no cross-store contamination).
 */
import { beforeEach, describe, expect, it } from '@jest/globals';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { getAdapters, resetAdaptersForTests } from '@/adapters';
import { resetActiveMockSiteId } from '@/adapters/mock/mockActiveSite';
import { queryKeys, siteService } from '@/services';

import { useSetActiveSite } from '../useSiteMutations';

beforeEach(() => {
  resetAdaptersForTests();
  resetActiveMockSiteId();
});

function Switcher({ to }: { to: string }): React.JSX.Element {
  const m = useSetActiveSite();
  return (
    <Pressable testID="switch" onPress={() => m.mutate(to)}>
      <Text>switch</Text>
    </Pressable>
  );
}

describe('store switch clears site-scoped query cache', () => {
  it('removes Store A cache after switching to Store B', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    // Seed a Store A (site_demo) scoped query.
    qc.setQueryData(queryKeys.products('site_demo'), {
      items: [{ id: 'p_a' }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
    expect(qc.getQueryData(queryKeys.products('site_demo'))).toBeDefined();

    const { getByTestId } = render(
      <QueryClientProvider client={qc}>
        <Switcher to="site_atelier" />
      </QueryClientProvider>,
    );

    fireEvent.press(getByTestId('switch'));

    await waitFor(() => {
      expect(qc.getQueryData(queryKeys.products('site_demo'))).toBeUndefined();
    });
  });
});

describe('per-store data context', () => {
  it('returns a different, stable view per store and restores it on re-select', async () => {
    const products = getAdapters().products;

    await siteService.setActiveSite('site_demo');
    const demo1 = (await products.listProducts()).items.map((p) => p.id);

    await siteService.setActiveSite('site_atelier');
    const atelier = (await products.listProducts()).items.map((p) => p.id);

    await siteService.setActiveSite('site_demo');
    const demo2 = (await products.listProducts()).items.map((p) => p.id);

    // Different store => different view; same store => identical view (no contamination).
    expect(JSON.stringify(atelier)).not.toBe(JSON.stringify(demo1));
    expect(JSON.stringify(demo2)).toBe(JSON.stringify(demo1));
  });
});
