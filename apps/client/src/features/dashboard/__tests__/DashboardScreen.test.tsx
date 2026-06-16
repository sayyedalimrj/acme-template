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

// Assertions use stable, locale-independent values (testIDs, mock data, currency formatted
// with the en util locale) so they survive the Persian UI default.
describe('DashboardScreen (operational home)', () => {
  it('renders the KPI store pulse and the action center once data loads', async () => {
    renderWithProviders(<DashboardScreen />);
    expect(await screen.findByTestId('dashboard-screen', {}, { timeout: 4000 })).toBeTruthy();
    // Store pulse KPI value (sales total, formatted with the en number util).
    expect(screen.getByText('$48,217.65')).toBeTruthy();
    // Action center renders an urgent item (message text comes from mock data).
    expect(screen.getByText(/awaiting payment/i)).toBeTruthy();
  });

  it('renders recent orders, inventory alerts and top products', async () => {
    renderWithProviders(<DashboardScreen />);
    await screen.findByTestId('dashboard-screen', {}, { timeout: 4000 });
    // Recent orders (mock order number).
    expect(screen.getByText('#5821')).toBeTruthy();
    // Inventory alert (out-of-stock product, unique to that section).
    expect(screen.getByText('Mesa Ceramic Pour-Over Set')).toBeTruthy();
    // Top product (unique to the top-products section).
    expect(screen.getByText('Everyday Leather Cardholder')).toBeTruthy();
  });
});
