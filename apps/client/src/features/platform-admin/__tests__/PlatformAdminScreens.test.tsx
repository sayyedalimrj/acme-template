import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { PlatformAdminScreen } from '@/features/platform-admin/PlatformAdminScreen';
import { PlatformTenantDetailScreen } from '@/features/platform-admin/PlatformTenantDetailScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, replace: () => {}, back: () => {}, canGoBack: () => false }),
  useLocalSearchParams: () => ({}),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 1280, height: 900 },
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

describe('PlatformAdminScreen (overview)', () => {
  it('renders KPI strip + customer-health + security sections once data loads', async () => {
    renderWithProviders(<PlatformAdminScreen />);
    expect(await screen.findByTestId('platform-admin-screen', {}, { timeout: 4000 })).toBeTruthy();
    // A customer from the health list (mock tenant name, locale-independent).
    expect(await screen.findByText('Atlas Home Goods', {}, { timeout: 4000 })).toBeTruthy();
    expect(screen.getByText('Northwind Outfitters')).toBeTruthy();
  });
});

describe('PlatformTenantDetailScreen', () => {
  it('renders the tenant profile and its site/sync health', async () => {
    renderWithProviders(<PlatformTenantDetailScreen tenantId="tn_atlas" />);
    expect(
      await screen.findByTestId('platform-tenant-detail-screen', {}, { timeout: 4000 }),
    ).toBeTruthy();
    expect(await screen.findByText('Atlas Home Goods', {}, { timeout: 4000 })).toBeTruthy();
    // A managed site for this tenant.
    expect(await screen.findByText('Atlas Home — Main', {}, { timeout: 4000 })).toBeTruthy();
  });

  it('shows a clean not-found state for an unknown tenant id', async () => {
    renderWithProviders(<PlatformTenantDetailScreen tenantId="unknown-id" />);
    expect(
      await screen.findByTestId('platform-tenant-detail-screen', {}, { timeout: 4000 }),
    ).toBeTruthy();
    // Persian default locale → assert the localized not-found title.
    expect(await screen.findByText('مشتری یافت نشد', {}, { timeout: 4000 })).toBeTruthy();
  });
});
