/**
 * Classic page-number pagination — for desktop-style prev/next controls.
 * Resets to page 1 when filter query changes.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

import type { Paged } from '@/domain/types';

export interface PageQueryOptions<T, Q extends Record<string, unknown>> {
  queryKey: readonly unknown[];
  queryFn: (query: Q & { page: number; pageSize: number }) => Promise<Paged<T>>;
  query: Q;
  pageSize?: number;
  enabled?: boolean;
}

export interface PageQueryResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  isPending: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export function usePageQuery<T, Q extends Record<string, unknown>>({
  queryKey,
  queryFn,
  query,
  pageSize = 20,
  enabled = true,
}: PageQueryOptions<T, Q>): PageQueryResult<T> {
  const querySig = JSON.stringify(query);
  const [pageState, setPageState] = useState({ sig: querySig, page: 1 });
  const page = pageState.sig === querySig ? pageState.page : 1;

  const setPage = (next: number): void => {
    setPageState({ sig: querySig, page: next });
  };

  const result: UseQueryResult<Paged<T>, Error> = useQuery({
    queryKey: [...queryKey, query, page, pageSize],
    queryFn: () => queryFn({ ...query, page, pageSize }),
    enabled,
    placeholderData: (prev) => prev,
  });

  const total = result.data?.total ?? 0;
  const hasNext = page * pageSize < total;
  const hasPrev = page > 1;

  return {
    items: result.data?.items ?? [],
    total,
    page,
    pageSize,
    hasNext,
    hasPrev,
    isPending: result.isPending,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    refetch: () => {
      void result.refetch();
    },
    nextPage: () => {
      if (hasNext) setPage(page + 1);
    },
    prevPage: () => {
      if (hasPrev) setPage(page - 1);
    },
    setPage,
  };
}
