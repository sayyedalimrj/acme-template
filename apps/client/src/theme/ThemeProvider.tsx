/**
 * ThemeProvider + useTheme().
 *
 * Provides the active design tokens, color mode, and layout direction to the tree. This is
 * the single public styling API for the app (design.md §9). It is intentionally built on
 * React Context (no browser globals) so it behaves identically across Web, Android, iOS.
 *
 * Dark mode and RTL are wired here as first-class concerns; richer persistence and a
 * dedicated store land in later tasks (Design-system / i18n hardening).
 */
import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { appConfig } from '@/config/app.config';

import { getTokens, type Direction, type ThemeMode, type ThemeTokens } from './tokens';

export interface ThemeContextValue {
  tokens: ThemeTokens;
  mode: ThemeMode;
  direction: Direction;
  isRTL: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setDirection: (direction: Direction) => void;
  /** Resolves a logical row direction so layouts mirror correctly under RTL. */
  rowDirection: 'row' | 'row-reverse';
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

  const value = useMemo<ThemeContextValue>(() => {
    const isRTL = direction === 'rtl';
    return {
      tokens: getTokens(mode),
      mode,
      direction,
      isRTL,
      setMode,
      toggleMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
      setDirection,
      rowDirection: isRTL ? 'row-reverse' : 'row',
    };
  }, [mode, direction]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
