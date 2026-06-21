/**
 * Session boundary.
 *
 * The single place the app asks "is there an authenticated user?" and the single place it
 * mutates that state. It delegates to `AuthService` (mock adapter) or the real backend session
 * (`authApi`) so screens and route guards never depend on the auth implementation.
 *
 * Persistence (real backend builds): the backend-issued session reference (short-lived access
 * JWT + rotating refresh token) is persisted via `tokenStorage`, so a page refresh / PWA relaunch
 * RESTORES the session (via `/auth/refresh`) instead of logging the user out. If the refresh token
 * is missing/expired/revoked, the user is sent to login. The mock build keeps the in-memory,
 * reset-on-reload behavior (no backend to restore from).
 *
 * Security: holds only frontend-safe profile data + our own session reference. It never stores
 * WooCommerce keys/secrets or WordPress application passwords (see security steering).
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isApiConfigured } from '@/config/api.config';
import { getActivePortal } from '@/config/portal.config';
import { roleCanUsePortal } from '@/config/portalAccess';
import { authService } from '@/services';
import {
  clearSessionTokens,
  completeProfile as completeProfileApi,
  hasStoredSession,
  logoutSession,
  restoreSession,
  setSessionTokens,
  type VerifyOtpResponse,
} from '@/services/authApi';
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
  /** Whether the first-login profile (name + email) is complete (from the backend). */
  profileComplete?: boolean;
}

export interface SessionContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** The active product experience (merchant | admin | affiliate). */
  portal: AppPortal;
  /** Whether the user has completed the first-login profile (name + email). */
  profileComplete: boolean;
  /** Establish a mock session via AuthService. */
  signIn: (input?: SignInInput) => Promise<void>;
  /** Establish a real session from a backend OTP verification (user + JWT + refresh token). */
  signInWithSession: (input: SignInWithSessionInput) => void;
  /** Save the first-login profile (first + last name + email) server-side, then continue. */
  completeProfile: (input: { firstName: string; lastName: string; email: string }) => Promise<void>;
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
  // If a restorable backend session exists, start in `loading` so guards wait for the restore
  // instead of flashing the login screen (and then logging the user back in).
  const canRestore = isApiConfigured() && hasStoredSession();
  const [status, setStatus] = useState<AuthStatus>(canRestore ? 'loading' : 'unauthenticated');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [portal, setPortal] = useState<AppPortal>(buildPortal);
  const [profileComplete, setProfileComplete] = useState<boolean>(true);

  // Apply a backend session payload (shared by fresh login + restore-on-reload).
  const applyBackendSession = useCallback(
    (input: SignInWithSessionInput) => {
      const role = resolveRole(input.user, input.roles);
      const userWithRole: AuthUser = role
        ? { ...input.user, role: role as AuthUser['role'] }
        : input.user;

      setSessionTokens({ token: input.token, refreshToken: input.refreshToken ?? null });
      setUser(userWithRole);
      setPortal(buildPortal);
      setProfileComplete(input.profileComplete ?? true);
      setStatus(canAccessBuildPortal(role, input.allowedPortals) ? 'authenticated' : 'access_denied');
    },
    [buildPortal],
  );

  // Restore a persisted backend session once on mount.
  useEffect(() => {
    if (!canRestore) return;
    let cancelled = false;
    void restoreSession().then((res: VerifyOtpResponse | null) => {
      if (cancelled) return;
      if (!res) {
        setStatus('unauthenticated');
        return;
      }
      applyBackendSession({
        user: {
          id: res.user.id,
          name: res.user.name ?? '',
          email: res.user.email ?? '',
          mobile: res.user.mobile,
          avatarUrl: res.user.avatarUrl ?? undefined,
          role: res.user.role as AuthUser['role'],
        },
        token: res.accessToken ?? res.token,
        refreshToken: res.refreshToken,
        roles: res.roles,
        allowedPortals: res.allowedPortals,
        portal: res.portal,
        profileComplete: res.profileComplete,
      });
    });
    return () => {
      cancelled = true;
    };
    // Run exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(
    async (input?: SignInInput) => {
      setStatus('loading');
      try {
        const session = await authService.signInMock({ name: input?.name, email: input?.email });
        const targetPortal = input?.portal ?? buildPortal;
        setUser(session.user);
        setPortal(targetPortal);
        setProfileComplete(true);
        setStatus(session.status);
      } catch {
        setUser(null);
        setStatus('unauthenticated');
      }
    },
    [buildPortal],
  );

  const signInWithSession = useCallback(
    (input: SignInWithSessionInput) => {
      applyBackendSession(input);
    },
    [applyBackendSession],
  );

  const completeProfile = useCallback(
    async (input: { firstName: string; lastName: string; email: string }) => {
      const res = await completeProfileApi(input);
      setUser((prev) =>
        prev
          ? { ...prev, name: res.user.name ?? prev.name, email: res.user.email ?? prev.email }
          : prev,
      );
      setProfileComplete(res.profileComplete);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await logoutSession();
    clearSessionTokens();
    const session = await authService.signOut();
    setUser(session.user);
    setProfileComplete(true);
    setStatus(session.status);
    setPortal(buildPortal);
  }, [buildPortal]);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      portal,
      profileComplete,
      signIn,
      signInWithSession,
      completeProfile,
      signOut,
      setPortal,
    }),
    [status, user, portal, profileComplete, signIn, signInWithSession, completeProfile, signOut],
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
