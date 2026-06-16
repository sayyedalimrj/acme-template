import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { EmptyState } from '@/components/ui';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('EmptyState', () => {
  it('renders title and body', () => {
    renderWithProviders(<EmptyState title="No orders yet" body="They will appear here." />);
    expect(screen.getByText('No orders yet')).toBeTruthy();
    expect(screen.getByText('They will appear here.')).toBeTruthy();
  });

  it('renders an action and fires it when pressed', () => {
    const onPress = jest.fn();
    renderWithProviders(<EmptyState title="Empty" action={{ label: 'Refresh', onPress }} />);
    const action = screen.getByText('Refresh');
    expect(action).toBeTruthy();
    fireEvent.press(action);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render an action when none is provided', () => {
    renderWithProviders(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
