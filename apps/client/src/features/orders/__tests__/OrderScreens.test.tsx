import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  type RenderResult,
} from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { OrderDetailScreen } from '@/features/orders/OrderDetailScreen';
import { OrderListScreen } from '@/features/orders/OrderListScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

// Stub Expo Router navigation hooks so screens render outside a navigator.
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/orders',
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

describe('OrderListScreen', () => {
  it('renders mock orders for the active site', async () => {
    renderWithProviders(<OrderListScreen />);
    expect(await screen.findByText('#5821', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('#5820')).toBeTruthy();
  });

  it('filters the list by search (order number)', async () => {
    renderWithProviders(<OrderListScreen />);
    await screen.findByText('#5821', {}, { timeout: 4000 });

    fireEvent.changeText(screen.getByTestId('order-search'), '5820');

    await waitFor(() => expect(screen.queryByText('#5821')).toBeNull());
    expect(screen.getByText('#5820')).toBeTruthy();
  });
});

describe('OrderDetailScreen', () => {
  it('renders the selected order with line items and totals', async () => {
    renderWithProviders(<OrderDetailScreen orderId="order_5820" />);
    expect(await screen.findByText('#5820', {}, { timeout: 4000 })).toBeTruthy();
    // A line item from the mock order renders.
    expect(screen.getByText('Lumen Desk Lamp (Walnut)')).toBeTruthy();
  });
});
