import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';

import { ErrorState } from '@/components/ui';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('ErrorState', () => {
  it('renders title and body', () => {
    renderWithProviders(
      <ErrorState title="Could not load data" body="Please try again in a moment." />,
    );
    expect(screen.getByText('Could not load data')).toBeTruthy();
    expect(screen.getByText('Please try again in a moment.')).toBeTruthy();
  });

  it('renders a retry action and calls onRetry when pressed', () => {
    const onRetry = jest.fn();
    renderWithProviders(<ErrorState title="Error" retryLabel="Try again" onRetry={onRetry} />);
    const retry = screen.getByText('Try again');
    expect(retry).toBeTruthy();
    fireEvent.press(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry action when onRetry is not provided', () => {
    renderWithProviders(<ErrorState title="Error" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
