import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { MediaStudioScreen } from '@/features/media-studio/MediaStudioScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/media-studio',
  useLocalSearchParams: () => ({}),
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

describe('MediaStudioScreen', () => {
  it('renders the product selector and task chooser', () => {
    renderWithProviders(<MediaStudioScreen />);
    expect(screen.getByTestId('media-studio-screen')).toBeTruthy();
    expect(screen.getByTestId('media-product-selector')).toBeTruthy();
    expect(screen.getByTestId('media-task-chooser')).toBeTruthy();
  });

  it('renders seeded output variants for the default product', async () => {
    renderWithProviders(<MediaStudioScreen />);
    // The seeded variant title for the first product renders once variants load.
    expect(
      await screen.findByText('تی‌شرت نخی آئورا — نسخه بهبودیافته', {}, { timeout: 4000 }),
    ).toBeTruthy();
  });
});
