import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/',
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

describe('DashboardScreen (operational home)', () => {
  it('renders KPI store pulse and the action center once data loads', async () => {
    renderWithProviders(<DashboardScreen />);
    // KPI labels (store pulse).
    expect(await screen.findByText('Sales', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('Orders')).toBeTruthy();
    expect(screen.getByText('Avg. order value')).toBeTruthy();
    // Section headers for action center + operational sections.
    expect(screen.getByText('Action center')).toBeTruthy();
    expect(screen.getByText('Recent orders')).toBeTruthy();
    expect(screen.getByText('Inventory alerts')).toBeTruthy();
    expect(screen.getByText('Top products')).toBeTruthy();
  });

  it('renders recent orders with a deep link affordance and order numbers', async () => {
    renderWithProviders(<DashboardScreen />);
    // A recent order from the mock renders and the "All orders" link is present.
    expect(await screen.findByText('#5821', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('All orders')).toBeTruthy();
  });
});
