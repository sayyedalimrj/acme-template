/**
 * Status bar style bound to the active theme mode.
 */
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { useTheme } from './ThemeProvider';

export function ThemedStatusBar(): React.JSX.Element {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}
