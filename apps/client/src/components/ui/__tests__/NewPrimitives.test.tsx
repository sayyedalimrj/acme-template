import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import {
  ChartCard,
  DataListRow,
  HealthScoreBadge,
  MetricCard,
  MiniBars,
  MockActionButton,
  SectionHeader,
  StatusBadge,
  TrendPill,
  healthBand,
} from '@/components/ui';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('UI excellence primitives', () => {
  describe('TrendPill', () => {
    it('renders the change label with a direction symbol', () => {
      renderWithProviders(<TrendPill direction="up" label="+12.4%" />);
      expect(screen.getByText('▲ +12.4%')).toBeTruthy();
    });

    it('renders all directions without crashing', () => {
      (['up', 'down', 'flat'] as const).forEach((direction) => {
        const { unmount } = renderWithProviders(<TrendPill direction={direction} />);
        unmount();
      });
    });
  });

  describe('StatusBadge', () => {
    it('renders its label', () => {
      renderWithProviders(<StatusBadge label="Connected" tone="success" />);
      expect(screen.getByText('Connected')).toBeTruthy();
    });
  });

  describe('HealthScoreBadge', () => {
    const labels = { healthy: 'Healthy', degraded: 'Degraded', critical: 'Critical' };

    it('maps scores to the correct severity band', () => {
      expect(healthBand(95)).toBe('healthy');
      expect(healthBand(80)).toBe('healthy');
      expect(healthBand(65)).toBe('degraded');
      expect(healthBand(50)).toBe('degraded');
      expect(healthBand(20)).toBe('critical');
      expect(healthBand(-5)).toBe('critical');
      expect(healthBand(150)).toBe('healthy');
    });

    it('renders the band label with the clamped score', () => {
      renderWithProviders(<HealthScoreBadge score={92} labels={labels} />);
      expect(screen.getByText('Healthy · 92')).toBeTruthy();
    });

    it('shows the critical label for a low score', () => {
      renderWithProviders(<HealthScoreBadge score={12} labels={labels} />);
      expect(screen.getByText('Critical · 12')).toBeTruthy();
    });
  });

  describe('MockActionButton', () => {
    it('renders a disabled action with its note', () => {
      renderWithProviders(<MockActionButton label="Run sync" note="Mock" />);
      expect(screen.getByText('Run sync')).toBeTruthy();
      expect(screen.getByText('Mock')).toBeTruthy();
    });
  });

  describe('MetricCard', () => {
    it('renders label, value and an optional trend', () => {
      renderWithProviders(
        <MetricCard label="Sales" value="$1,200" icon="cash-outline" trend="up" trendLabel="+8%" />,
      );
      expect(screen.getByText('Sales')).toBeTruthy();
      expect(screen.getByText('$1,200')).toBeTruthy();
      expect(screen.getByText('▲ +8%')).toBeTruthy();
    });

    it('invokes onPress when pressable', () => {
      const onPress = jest.fn();
      renderWithProviders(
        <MetricCard label="Orders" value="42" icon="receipt-outline" onPress={onPress} />,
      );
      fireEvent.press(screen.getByLabelText('Orders'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('SectionHeader', () => {
    it('renders the label and caption', () => {
      renderWithProviders(<SectionHeader label="Store Operations" caption="7 tools" />);
      expect(screen.getByText('Store Operations')).toBeTruthy();
      expect(screen.getByText('7 tools')).toBeTruthy();
    });
  });

  describe('ChartCard', () => {
    it('renders title, subtitle, legend and body', () => {
      renderWithProviders(
        <ChartCard
          title="Sales trend"
          subtitle="Last 30 days"
          legend={[{ label: 'Sales', color: '#000' }]}
        >
          <MiniBars
            data={[
              { label: 'Mon', value: 10 },
              { label: 'Tue', value: 20, highlight: true },
            ]}
          />
        </ChartCard>,
      );
      expect(screen.getByText('Sales trend')).toBeTruthy();
      expect(screen.getByText('Last 30 days')).toBeTruthy();
      expect(screen.getByText('Sales')).toBeTruthy();
      expect(screen.getByText('Mon')).toBeTruthy();
      expect(screen.getByText('Tue')).toBeTruthy();
    });
  });

  describe('DataListRow', () => {
    it('renders title/subtitle and responds to press', () => {
      const onPress = jest.fn();
      renderWithProviders(
        <DataListRow title="فروشگاه بادبان" subtitle="store.example.com" onPress={onPress} />,
      );
      expect(screen.getByText('فروشگاه بادبان')).toBeTruthy();
      expect(screen.getByText('store.example.com')).toBeTruthy();
      fireEvent.press(screen.getByLabelText('فروشگاه بادبان'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
