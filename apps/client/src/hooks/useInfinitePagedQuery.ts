/**
 * Accumulating pagination via TanStack Infinite Query — appends pages without replacing prior
 * items, which keeps FlatList/ScrollView scroll position stable when loading more.
 */
import {
  useInfiniteQuery,
  type InfiniteData,
} from '@tanstack/react-query';

import type { Paged } from '@/domain/types';

export interface InfinitePagedQueryOptions<T, Q extends Record<string, unknown>> {
  queryKey: readonly unknown[];
  queryFn: (query: Q & { page: number; pageSize: number }) => Promise<Paged<T>>;
  /** Base filters (search, status, …) — changing these resets to page 1. */
  query: Q;
  pageSize?: number;
  enabled?: boolean;
}

export interface InfinitePagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
}

function flattenPages<T>(data: InfiniteData<Paged<T>> | undefined): T[] {
  if (!data) return [];
  return data.pages.flatMap((p) => p.items);
}

export function useInfinitePagedQuery<T, Q extends Record<string, unknown>>({
  queryKey,
  queryFn,
  query,
  pageSize = 20,
  enabled = true,
}: InfinitePagedQueryOptions<T, Q>): InfinitePagedResult<T> {
  const result = useInfiniteQuery<
    Paged<T>,
    Error,
    InfiniteData<Paged<T>>,
    readonly unknown[],
    number
  >({
    queryKey: [...queryKey, query, pageSize],
    queryFn: ({ pageParam }) => queryFn({ ...query, page: pageParam as number, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.pageSize;
      if (loaded >= lastPage.total) return undefined;
      return lastPage.page + 1;
    },
    enabled,
  });

  const lastPage = result.data?.pages[result.data.pages.length - 1];
  const total = lastPage?.total ?? 0;
  const currentPage = result.data?.pages.length ?? 0;

  return {
    items: flattenPages(result.data),
    total,
    page: currentPage,
    pageSize,
    hasNext: currentPage * pageSize < total,
    isPending: result.isPending,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    refetch: () => {
      void result.refetch();
    },
    fetchNextPage: () => {
      if (result.hasNextPage && !result.isFetchingNextPage) {
        void result.fetchNextPage();
      }
    },
    isFetchingNextPage: result.isFetchingNextPage,
  };
}
