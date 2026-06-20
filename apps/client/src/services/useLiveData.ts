/**
 * Lightweight live-data hook for the admin/affiliate portals.
 *
 * Returns the mock value synchronously (so the UI renders instantly and unit tests that don't
 * mount a QueryClient keep working), and upgrades to real backend data when a backend is
 * configured. Keeps the portal screens free of network plumbing. All state updates happen in
 * async callbacks (never synchronously inside the effect body).
 */
import { useCallback, useEffect, useState } from 'react';

import { isApiConfigured } from '@/config/api.config';

export interface LiveData<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useLiveData<T>(mock: T, fetcher: () => Promise<T>): LiveData<T> {
  const [data, setData] = useState<T>(mock);
  const [isLoading, setIsLoading] = useState<boolean>(() => isApiConfigured());
  const [isError, setIsError] = useState<boolean>(false);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!isApiConfigured()) return undefined;
    let active = true;
    // Defer to a microtask so no setState runs synchronously inside the effect body.
    Promise.resolve()
      .then(() => fetcher())
      .then((d) => {
        if (active) {
          setData(d);
          setIsError(false);
        }
      })
      .catch(() => {
        if (active) setIsError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
    // `fetcher` is an inline closure; re-run only on explicit refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return { data, isLoading, isError, refetch };
}
