import { describe, expect, it, jest } from '@jest/globals';
import { render, screen, type RenderResult } from '@testing-library/react-native';
import { type ReactElement, type ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { SupportConversationScreen } from '@/features/SupportConversationScreen';
import { SupportInboxScreen } from '@/features/SupportInboxScreen';
import { en, fa } from '@/labels';
import {
  supportAssignees,
  supportCannedReplies,
  supportConversationSeeds,
} from '@/mock/support';
import { supportService } from '@/services/supportService';
import { SystemProvider } from '@/system';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: () => {}, replace: () => {}, back: () => {}, canGoBack: () => false }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/support',
}));

const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 1280, height: 900 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function renderWithProviders(ui: ReactElement): RenderResult {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SafeAreaProvider initialMetrics={metrics}>
        <SystemProvider>{children}</SystemProvider>
      </SafeAreaProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}

describe('supportService', () => {
  it('returns an overview with KPIs derived from the mock data', async () => {
    const o = await supportService.getSupportOverview();
    expect(o.open).toBeGreaterThan(0);
    expect(o.urgent).toBeGreaterThanOrEqual(1);
    expect(o.unassigned).toBeGreaterThanOrEqual(1);
    expect(o.resolvedThisWeek).toBeGreaterThanOrEqual(1);
  });

  it('lists conversations with a built customer context', async () => {
    const list = await supportService.listSupportConversations();
    expect(list.length).toBe(supportConversationSeeds.length);
    const sync = list.find((c) => c.id === 'sc_sync_northwind');
    expect(sync?.context.tenantName).toBe('Northwind Outfitters');
    expect(sync?.context.openWorkflowTasks).toBeGreaterThanOrEqual(1);
    expect(sync?.linkedWorkflows.length).toBeGreaterThanOrEqual(1);
    expect(sync?.relatedSignals.length).toBeGreaterThanOrEqual(1);
  });

  it('gets a conversation by id and rejects unknown ids', async () => {
    const c = await supportService.getSupportConversation('sc_security_saffron');
    expect(c.subject).toContain('Signature');
    expect(c.context.signedSync).toBe('invalid');
    expect(c.messages.length).toBeGreaterThan(0);
    await expect(supportService.getSupportConversation('nope')).rejects.toThrow();
  });

  it('mock actions return safe acknowledgements (no persistence)', async () => {
    const r = await supportService.markConversationResolvedMock('sc_media_lumen');
    expect(r.ok).toBe(true);
    expect(r.conversationId).toBe('sc_media_lumen');
  });
});

describe('support mock data is frontend-safe', () => {
  it('contains no secrets, emails, or phone-like numbers', () => {
    const blob = JSON.stringify([supportConversationSeeds, supportAssignees, supportCannedReplies]);
    expect(blob).not.toMatch(
      /sk_live|sk_test|whsec_|consumer_secret|consumer_key|signing[_-]?secret|app(lication)?[_-]?password/i,
    );
    // No email addresses at all in support fixtures (labels only).
    expect(blob).not.toMatch(/@/);
    // No phone-like number sequences.
    expect(blob).not.toMatch(/\+?\d[\d\s().-]{7,}\d/);
  });
});

describe('admin labels parity', () => {
  it('fa contains every en key', () => {
    const enKeys = Object.keys(en).sort();
    const faKeys = Object.keys(fa).sort();
    expect(faKeys).toEqual(enKeys);
  });
});

describe('support screens', () => {
  it('inbox renders KPI + conversation list', async () => {
    renderWithProviders(<SupportInboxScreen />);
    expect(await screen.findByTestId('support-inbox-screen', {}, { timeout: 4000 })).toBeTruthy();
    expect(
      await screen.findByText('Plugin sync failing — orders not updating', {}, { timeout: 4000 }),
    ).toBeTruthy();
  });

  it('conversation detail renders context and messages', async () => {
    renderWithProviders(<SupportConversationScreen conversationId="sc_sync_northwind" />);
    expect(
      await screen.findByTestId('support-conversation-screen', {}, { timeout: 4000 }),
    ).toBeTruthy();
    // Customer context panel shows the tenant.
    expect(await screen.findByText('Northwind Outfitters', {}, { timeout: 4000 })).toBeTruthy();
    // A message body is rendered.
    expect(
      await screen.findByText(/Our store data looks stale/i, {}, { timeout: 4000 }),
    ).toBeTruthy();
  });
});
