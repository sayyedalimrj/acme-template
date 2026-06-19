import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen, type RenderResult } from '@testing-library/react-native';
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
  it('renders the simplified photo-or-prompt chat composer', () => {
    renderWithProviders(<MediaStudioScreen />);
    expect(screen.getByTestId('media-studio-screen')).toBeTruthy();
    // Composer controls: attach toggle + send button.
    expect(screen.getByTestId('studio-attach-toggle')).toBeTruthy();
    expect(screen.getByTestId('studio-send')).toBeTruthy();
  });

  it('opens the attach panel with sample images', () => {
    renderWithProviders(<MediaStudioScreen />);
    fireEvent.press(screen.getByTestId('studio-attach-toggle'));
    expect(screen.getByTestId('studio-attach-0')).toBeTruthy();
  });
});
