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
import { ProductDetailScreen } from '@/features/products/ProductDetailScreen';
import { ProductListScreen } from '@/features/products/ProductListScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

// Stub Expo Router navigation hooks so screens render outside a navigator.
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/products',
}));

// Explicit safe-area metrics so useSafeAreaInsets resolves synchronously in tests.
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

describe('ProductListScreen', () => {
  it('renders mock products for the active site', async () => {
    renderWithProviders(<ProductListScreen />);
    expect(await screen.findByText('Aurora Cotton Crew Tee', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('Northwind Canvas Tote')).toBeTruthy();
  });

  it('filters the list by search text', async () => {
    renderWithProviders(<ProductListScreen />);
    await screen.findByText('Aurora Cotton Crew Tee', {}, { timeout: 4000 });

    fireEvent.changeText(screen.getByTestId('product-search'), 'tote');

    await waitFor(() => expect(screen.queryByText('Aurora Cotton Crew Tee')).toBeNull());
    expect(screen.getByText('Northwind Canvas Tote')).toBeTruthy();
  });
});

describe('ProductDetailScreen', () => {
  it('renders the selected product', async () => {
    renderWithProviders(<ProductDetailScreen productId="prod_1001" />);
    expect(await screen.findByText('Aurora Cotton Crew Tee', {}, { timeout: 4000 })).toBeTruthy();
    // SKU is shown in the header.
    expect(screen.getByText('APP-TEE-001')).toBeTruthy();
  });
});
