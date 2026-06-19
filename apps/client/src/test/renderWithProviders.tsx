/**
 * Test helper: render a component wrapped in the providers it needs.
 *
 * Components in the design system call `useTheme()`, so they must be rendered inside a
 * ThemeProvider. This helper centralizes that and lets tests pick the color mode and
 * layout direction (useful for dark-mode and RTL assertions).
 */
import { render, type RenderOptions, type RenderResult } from '@testing-library/react-native';
import React, { type ReactElement, type ReactNode } from 'react';

import { FontProvider, ThemeProvider } from '@/theme';
import type { Direction, ThemeMode } from '@/theme';

export interface ProviderOptions {
  mode?: ThemeMode;
  direction?: Direction;
}

export function renderWithProviders(
  ui: ReactElement,
  { mode = 'light', direction = 'ltr', ...options }: ProviderOptions & RenderOptions = {},
): RenderResult {
  function Wrapper({ children }: { children: ReactNode }): React.JSX.Element {
    return (
      <ThemeProvider initialMode={mode} initialDirection={direction}>
        <FontProvider>{children}</FontProvider>
      </ThemeProvider>
    );
  }
  return render(ui, { wrapper: Wrapper, ...options });
}
