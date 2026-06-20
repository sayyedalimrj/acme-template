import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { ConfigBootstrap } from '@/providers/ConfigBootstrap';
import { AuthEntryScreen } from '@/features/auth/AuthEntryScreen';
import { OtpVerificationScreen } from '@/features/auth/OtpVerificationScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';
import { resetRuntimeConfigForTests, setRuntimeConfigForTests } from '@/config/runtimeConfig';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
let mockParams: Record<string, string> = {};
let mockSignInWithSession = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, replace: mockReplace, back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/features/auth/usePublicAuthConfig', () => ({
  usePublicAuthConfig: () => ({ smsDryRun: true, otpLength: 4, otpResendCooldownSeconds: 60 }),
}));

jest.mock('@/services/authApi', () => ({
  requestOtp: jest.fn(async () => ({ ok: true, delivered: false, expiresInSeconds: 120 })),
  verifyOtp: jest.fn(),
  setSessionTokens: jest.fn(),
  clearSessionTokens: jest.fn(),
}));

jest.mock('@/config/api.config', () => ({
  isApiConfigured: () => false,
  getApiBaseUrl: () => '',
}));

jest.mock('@/session/SessionProvider', () => ({
  useSession: () => ({
    status: 'unauthenticated',
    signIn: jest.fn(),
    signInWithSession: mockSignInWithSession,
    signOut: jest.fn(),
  }),
}));

jest.mock('@/adapters', () => ({
  resetAdaptersForTests: jest.fn(),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderTree(ui: ReactElement) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeProvider>
          <I18nProvider locale="fa">{children}</I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockReplace.mockClear();
  mockSignInWithSession.mockClear();
  mockParams = {};
  resetRuntimeConfigForTests();
});

describe('ConfigBootstrap non-blocking', () => {
  it('renders children with invalid config warning (never blank)', () => {
    setRuntimeConfigForTests({ apiBaseUrl: '', portal: 'merchant', configWarning: 'تست هشدار' });
    renderTree(
      <ConfigBootstrap>
        <AuthEntryScreen />
      </ConfigBootstrap>,
    );
    expect(screen.getByText('تست هشدار')).toBeTruthy();
    expect(screen.getByTestId('auth-entry-screen')).toBeTruthy();
  });
});

describe('portal-aware verify route', () => {
  it('shows error for invalid portal param', () => {
    mockParams = { identifier: '09123456789', channel: 'mobile', portal: 'bogus' };
    renderTree(<OtpVerificationScreen />);
    expect(screen.getByText(/پورتال در آدرس نامعتبر/)).toBeTruthy();
  });

  it('shows error when verify portal mismatches build portal', () => {
    setRuntimeConfigForTests({ apiBaseUrl: '', portal: 'merchant' });
    mockParams = { identifier: '09123456789', channel: 'mobile', portal: 'admin' };
    renderTree(<OtpVerificationScreen />);
    expect(screen.getByText(/این لینک تأیید برای پورتال دیگری/)).toBeTruthy();
  });

  it('renders OTP screen for matching portal param', () => {
    setRuntimeConfigForTests({ apiBaseUrl: '', portal: 'merchant' });
    mockParams = { identifier: '09123456789', channel: 'mobile', portal: 'merchant' };
    renderTree(<OtpVerificationScreen />);
    expect(screen.getByTestId('otp-screen')).toBeTruthy();
  });
});

describe('AuthEntryScreen portal branding', () => {
  it('uses admin portal meta when build portal is admin', () => {
    setRuntimeConfigForTests({ apiBaseUrl: '', portal: 'admin' });
    renderTree(<AuthEntryScreen />);
    expect(screen.getByText('پنل مدیریت')).toBeTruthy();
  });
});
