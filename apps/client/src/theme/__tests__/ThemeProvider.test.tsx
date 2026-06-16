import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text } from 'react-native';

import { darkTokens, lightTokens, ThemeProvider, useTheme } from '@/theme';

function Probe(): React.JSX.Element {
  const { tokens, mode, direction, rowDirection, toggleMode, toggleDirection, directional } =
    useTheme();
  return (
    <>
      <Text testID="mode">{mode}</Text>
      <Text testID="bg">{tokens.color.background}</Text>
      <Text testID="direction">{direction}</Text>
      <Text testID="rowDirection">{rowDirection}</Text>
      <Text testID="directional">{directional('start', 'end')}</Text>
      <Pressable testID="toggleMode" onPress={toggleMode}>
        <Text>toggle mode</Text>
      </Pressable>
      <Pressable testID="toggleDir" onPress={toggleDirection}>
        <Text>toggle dir</Text>
      </Pressable>
    </>
  );
}

describe('ThemeProvider', () => {
  it('provides light tokens by default', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('bg').props.children).toBe(lightTokens.color.background);
  });

  it('provides dark tokens when initialMode is dark', () => {
    render(
      <ThemeProvider initialMode="dark">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg').props.children).toBe(darkTokens.color.background);
  });

  it('toggles between light and dark tokens', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('bg').props.children).toBe(lightTokens.color.background);
    fireEvent.press(screen.getByTestId('toggleMode'));
    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('bg').props.children).toBe(darkTokens.color.background);
  });

  it('exposes RTL-aware direction helpers that flip on toggle', () => {
    render(
      <ThemeProvider initialDirection="ltr">
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('rowDirection').props.children).toBe('row');
    expect(screen.getByTestId('directional').props.children).toBe('start');

    fireEvent.press(screen.getByTestId('toggleDir'));

    expect(screen.getByTestId('direction').props.children).toBe('rtl');
    expect(screen.getByTestId('rowDirection').props.children).toBe('row-reverse');
    expect(screen.getByTestId('directional').props.children).toBe('end');
  });

  it('throws when useTheme is used outside a provider', () => {
    // Silence the expected React error log for this assertion.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    function Bare(): React.JSX.Element {
      useTheme();
      return <Text>x</Text>;
    }
    expect(() => render(<Bare />)).toThrow(/useTheme must be used within a ThemeProvider/);
    spy.mockRestore();
  });
});
