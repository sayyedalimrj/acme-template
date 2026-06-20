/**
 * Quick-access label fitting (PR #57 Task 2).
 *
 * `adjustsFontSizeToFit` is a no-op on react-native-web. Labels must stay on ONE line (adaptive
 * font, ellipsis as last resort) — never wrap to a second line.
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
  it('keeps the Persian label on a single line (never wraps to two)', () => {
    const { getByText } = wrap(
      <QuickActionCard icon="cube-outline" label="پرداخت‌ها" onPress={jest.fn()} />,
    );
    const label = getByText('پرداخت‌ها');
    expect(label).toBeTruthy();
    expect(label.props.numberOfLines).toBe(1);
  });
});
