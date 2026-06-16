import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { SupportQueueScreen } from '@/features/support/SupportQueueScreen';
import { SupportRequestDetailScreen } from '@/features/support/SupportRequestDetailScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/support',
  useLocalSearchParams: () => ({ id: 'onb_new_2002' }),
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

describe('SupportQueueScreen', () => {
  it('renders the queue with at least one request', async () => {
    renderWithProviders(<SupportQueueScreen />);
    expect(await screen.findByTestId('support-queue-list', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByTestId('support-filters')).toBeTruthy();
  });
});

describe('SupportRequestDetailScreen', () => {
  it('renders the request detail with its status timeline', async () => {
    renderWithProviders(<SupportRequestDetailScreen requestId="onb_new_2002" />);
    expect(await screen.findByTestId('support-detail-screen', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByTestId('support-timeline')).toBeTruthy();
  });
});
