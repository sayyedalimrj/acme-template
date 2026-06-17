import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { SignInScreen } from '@/features/auth/SignInScreen';
import { VerifyScreen } from '@/features/auth/VerifyScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { SessionProvider } from '@/session/SessionProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, replace: () => {}, back: () => {} }),
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
          <I18nProvider locale="en">
            <SessionProvider>{children}</SessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}

describe('SignInScreen', () => {
  it('renders the sign-in card, mock note and the verify-code link', () => {
    renderAuth(<SignInScreen />);
    expect(screen.getByTestId('sign-in-screen')).toBeTruthy();
    expect(screen.getByText('Welcome back!')).toBeTruthy();
    expect(screen.getByText('Sign in to continue')).toBeTruthy();
    // Secondary action linking to the mock verification screen.
    expect(screen.getByText('Enter a code')).toBeTruthy();
  });
});

describe('VerifyScreen (mock OTP)', () => {
  it('renders the verification UI with a clear mock/non-delivery note', () => {
    renderAuth(<VerifyScreen />);
    expect(screen.getByTestId('verify-screen')).toBeTruthy();
    expect(screen.getByText('Verify your code')).toBeTruthy();
    expect(screen.getByText('Verify')).toBeTruthy();
    expect(screen.getByText('Back to sign in')).toBeTruthy();
    // Six single-digit inputs are present.
    expect(screen.getByLabelText('Digit 1')).toBeTruthy();
    expect(screen.getByLabelText('Digit 6')).toBeTruthy();
    // The screen states it is UI-only and never delivers/checks a code.
    expect(
      screen.getByText(/no code is sent, generated, stored, or checked/i),
    ).toBeTruthy();
  });
});
