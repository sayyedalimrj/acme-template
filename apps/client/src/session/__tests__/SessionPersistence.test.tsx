/**
 * SessionProvider: session persistence across refresh (P0.3) + first-login profile gate (P0.2).
 *
 * Mocks the backend session client so we can assert the provider restores a persisted session on
 * mount (no logout on refresh), reports profile completeness, and falls back to unauthenticated
 * when the refresh token is no longer valid.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { SessionProvider, useSession } from '@/session/SessionProvider';

const mockRestoreSession = jest.fn<() => Promise<unknown>>();
let mockHasStoredSession = true;

jest.mock('@/config/api.config', () => ({
  isApiConfigured: () => true,
  getApiBaseUrl: () => 'http://test-api.local',
}));

jest.mock('@/config/portal.config', () => ({
  getActivePortal: () => 'merchant',
}));

jest.mock('@/config/portalAccess', () => ({
  roleCanUsePortal: () => true,
}));

jest.mock('@/services', () => ({
  authService: {
    signInMock: jest.fn(),
    signOut: jest.fn(async () => ({ user: null, status: 'unauthenticated' })),
  },
}));

jest.mock('@/services/authApi', () => ({
  restoreSession: () => mockRestoreSession(),
  hasStoredSession: () => mockHasStoredSession,
  setSessionTokens: jest.fn(),
  clearSessionTokens: jest.fn(),
  logoutSession: jest.fn(async () => {}),
  completeProfile: jest.fn(),
}));

function Probe(): React.JSX.Element {
  const { status, profileComplete, user } = useSession();
  return <Text testID="probe">{`${status}|${profileComplete}|${user?.name ?? ''}`}</Text>;
}

function renderSession() {
  return render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
}

const sessionPayload = (profileComplete: boolean) => ({
  accessToken: 'access-1',
  token: 'access-1',
  refreshToken: 'refresh-1',
  user: { id: 'u1', name: 'Ali Karimi', mobile: '09186441801', email: 'a@b.co', role: 'merchant_owner' },
  roles: ['merchant_owner'],
  portal: 'merchant',
  allowedPortals: ['merchant'],
  profileComplete,
});

beforeEach(() => {
  mockRestoreSession.mockReset();
  mockHasStoredSession = true;
});

describe('SessionProvider session persistence (P0.3)', () => {
  it('restores a persisted session on mount instead of logging out', async () => {
    mockRestoreSession.mockResolvedValue(sessionPayload(true));
    renderSession();
    await waitFor(() => {
      expect(screen.getByTestId('probe').props.children).toBe('authenticated|true|Ali Karimi');
    });
    expect(mockRestoreSession).toHaveBeenCalledTimes(1);
  });

  it('falls back to unauthenticated when the refresh token is invalid', async () => {
    mockRestoreSession.mockResolvedValue(null);
    renderSession();
    await waitFor(() => {
      expect(screen.getByTestId('probe').props.children).toBe('unauthenticated|true|');
    });
  });

  it('does not attempt a restore when there is no stored session', async () => {
    mockHasStoredSession = false;
    renderSession();
    await waitFor(() => {
      expect(screen.getByTestId('probe').props.children).toBe('unauthenticated|true|');
    });
    expect(mockRestoreSession).not.toHaveBeenCalled();
  });
});

describe('SessionProvider profile completeness (P0.2)', () => {
  it('reports profileComplete=false for an incomplete user after restore', async () => {
    mockRestoreSession.mockResolvedValue(sessionPayload(false));
    renderSession();
    await waitFor(() => {
      expect(screen.getByTestId('probe').props.children).toBe('authenticated|false|Ali Karimi');
    });
  });
});
