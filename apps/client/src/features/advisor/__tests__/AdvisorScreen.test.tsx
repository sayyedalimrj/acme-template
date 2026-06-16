import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { AdvisorScreen } from '@/features/advisor/AdvisorScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/advisor',
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

describe('AdvisorScreen', () => {
  it('renders prompt suggestions, store context, and at least one insight', async () => {
    renderWithProviders(<AdvisorScreen />);
    expect(await screen.findByTestId('advisor-prompts', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByTestId('advisor-context')).toBeTruthy();
    expect(screen.getByTestId('advisor-status')).toBeTruthy();
    // A seeded insight title renders.
    expect(screen.getByText('محصول کم‌موجودی')).toBeTruthy();
  });

  it('renders at least one recommendation', async () => {
    renderWithProviders(<AdvisorScreen />);
    expect(await screen.findByText('پیشنهاد شارژ مجدد موجودی', {}, { timeout: 4000 })).toBeTruthy();
  });
});
