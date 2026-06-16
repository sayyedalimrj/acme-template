import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { OnboardingRequestDetailScreen } from '@/features/onboarding/OnboardingRequestDetailScreen';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/onboarding',
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

describe('OnboardingScreen', () => {
  it('renders the two onboarding path choices', async () => {
    renderWithProviders(<OnboardingScreen />);
    expect(
      await screen.findByTestId('onboarding-path-existing', {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(screen.getByTestId('onboarding-path-new')).toBeTruthy();
  });
});

describe('OnboardingRequestDetailScreen', () => {
  it('renders a request with its status timeline', async () => {
    renderWithProviders(<OnboardingRequestDetailScreen requestId="onb_new_2002" />);
    // The seed launch request resolves and the detail screen renders its status timeline.
    expect(
      await screen.findByTestId('onboarding-detail-screen', {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(screen.getByTestId('onboarding-timeline')).toBeTruthy();
  });
});
