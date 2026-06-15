/**
 * Mock auth gate placeholder.
 *
 * Task 1 only establishes the SESSION BOUNDARY: a single place the app asks "is there an
 * authenticated user?" Real sign-in, sign-out, protected-route redirects, and a Zustand
 * session store arrive in the Auth/session task. For now a mock user is pre-authenticated
 * so the dashboard shell renders.
 *
 * Security: this holds only safe, non-secret session metadata. It never stores WooCommerce
 * keys/secrets or WordPress application passwords (see security steering).
 */
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type AuthStatus = 'authenticated' | 'unauthenticated' | 'loading';

/** Frontend-safe user profile. No credentials, ever. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionContextValue {
  status: AuthStatus;
  user: SessionUser | null;
  /** Placeholder: replaced by a real auth provider in the Auth/session task. */
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

// Clearly-labeled non-production mock user. Not a real account; no secrets.
const MOCK_USER: SessionUser = {
  id: 'usr_mock_001',
  name: 'Demo Operator',
  email: 'operator@demo.local',
};

export interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps): React.JSX.Element {
  const [user, setUser] = useState<SessionUser | null>(MOCK_USER);

  const value = useMemo<SessionContextValue>(
    () => ({
      status: user ? 'authenticated' : 'unauthenticated',
      user,
      signOut: () => setUser(null),
    }),
    [user],
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
