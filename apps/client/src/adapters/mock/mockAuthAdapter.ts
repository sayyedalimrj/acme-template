/**
 * Mock Auth adapter.
 *
 * Holds an in-memory session (no real credentials, no tokens persisted anywhere). Starts
 * pre-authenticated with a clearly-labeled demo user so the app shell renders during the
 * MVP. A future real AuthAdapter (backed by OUR backend/proxy) replaces this with the same
 * interface — screens won't change.
 */
import type { AuthSession, AuthUser } from '@/domain/types';

import type { AuthAdapter } from '../types';
import { DEMO_AVATAR_DATA_URI } from './mockDemoAvatar';
import { clone, delay } from './mockUtils';

// Clearly non-production demo user. Not a real account; carries no secrets.
const DEMO_USER: AuthUser = {
  id: 'usr_mock_001',
  name: 'اپراتور آزمایشی',
  email: 'operator@demo.local',
  avatarUrl: DEMO_AVATAR_DATA_URI,
  role: 'owner',
};

export function createMockAuthAdapter(): AuthAdapter {
  let session: AuthSession = { status: 'authenticated', user: clone(DEMO_USER) };

  return {
    async signInMock(input = {}): Promise<AuthSession> {
      await delay(200);
      session = {
        status: 'authenticated',
        user: {
          ...clone(DEMO_USER),
          ...(input.email ? { email: input.email } : {}),
          ...(input.name ? { name: input.name } : {}),
        },
      };
      return clone(session);
    },
    async signOut(): Promise<AuthSession> {
      await delay(150);
      session = { status: 'unauthenticated', user: null };
      return clone(session);
    },
    async getSession(): Promise<AuthSession> {
      await delay(100);
      return clone(session);
    },
  };
}
