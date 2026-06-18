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
import { CustomerDetailScreen } from '@/features/customers/CustomerDetailScreen';
import { CustomerListScreen } from '@/features/customers/CustomerListScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

// Stub Expo Router navigation hooks so screens render outside a navigator.
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/customers',
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

describe('CustomerListScreen', () => {
  it('renders mock customers for the active site', async () => {
    renderWithProviders(<CustomerListScreen />);
    expect(await screen.findByText('Maya Brennan', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('Priya Nair')).toBeTruthy();
  });

  it('filters customers by search (name)', async () => {
    renderWithProviders(<CustomerListScreen />);
    await screen.findByText('Maya Brennan', {}, { timeout: 4000 });

    fireEvent.changeText(screen.getByTestId('customer-search'), 'priya');

    await waitFor(() => expect(screen.queryByText('Maya Brennan')).toBeNull());
    expect(screen.getByText('Priya Nair')).toBeTruthy();
  });

  it('shows an obvious add-customer action', async () => {
    renderWithProviders(<CustomerListScreen />);
    await screen.findByText('Maya Brennan', {}, { timeout: 4000 });
    expect(screen.getByTestId('customer-add')).toBeTruthy();
  });
});

describe('CustomerDetailScreen', () => {
  it('renders the selected customer with value summary', async () => {
    renderWithProviders(<CustomerDetailScreen customerId="cust_142" />);
    expect(await screen.findByText('Priya Nair', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('priya.nair@example.test')).toBeTruthy();
  });
});
