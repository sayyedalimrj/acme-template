import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { fireEvent, render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { AuthEntryScreen } from '@/features/auth/AuthEntryScreen';
import { OtpVerificationScreen } from '@/features/auth/OtpVerificationScreen';
import { RegisterProfileScreen } from '@/features/auth/RegisterProfileScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    back: mockBack,
    push: jest.fn(),
  }),
  useLocalSearchParams: () => mockParams,
}));

const mockSignIn = jest.fn();
jest.mock('@/session/SessionProvider', () => ({
  useSession: () => ({
    status: 'unauthenticated',
    user: null,
    signIn: mockSignIn,
    signOut: jest.fn(),
  }),
  SessionProvider: ({ children }: { children: ReactNode }) => children,
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 1280, height: 900 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderAuth(ui: ReactElement): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeProvider>
          <I18nProvider locale="en">{children}</I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}

function fillOtp(code: string): void {
  code.split('').forEach((digit, index) => {
    fireEvent.changeText(screen.getByLabelText(`Digit ${index + 1}`), digit);
  });
}

beforeEach(() => {
  mockNavigate.mockClear();
  mockReplace.mockClear();
  mockBack.mockClear();
  mockSignIn.mockClear();
  mockParams = {};
});

describe('AuthEntryScreen', () => {
  it('renders the entry screen with a single identifier field and CTA', () => {
    renderAuth(<AuthEntryScreen />);
    expect(screen.getByTestId('auth-entry-screen')).toBeTruthy();
    expect(screen.getByText('Sign in to manage your connected stores.')).toBeTruthy();
    expect(screen.getByTestId('auth-entry-input')).toBeTruthy();
    expect(screen.getByTestId('auth-entry-submit')).toBeTruthy();
  });

  it('keeps the continue button disabled for invalid input and does not navigate', () => {
    renderAuth(<AuthEntryScreen />);
    // Empty → disabled.
    expect(screen.getByTestId('auth-entry-submit').props.accessibilityState?.disabled).toBe(true);
    fireEvent.changeText(screen.getByTestId('auth-entry-input'), 'not valid');
    // Non-empty but invalid → still disabled; pressing must not navigate.
    expect(screen.getByTestId('auth-entry-submit').props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('auth-entry-submit'));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to the OTP screen for a valid identifier', () => {
    renderAuth(<AuthEntryScreen />);
    fireEvent.changeText(screen.getByTestId('auth-entry-input'), 'you@company.com');
    fireEvent.press(screen.getByTestId('auth-entry-submit'));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const arg = mockNavigate.mock.calls[0][0] as {
      pathname: string;
      params: Record<string, string>;
    };
    expect(arg.pathname).toBe('/verify');
    expect(arg.params.identifier).toBe('you@company.com');
    expect(arg.params.channel).toBe('email');
  });
});

describe('OtpVerificationScreen (mock)', () => {
  it('renders 4 OTP boxes, a verify CTA and a back button', () => {
    mockParams = { identifier: 'you@company.com', channel: 'email' };
    renderAuth(<OtpVerificationScreen />);
    expect(screen.getByTestId('otp-screen')).toBeTruthy();
    expect(screen.getByText('Verify identity')).toBeTruthy();
    expect(screen.getByLabelText('Digit 1')).toBeTruthy();
    expect(screen.getByLabelText('Digit 4')).toBeTruthy();
    expect(screen.getByTestId('otp-submit')).toBeTruthy();
  });

  it('requires a complete 4-digit code before continuing', () => {
    mockParams = { identifier: 'you@company.com', channel: 'email' };
    renderAuth(<OtpVerificationScreen />);
    fillOtp('12');
    fireEvent.press(screen.getByTestId('otp-submit'));
    expect(screen.getByText('Enter the full 4-digit code.')).toBeTruthy();
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('routes a KNOWN user to the dashboard (mock sign-in) after OTP', () => {
    mockParams = { identifier: 'operator@demo.local', channel: 'email' };
    renderAuth(<OtpVerificationScreen />);
    fillOtp('1234');
    fireEvent.press(screen.getByTestId('otp-submit'));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    // Known users never get routed to registration.
    const wentToRegister = mockReplace.mock.calls.some(
      (call) => (call[0] as { pathname?: string })?.pathname === '/register',
    );
    expect(wentToRegister).toBe(false);
  });

  it('routes an UNKNOWN user to registration after OTP', () => {
    mockParams = { identifier: 'new.person@store.example', channel: 'email' };
    renderAuth(<OtpVerificationScreen />);
    fillOtp('1234');
    fireEvent.press(screen.getByTestId('otp-submit'));
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledTimes(1);
    const arg = mockReplace.mock.calls[0][0] as { pathname: string };
    expect(arg.pathname).toBe('/register');
  });
});

describe('RegisterProfileScreen (mock)', () => {
  it('keeps submit disabled until first name, last name and a valid mobile are entered', () => {
    mockParams = { identifier: 'new.person@store.example', channel: 'email' };
    renderAuth(<RegisterProfileScreen />);
    // No required fields yet → disabled, and pressing must not create a session.
    expect(screen.getByTestId('register-submit').props.accessibilityState?.disabled).toBe(true);
    fireEvent.press(screen.getByTestId('register-submit'));
    expect(mockSignIn).not.toHaveBeenCalled();

    // Fill required fields → enabled.
    fireEvent.changeText(screen.getByTestId('register-first-name'), 'Ali');
    fireEvent.changeText(screen.getByTestId('register-last-name'), 'Karimi');
    fireEvent.changeText(screen.getByTestId('register-mobile'), '09123000111');
    expect(screen.getByTestId('register-submit').props.accessibilityState?.disabled).toBe(false);
  });

  it('creates a mock session when required fields are valid', () => {
    mockParams = { identifier: '09123000111', channel: 'mobile' };
    renderAuth(<RegisterProfileScreen />);
    fireEvent.changeText(screen.getByTestId('register-first-name'), 'Ali');
    fireEvent.changeText(screen.getByTestId('register-last-name'), 'Karimi');
    // mobile prefilled from params; submit.
    fireEvent.press(screen.getByTestId('register-submit'));
    expect(mockSignIn).toHaveBeenCalledTimes(1);
    const arg = mockSignIn.mock.calls[0][0] as { name: string };
    expect(arg.name).toBe('Ali Karimi');
  });
});
