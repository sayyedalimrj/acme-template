/**
 * ThemeProvider + useTheme().
 *
 * The single public styling API for the app (design.md §9). It provides the active design
 * tokens, color mode, layout direction, and direction-aware helpers. It is built on React
 * Context with React Native primitives only — no browser globals, no `localStorage`, no DOM
 * APIs — so it behaves identically on Web, Android, and iOS.
 *
 * Persistence note: the chosen mode/direction are kept in memory for now. Persisting the
 * user's preference requires a cross-platform secure/async storage layer (AsyncStorage /
 * expo-secure-store) and is intentionally left as a TODO for the settings/i18n tasks. We do
 * NOT use `localStorage` (web-only) here.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ViewStyle } from 'react-native';

import { appConfig } from '@/config/app.config';

import { shadow } from './elevation';
import { directionalValue, resolveRowDirection } from './rtl';
import {
  getTokens,
  type Direction,
  type ElevationLevel,
  type ThemeMode,
  type ThemeTokens,
} from './tokens';

export interface ThemeContextValue {
  /** Active, fully-resolved design tokens for the current mode. */
  tokens: ThemeTokens;
  /** Current color mode. */
  mode: ThemeMode;
  /** Current layout direction. */
  direction: Direction;
  /** Convenience flag, true when direction is 'rtl'. */
  isRTL: boolean;
  /** Set the color mode explicitly. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between light and dark. */
  toggleMode: () => void;
  /** Set the layout direction explicitly. */
  setDirection: (direction: Direction) => void;
  /** Toggle between ltr and rtl. */
  toggleDirection: () => void;
  /** Logical row direction ('row' | 'row-reverse') for the current direction. */
  rowDirection: 'row' | 'row-reverse';
  /** Returns the ltr value in LTR and the rtl value in RTL, bound to current direction. */
  directional: <T>(ltrValue: T, rtlValue: T) => T;
  /** Platform-correct shadow style for an elevation level, bound to current tokens. */
  shadow: (level: ElevationLevel) => ViewStyle;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
  initialDirection?: Direction;
}

export function ThemeProvider({
  children,
  initialMode = 'light',
  initialDirection = appConfig.defaultDirection,
}: ThemeProviderProps): React.JSX.Element {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [direction, setDirection] = useState<Direction>(initialDirection);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const toggleDirection = useCallback(() => {
    setDirection((prev) => (prev === 'ltr' ? 'rtl' : 'ltr'));
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const tokens = getTokens(mode);
    return {
      tokens,
      mode,
      direction,
      isRTL: direction === 'rtl',
      setMode,
      toggleMode,
      setDirection,
      toggleDirection,
      rowDirection: resolveRowDirection(direction),
      directional: <T,>(ltrValue: T, rtlValue: T) =>
        directionalValue(direction, ltrValue, rtlValue),
      shadow: (level: ElevationLevel) => shadow(tokens, level),
    };
  }, [mode, direction, toggleMode, toggleDirection]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
