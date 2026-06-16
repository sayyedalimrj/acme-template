/**
 * Auth service — thin wrapper over the active AuthAdapter.
 *
 * The only layer screens/hooks use for auth. Mock-only in the MVP; swapping to a real
 * backend/proxy adapter requires no changes here.
 */
import { getAdapters } from '@/adapters';
import type { AuthSession } from '@/domain/types';

export const authService = {
  signInMock(input?: { email?: string; name?: string }): Promise<AuthSession> {
    return getAdapters().auth.signInMock(input);
  },
  signOut(): Promise<AuthSession> {
    return getAdapters().auth.signOut();
  },
  getSession(): Promise<AuthSession> {
    return getAdapters().auth.getSession();
  },
};
