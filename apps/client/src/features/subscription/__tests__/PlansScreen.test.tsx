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
  it('renders the current plan and a 1/3/6/12-month duration selector with a price', async () => {
    renderWithProviders(<PlansScreen />);
    expect(await screen.findByTestId('plans-current', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByTestId('plans-renew')).toBeTruthy();
    expect(screen.getByTestId('plans-duration-selector')).toBeTruthy();
    // The four duration labels are present.
    ['۱ ماهه', '۳ ماهه', '۶ ماهه', '۱۲ ماهه'].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
    // Default duration (12 months) price is shown.
    expect(screen.getByText('۴٬۹۰۰٬۰۰۰')).toBeTruthy();
    // The renew CTA is present.
    expect(screen.getByTestId('plans-renew-cta')).toBeTruthy();
  });

  it('does not render the old comparison matrix or interval toggle', async () => {
    renderWithProviders(<PlansScreen />);
    await screen.findByTestId('plans-renew', {}, { timeout: 4000 });
    expect(screen.queryByTestId('plans-feature-matrix')).toBeNull();
    expect(screen.queryByTestId('plans-interval-toggle')).toBeNull();
  });
});
