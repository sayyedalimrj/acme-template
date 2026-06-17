import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { AutomationScreen } from '@/features/automation/AutomationScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/automations',
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
            <I18nProvider>{children}</I18nProvider>
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

describe('AutomationScreen', () => {
  it('renders provider readiness and at least one campaign draft', async () => {
    renderWithProviders(<AutomationScreen />);
    expect(await screen.findByTestId('automation-screen', {}, { timeout: 4000 })).toBeTruthy();
    // Provider readiness row label renders once the overview loads.
    expect(await screen.findByText('ارائه‌دهنده پیامک', {}, { timeout: 4000 })).toBeTruthy();
    // A campaign draft (back-in-stock title appears as draft + rule label).
    expect(screen.getAllByText('اعلام موجودی مجدد').length).toBeGreaterThan(0);
  });
});
