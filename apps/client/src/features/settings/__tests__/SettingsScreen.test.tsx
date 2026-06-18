import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { SessionProvider } from '@/session/SessionProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/settings',
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithProviders(ui: ReactElement): RenderResult {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <I18nProvider>
              <SessionProvider>{children}</SessionProvider>
            </I18nProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}

beforeEach(() => {
  resetAdaptersForTests();
});

describe('SettingsScreen', () => {
  it('renders the app overview with version and platform note', () => {
    renderWithProviders(<SettingsScreen />);
    expect(screen.getByTestId('settings-screen')).toBeTruthy();
    expect(screen.getByText('0.1.0')).toBeTruthy();
    expect(screen.getByText('اپلیکیشن موبایل')).toBeTruthy();
    // Active site summary section (Persian copy).
    expect(screen.getByText('فروشگاه فعال')).toBeTruthy();
  });

  it('renders the security / connections warning (Persian)', () => {
    renderWithProviders(<SettingsScreen />);
    expect(screen.getByText(/وارد یا ذخیره نمی‌شود/)).toBeTruthy();
  });

  it('renders the team & roles placeholder (Persian role names)', () => {
    renderWithProviders(<SettingsScreen />);
    expect(screen.getByText('مالک')).toBeTruthy();
    expect(screen.getByText('مدیر')).toBeTruthy();
    expect(screen.getByText('کارمند')).toBeTruthy();
    expect(screen.getByText('بیننده')).toBeTruthy();
  });

  it('renders the appearance theme/direction controls', () => {
    renderWithProviders(<SettingsScreen />);
    expect(screen.getByTestId('toggle-mode')).toBeTruthy();
    expect(screen.getByTestId('toggle-direction')).toBeTruthy();
  });
});
