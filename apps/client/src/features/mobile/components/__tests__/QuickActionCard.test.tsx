/**
 * Quick-access label clipping fix (PR #57 Task 1).
 *
 * `adjustsFontSizeToFit` is a no-op on react-native-web, so a single-line label truncated long
 * Persian text on narrow widths. The label now wraps to two lines inside the fixed-height card.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { type ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { QuickActionCard } from '../QuickActionCard';

function wrap(ui: ReactNode) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('QuickActionCard label', () => {
  it('renders the full Persian label and allows two lines (no single-line truncation)', () => {
    const { getByText } = wrap(
      <QuickActionCard icon="cube-outline" label="پرداخت‌ها" onPress={jest.fn()} />,
    );
    const label = getByText('پرداخت‌ها');
    expect(label).toBeTruthy();
    expect(label.props.numberOfLines).toBe(2);
  });
});
