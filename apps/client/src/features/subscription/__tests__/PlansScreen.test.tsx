import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { PlansScreen } from '@/features/subscription/PlansScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/plans',
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

describe('PlansScreen', () => {
  it('renders the interval toggle, all plan names, and the feature matrix', async () => {
    renderWithProviders(<PlansScreen />);
    expect(await screen.findByTestId('plans-interval-toggle', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByTestId('plans-feature-matrix')).toBeTruthy();
    expect(screen.getByTestId('plans-current')).toBeTruthy();
    // Plan names appear (cards + matrix header) — at least once each.
    ['پایه', 'رشد', 'حرفه‌ای', 'مدیریت‌شده'].forEach((name) => {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    });
    // A key feature label from the matrix.
    expect(screen.getByText('داشبورد مدیریت')).toBeTruthy();
  });
});
