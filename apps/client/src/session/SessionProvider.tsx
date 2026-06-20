/**
 * Session boundary.
 *
 * The single place the app asks "is there an authenticated user?" and the single place it
 * mutates that state. It delegates to `AuthService` (mock adapter today; a real backend/
 * proxy adapter later) so screens and route guards never depend on the auth implementation.
 *
 * The app starts UNAUTHENTICATED so the first-run flow is: sign in → select/connect a site →
 * dashboard. No persistence yet: session state is in memory and resets on reload.
 * TODO (auth hardening): persist a short-lived session reference via a cross-platform secure
 * store (expo-secure-store / AsyncStorage) — never `localStorage`, never raw credentials.
 *
 * Security: holds only frontend-safe profile data. It never stores WooCommerce keys/secrets
 * or WordPress application passwords (see security steering).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getActivePortal } from '@/config/portal.config';
import { roleCanUsePortal } from '@/config/portalAccess';
import { authService } from '@/services';
import { clearSessionTokens, logoutSession, setSessionTokens } from '@/services/authApi';
import type { AppPortal, AuthStatus, AuthUser } from '@/domain/types';

export interface SignInInput {
  name?: string;
  email?: string;
  /** Which experience to sign into (defaults to this build's portal). */
  portal?: AppPortal;
}

export interface SignInWithSessionInput {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  roles?: string[];
  allowedPortals?: AppPortal[];
  portal?: AppPortal;
}

export interface SessionContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** The active product experience (merchant | admin | affiliate). */
  portal: AppPortal;
  /** Establish a mock session via AuthService. */
  signIn: (input?: SignInInput) => Promise<void>;
  /** Establish a real session from a backend OTP verification (user + JWT + refresh token). */
  signInWithSession: (input: SignInWithSessionInput) => void;
  /** Clear the session via AuthService. */
  signOut: () => Promise<void>;
  /** Switch the active portal in-app (mock convenience; persisted in memory only). */
  setPortal: (portal: AppPortal) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function resolveRole(user: AuthUser, roles?: string[]): string | undefined {
  return user.role ?? roles?.[0];
}

function canAccessBuildPortal(role: string | undefined, allowedPortals?: AppPortal[]): boolean {
  const buildPortal = getActivePortal();
  if (allowedPortals?.includes(buildPortal)) return true;
  if (!role) return false;
  return roleCanUsePortal(role, buildPortal);
}

export interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps): React.JSX.Element {
  const buildPortal = getActivePortal();
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [portal, setPortal] = useState<AppPortal>(buildPortal);

  const signIn = useCallback(async (input?: SignInInput) => {
    setStatus('loading');
    try {
      const session = await authService.signInMock({ name: input?.name, email: input?.email });
      const targetPortal = input?.portal ?? buildPortal;
      setUser(session.user);
      setPortal(targetPortal);
      setStatus(session.status);
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, [buildPortal]);

  const signInWithSession = useCallback((input: SignInWithSessionInput) => {
    const role = resolveRole(input.user, input.roles);
    const userWithRole: AuthUser = role ? { ...input.user, role: role as AuthUser['role'] } : input.user;

    if (!canAccessBuildPortal(role, input.allowedPortals)) {
      setSessionTokens({ token: input.token, refreshToken: input.refreshToken ?? null });
      setUser(userWithRole);
      setPortal(buildPortal);
      setStatus('access_denied');
      return;
    }

    setSessionTokens({ token: input.token, refreshToken: input.refreshToken ?? null });
    setUser(userWithRole);
    setPortal(buildPortal);
    setStatus('authenticated');
  }, [buildPortal]);

  const signOut = useCallback(async () => {
    await logoutSession();
    clearSessionTokens();
    const session = await authService.signOut();
    setUser(session.user);
    setStatus(session.status);
    setPortal(buildPortal);
  }, [buildPortal]);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, portal, signIn, signInWithSession, signOut, setPortal }),
    [status, user, portal, signIn, signInWithSession, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
