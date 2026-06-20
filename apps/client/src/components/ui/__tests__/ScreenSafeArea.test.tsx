/**
 * Screen bottom-padding regression (P0.1): the scroll content must NOT re-add the bottom
 * safe-area inset. The fixed bottom tab bar is the single owner of that inset, so duplicating it
 * here is what produced the large blank/gray gap below the tab bar. With a non-zero bottom inset
 * the content's paddingBottom must equal its base padding (no inset added).
 */
import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui/Screen';
import { ThemeProvider } from '@/theme';

// A real device bottom inset (home indicator) — the case that used to be double-counted.
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

describe('Screen safe-area (no duplicated bottom inset)', () => {
  it('does not add insets.bottom to the scroll content padding', () => {
    render(
      <SafeAreaProvider initialMetrics={metrics}>
        <ThemeProvider>
          <Screen testID="screen-under-test">
            <Text>content</Text>
          </Screen>
        </ThemeProvider>
      </SafeAreaProvider>,
    );

    const scroll = screen.UNSAFE_getByType(ScrollView);
    const flat = StyleSheet.flatten(scroll.props.contentContainerStyle) as {
      padding?: number;
      paddingBottom?: number;
    };

    // Base padding is applied, and paddingBottom equals it (NOT padding + 34).
    expect(typeof flat.padding).toBe('number');
    expect(flat.paddingBottom).toBe(flat.padding);
    // Hard guard: the 34px inset must not have leaked into the bottom padding.
    expect(flat.paddingBottom).toBeLessThan((flat.padding ?? 0) + 34);
  });
});
