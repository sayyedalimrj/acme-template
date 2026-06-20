import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { AuthEntryScreen } from '@/features/auth/AuthEntryScreen';
import { OtpVerificationScreen } from '@/features/auth/OtpVerificationScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';
import { resetRuntimeConfigForTests } from '@/config/api.config';

const mockNavigate = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/features/auth/usePublicAuthConfig', () => ({
  usePublicAuthConfig: () => ({ smsDryRun: false, otpLength: 4, otpResendCooldownSeconds: 60 }),
}));

const mockRequestOtp = jest.fn<() => Promise<{ ok: boolean; delivered: boolean; expiresInSeconds: number }>>();
const mockVerifyOtp = jest.fn<() => Promise<unknown>>();
jest.mock('@/services/authApi', () => ({
  requestOtp: () => mockRequestOtp(),
  verifyOtp: () => mockVerifyOtp(),
  setSessionTokens: jest.fn(),
  clearSessionTokens: jest.fn(),
}));

jest.mock('@/config/api.config', () => ({
  isApiConfigured: () => true,
  getApiBaseUrl: () => 'http://test-api.local',
  loadRuntimeConfig: async () => ({ apiBaseUrl: 'http://test-api.local', portal: 'merchant' }),
  getRuntimeConfig: () => ({ apiBaseUrl: 'http://test-api.local', portal: 'merchant' }),
  resetRuntimeConfigForTests: () => {},
}));

jest.mock('@/session/SessionProvider', () => ({
  useSession: () => ({
    status: 'unauthenticated',
    signIn: jest.fn(),
    signInWithSession: jest.fn(),
    signOut: jest.fn(),
  }),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderAuth(ui: ReactElement) {
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
  mockRequestOtp.mockReset();
  mockVerifyOtp.mockReset();
  mockParams = {};
  resetRuntimeConfigForTests();
  mockRequestOtp.mockResolvedValue({ ok: true, delivered: true, expiresInSeconds: 120 });
});

describe('Auth HTTP flow', () => {
  it('requests OTP then navigates to /verify', async () => {
    renderAuth(<AuthEntryScreen />);
    fireEvent.changeText(screen.getByTestId('auth-entry-input'), '09123456789');
    fireEvent.press(screen.getByTestId('auth-entry-submit'));
    await Promise.resolve();
    expect(mockRequestOtp).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/verify' }),
    );
  });

  it('renders verify screen with identifier from route params', () => {
    mockParams = { identifier: '09123456789', channel: 'mobile', portal: 'merchant' };
    renderAuth(<OtpVerificationScreen />);
    expect(screen.getByTestId('otp-screen')).toBeTruthy();
    expect(screen.getByText('کد تایید برای شما پیامک می‌شود.')).toBeTruthy();
  });
});
