import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { Badge, type BadgeTone } from '@/components/ui';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Badge', () => {
  it('renders its label', () => {
    renderWithProviders(<Badge label="Completed" tone="success" />);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders every tone variant without crashing', () => {
    const tones: BadgeTone[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];
    tones.forEach((tone) => {
      const { unmount } = renderWithProviders(<Badge label={tone} tone={tone} />);
      expect(screen.getByText(tone)).toBeTruthy();
      unmount();
    });
  });

  it('renders correctly in dark mode', () => {
    renderWithProviders(<Badge label="Refunded" tone="danger" />, { mode: 'dark' });
    expect(screen.getByText('Refunded')).toBeTruthy();
  });
});
