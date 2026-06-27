/**
 * StoreSettingsScreen — verifies the safe store-edit surface:
 *  - renders the real connection status (mode, last sync, last error) from the backend,
 *  - NEVER shows a stored secret (only a masked placeholder),
 *  - saving calls the backend settings-update endpoint with the edited name/url,
 *  - re-testing requires re-entered credentials and calls the verify endpoint.
 *
 * `@/config/api.config` and `@/services/connectionApi` are mocked so no network is touched.
 */
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

import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';
import type {
  SiteStatusResult,
  SiteStatusSite,
  VerifyWooResult,
} from '@/services/connectionApi';

import { StoreSettingsScreen } from '@/features/site/StoreSettingsScreen';

jest.mock('@/config/api.config', () => ({
  isApiConfigured: () => true,
  getApiBaseUrl: () => 'https://api.example',
}));

// Stub Expo Router navigation hooks so the Screen header renders outside a navigator.
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/store-settings/site-1',
}));

// Typed mocks (function-type generic so mockResolvedValue is correctly typed under @jest/globals;
// `mock`-prefixed so the hoisted jest.mock factory may legally reference them).
const mockGetSiteStatus = jest.fn<(siteId: string) => Promise<SiteStatusResult>>();
const mockUpdateSiteSettings =
  jest.fn<(siteId: string, input: { name?: string; url?: string }) => Promise<{ site: SiteStatusSite }>>();
const mockVerifyWooConnection =
  jest.fn<(siteId: string, consumerKey: string, consumerSecret: string) => Promise<VerifyWooResult>>();

jest.mock('@/services/connectionApi', () => ({
  getSiteStatus: (...a: [string]) => mockGetSiteStatus(...a),
  updateSiteSettings: (...a: [string, { name?: string; url?: string }]) => mockUpdateSiteSettings(...a),
  verifyWooConnection: (...a: [string, string, string]) => mockVerifyWooConnection(...a),
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

const restStatus = {
  site: {
    id: 'site-1',
    name: 'فروشگاه بادبان',
    url: 'https://shop.example',
    connection_mode: 'woo_rest' as const,
    status: 'connected',
    currency: 'IRT',
    woo_version: '9.0',
    wp_version: '6.5',
    last_synced_at: '2026-06-20T10:00:00.000Z',
    last_error: null,
  },
  plugin: null,
  lastSync: {
    status: 'success',
    stats: { products: 12 },
    error: null,
    started_at: '2026-06-20T09:59:00.000Z',
    finished_at: '2026-06-20T10:00:00.000Z',
  },
};

beforeEach(() => {
  mockGetSiteStatus.mockReset();
  mockUpdateSiteSettings.mockReset();
  mockVerifyWooConnection.mockReset();
  mockGetSiteStatus.mockResolvedValue(restStatus);
  mockUpdateSiteSettings.mockResolvedValue({ site: { ...restStatus.site } });
  mockVerifyWooConnection.mockResolvedValue({
    site: { id: 'site-1', status: 'connected', currency: 'IRT' },
  });
});

describe('StoreSettingsScreen', () => {
  it('renders the real connection status and never shows a stored secret', async () => {
    renderWithProviders(<StoreSettingsScreen siteId="site-1" />);
    // Seeded name comes from the backend status.
    await waitFor(() => expect(screen.getByTestId('store-settings-name').props.value).toBe('فروشگاه بادبان'));
    // The stored secret is masked, never rendered in plaintext.
    expect(screen.getByText('••••••')).toBeTruthy();
    // The advanced credential fields start EMPTY (re-entry required to change).
    expect(screen.getByTestId('store-settings-ck').props.value).toBe('');
    expect(screen.getByTestId('store-settings-cs').props.value).toBe('');
  });

  it('saves edited store details through the backend settings endpoint', async () => {
    renderWithProviders(<StoreSettingsScreen siteId="site-1" />);
    await screen.findByTestId('store-settings-name');
    fireEvent.changeText(screen.getByTestId('store-settings-name'), 'نام جدید');
    fireEvent.press(screen.getByTestId('store-settings-save'));
    await waitFor(() =>
      expect(mockUpdateSiteSettings).toHaveBeenCalledWith('site-1', {
        name: 'نام جدید',
        url: 'https://shop.example',
      }),
    );
  });

  it('re-tests the connection only after credentials are re-entered', async () => {
    renderWithProviders(<StoreSettingsScreen siteId="site-1" />);
    await screen.findByTestId('store-settings-retest');

    // No credentials → does not call the verify endpoint.
    fireEvent.press(screen.getByTestId('store-settings-retest'));
    expect(mockVerifyWooConnection).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('store-settings-ck'), 'ck_new');
    fireEvent.changeText(screen.getByTestId('store-settings-cs'), 'cs_new');
    fireEvent.press(screen.getByTestId('store-settings-retest'));
    await waitFor(() =>
      expect(mockVerifyWooConnection).toHaveBeenCalledWith('site-1', 'ck_new', 'cs_new'),
    );
  });
});
