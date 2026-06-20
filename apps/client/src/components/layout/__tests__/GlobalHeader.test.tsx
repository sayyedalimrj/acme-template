/**
 * Top identity = authenticated user name (PR #57 Task 2).
 *
 * The persistent header must show the USER's name (with safe fallbacks), not the active store
 * name. The store name continues to live in store-specific UI (home carousel / site cards), so
 * switching stores never changes the header identity.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

import { GlobalHeader } from '../GlobalHeader';

let mockUser: { name?: string; mobile?: string; email?: string; avatarUrl?: string } | null = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
}));

jest.mock('@/session/SessionProvider', () => ({
  useSession: () => ({ user: mockUser }),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderHeader(): ReturnType<typeof render> {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeProvider>
          <I18nProvider locale="fa">{children}</I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }
  return render(<GlobalHeader />, { wrapper: Wrapper });
}

beforeEach(() => {
  mockUser = null;
});

describe('GlobalHeader identity', () => {
  it('shows the authenticated user name (not a store name)', () => {
    mockUser = { name: 'علی کریمی', mobile: '09120000000' };
    const { getByText } = renderHeader();
    expect(getByText('علی کریمی')).toBeTruthy();
  });

  it('falls back to the mobile number when the name is empty', () => {
    mockUser = { name: '   ', mobile: '09121234567' };
    const { getByText } = renderHeader();
    expect(getByText('09121234567')).toBeTruthy();
  });

  it('falls back to «کاربر» when neither name nor mobile is available', () => {
    mockUser = { name: '', mobile: '' };
    const { getByText } = renderHeader();
    expect(getByText('کاربر')).toBeTruthy();
  });

  it('shows the profile photo when avatarUrl exists', () => {
    mockUser = { name: 'علی کریمی', mobile: '09120000000', avatarUrl: 'https://example.test/a.png' };
    const { getByTestId, queryByTestId } = renderHeader();
    expect(getByTestId('header-avatar-image')).toBeTruthy();
    expect(queryByTestId('header-avatar-initials')).toBeNull();
  });

  it('falls back to initials when no avatarUrl', () => {
    mockUser = { name: 'علی کریمی', mobile: '09120000000' };
    const { getByTestId, queryByTestId } = renderHeader();
    expect(getByTestId('header-avatar-initials')).toBeTruthy();
    expect(queryByTestId('header-avatar-image')).toBeNull();
  });
});
