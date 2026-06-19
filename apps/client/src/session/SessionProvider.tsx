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

import { ACTIVE_PORTAL } from '@/config/portal.config';
import { authService } from '@/services';
import type { AppPortal, AuthStatus, AuthUser } from '@/domain/types';

export interface SignInInput {
  name?: string;
  email?: string;
  /** Which experience to sign into (defaults to the merchant dashboard). */
  portal?: AppPortal;
}

export interface SessionContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** The active product experience (merchant | admin | affiliate). */
  portal: AppPortal;
  /** Establish a mock session via AuthService. */
  signIn: (input?: SignInInput) => Promise<void>;
  /** Clear the session via AuthService. */
  signOut: () => Promise<void>;
  /** Switch the active portal in-app (mock convenience; persisted in memory only). */
  setPortal: (portal: AppPortal) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps): React.JSX.Element {
  const [status, setStatus] = useState<AuthStatus>('unauthenticated');
  const [user, setUser] = useState<AuthUser | null>(null);
  // Each deployment is fixed to ONE portal (its subdomain); default to this build's portal.
  const [portal, setPortal] = useState<AppPortal>(ACTIVE_PORTAL);

  const signIn = useCallback(async (input?: SignInInput) => {
    setStatus('loading');
    try {
      const session = await authService.signInMock({ name: input?.name, email: input?.email });
      setUser(session.user);
      setStatus(session.status);
      setPortal(input?.portal ?? ACTIVE_PORTAL);
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  const signOut = useCallback(async () => {
    const session = await authService.signOut();
    setUser(session.user);
    setStatus(session.status);
    setPortal(ACTIVE_PORTAL);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({ status, user, portal, signIn, signOut, setPortal }),
    [status, user, portal, signIn, signOut],
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
