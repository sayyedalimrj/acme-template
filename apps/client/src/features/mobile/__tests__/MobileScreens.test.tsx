import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { resetAdaptersForTests } from '@/adapters';
import { MobileHomeScreen } from '@/features/mobile/MobileHomeScreen';
import { MoreFeaturesScreen } from '@/features/mobile/MoreFeaturesScreen';
import { NotificationsShellScreen } from '@/features/mobile/NotificationsShellScreen';
import { SupportShellScreen } from '@/features/mobile/SupportShellScreen';
import { BottomNav } from '@/features/mobile/components';
import { siteInitials } from '@/features/mobile/components/HeroSiteCard';
import { I18nProvider } from '@/i18n/I18nProvider';
import { FontProvider, ThemeProvider } from '@/theme';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    navigate: () => {},
    back: () => {},
    canGoBack: () => false,
    push: () => {},
  }),
  usePathname: () => '/',
  useLocalSearchParams: () => ({}),
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderMobile(ui: ReactElement): RenderResult {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <QueryClientProvider client={client}>
          <ThemeProvider>
            <FontProvider>
              <I18nProvider locale="en">{children}</I18nProvider>
            </FontProvider>
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

describe('siteInitials', () => {
  it('builds two-letter initials from a store name', () => {
    expect(siteInitials('Northwind Goods')).toBe('NG');
    expect(siteInitials('Atelier')).toBe('AT');
    expect(siteInitials('')).toBe('•');
  });
});

describe('MobileHomeScreen', () => {
  it('renders the four quick actions and the more entry', async () => {
    renderMobile(<MobileHomeScreen />);
    expect(await screen.findByTestId('quick-products')).toBeTruthy();
    expect(screen.getByTestId('quick-orders')).toBeTruthy();
    expect(screen.getByTestId('quick-customers')).toBeTruthy();
    expect(screen.getByTestId('quick-payments')).toBeTruthy();
    expect(screen.getByTestId('home-more-entry')).toBeTruthy();
    // Recent activity uses customer-friendly copy.
    expect(screen.getByText('Recent activity')).toBeTruthy();
  });
});

describe('MoreFeaturesScreen', () => {
  it('renders grouped feature cards with customer-friendly sections', () => {
    renderMobile(<MoreFeaturesScreen />);
    expect(screen.getByTestId('more-screen')).toBeTruthy();
    expect(screen.getByText('Manage')).toBeTruthy();
    expect(screen.getByText('Grow sales')).toBeTruthy();
    expect(screen.getByText('My site')).toBeTruthy();
    expect(screen.getByTestId('feature-manage-products')).toBeTruthy();
    expect(screen.getByTestId('feature-support-chat')).toBeTruthy();
  });
});

describe('Support & Notifications shells', () => {
  it('renders the support shell with chat + new request actions', () => {
    renderMobile(<SupportShellScreen />);
    expect(screen.getByTestId('support-screen')).toBeTruthy();
    expect(screen.getByTestId('support-chat')).toBeTruthy();
    expect(screen.getByTestId('support-new-request')).toBeTruthy();
  });

  it('renders the notifications shell grouped by topic', () => {
    renderMobile(<NotificationsShellScreen />);
    expect(screen.getByTestId('notifications-screen')).toBeTruthy();
    expect(screen.getByTestId('notif-n_order_1')).toBeTruthy();
  });
});

describe('BottomNav', () => {
  it('renders four tabs', () => {
    renderMobile(<BottomNav />);
    expect(screen.getByTestId('tab-home')).toBeTruthy();
    expect(screen.getByTestId('tab-orders')).toBeTruthy();
    expect(screen.getByTestId('tab-products')).toBeTruthy();
    expect(screen.getByTestId('tab-more')).toBeTruthy();
  });
});
