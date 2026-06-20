import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { AutomationScreen } from '@/features/automation/AutomationScreen';
import { I18nProvider } from '@/i18n/I18nProvider';
import { ThemeProvider } from '@/theme';
import type { CampaignDraft } from '@/domain/types';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, back: () => {}, canGoBack: () => false }),
  usePathname: () => '/automations',
}));

const mockOverviewFixture = {
  providerStatus: 'not_connected' as const,
  readiness: {
    smsProvider: 'not_connected' as const,
    kavenegar: 'later' as const,
    twilio: 'later' as const,
    email: 'later' as const,
    consentModel: 'planned' as const,
    optOutHandling: 'planned' as const,
  },
  consent: {
    consentModel: 'planned' as const,
    optOutHandling: 'planned' as const,
    collectedOptIns: 0,
    note: 'mock',
  },
  subscriptions: [
    {
      id: 'bss_test',
      productId: 'prod_1001',
      productName: 'Test product',
      sku: 'SKU-1',
      stockStatus: 'ناموجود',
      interestedShoppers: 1,
      consent: 'pending' as const,
      maskedExample: '09xx *** 1234',
      suggestedMessage: 'test',
    },
  ],
  rules: [
    {
      id: 'rule_test',
      ruleType: 'back_in_stock_alert' as const,
      channel: 'sms' as const,
      trigger: 'test',
      status: 'mock' as const,
    },
  ],
  safetyNotices: [],
};

const mockCampaignDrafts: CampaignDraft[] = [
  {
    id: 'cd_bis',
    ruleType: 'back_in_stock_alert',
    title: 'اعلام موجودی مجدد',
    reason: 'test',
    channel: 'sms',
    audience: {
      label: 'test',
      size: 1,
      channel: 'sms',
      consentReadiness: 'pending',
    },
    messagePreview: 'test',
    readiness: 'ready',
    status: 'suggested',
  },
];

function mockSuccessQuery<T>(data: T): UseQueryResult<T, Error> {
  return {
    data,
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    status: 'success',
  } as unknown as UseQueryResult<T, Error>;
}

function mockIdleMutation<TData, TVariables>(): UseMutationResult<TData, Error, TVariables> {
  return {
    mutate: jest.fn(),
    isPending: false,
  } as unknown as UseMutationResult<TData, Error, TVariables>;
}

jest.mock('@/features/automation/useAutomation', () => ({
  useAutomationOverview: () => mockSuccessQuery(mockOverviewFixture),
  useCampaignDrafts: () => mockSuccessQuery(mockCampaignDrafts),
}));

jest.mock('@/features/automation/useAutomationMutations', () => ({
  useCreateBackInStockDraft: () => mockIdleMutation<CampaignDraft, string>(),
  useMarkDraftReviewed: () => mockIdleMutation<CampaignDraft[], string>(),
  useApproveDraft: () => mockIdleMutation<CampaignDraft[], string>(),
  useDismissDraft: () => mockIdleMutation<CampaignDraft[], string>(),
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
  jest.clearAllMocks();
});

describe('AutomationScreen', () => {
  it('renders the simplified status and at least one campaign draft', () => {
    renderWithProviders(<AutomationScreen />);
    expect(screen.getByTestId('automation-screen')).toBeTruthy();
    expect(screen.getByText('وضعیت اتوماسیون')).toBeTruthy();
    expect(screen.getAllByText('اعلام موجودی مجدد').length).toBeGreaterThan(0);
  });
});
