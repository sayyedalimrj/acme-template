import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Card } from '@/components/ui';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('Card', () => {
  it('renders its children', () => {
    renderWithProviders(
      <Card>
        <Text>Inner content</Text>
      </Card>,
    );
    expect(screen.getByText('Inner content')).toBeTruthy();
  });

  it('renders an optional title', () => {
    renderWithProviders(
      <Card title="Recent orders">
        <Text>rows</Text>
      </Card>,
    );
    expect(screen.getByText('Recent orders')).toBeTruthy();
    expect(screen.getByText('rows')).toBeTruthy();
  });

  it('passes through a testID', () => {
    renderWithProviders(
      <Card testID="kpi-card">
        <Text>x</Text>
      </Card>,
    );
    expect(screen.getByTestId('kpi-card')).toBeTruthy();
  });
});
