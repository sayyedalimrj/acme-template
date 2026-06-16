/**
 * Current auth session hook (TanStack Query).
 *
 * Reads the mock session via AuthService. Named `useCurrentSession` to avoid colliding with
 * the existing `useSession` React context (the in-app session gate). When real auth lands,
 * this hook keeps the same shape.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { authService, queryKeys } from '@/services';
import type { AuthSession } from '@/domain/types';

export function useCurrentSession(): UseQueryResult<AuthSession, Error> {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: () => authService.getSession(),
  });
}
