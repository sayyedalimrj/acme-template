/**
 * Elevation helper.
 *
 * Converts a semantic elevation level into a platform-correct shadow style:
 *  - Web: a CSS `boxShadow` string (React Native Web understands this).
 *  - Native (iOS/Android): `shadow*` props + Android `elevation`.
 *
 * Centralizing this keeps shadows consistent and avoids per-component Platform.select.
 */
import { Platform, type ViewStyle } from 'react-native';

import type { ThemeTokens, ElevationLevel } from './tokens';

/** Parse a `#rrggbb` (or `#rgb`) hex color into an `r, g, b` triplet for rgba() shadows. */
function hexToRgbTriplet(hex: string): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function shadow(tokens: ThemeTokens, level: ElevationLevel): ViewStyle {
  const e = tokens.elevation[level];
  if (level === 'none' || e.elevation === 0) {
    return {};
  }

  if (Platform.OS === 'web') {
    // Soft, theme-colored shadow: color from the active theme shadow color, alpha from the
    // elevation level. boxShadow is a valid style on react-native-web.
    const rgb = hexToRgbTriplet(tokens.shadowColor);
    return {
      boxShadow: `0px ${e.offsetY}px ${e.shadowRadius}px rgba(${rgb}, ${e.shadowOpacity})`,
    } as unknown as ViewStyle;
  }

  return {
    shadowColor: tokens.shadowColor,
    shadowOpacity: e.shadowOpacity,
    shadowRadius: e.shadowRadius,
    shadowOffset: { width: 0, height: e.offsetY },
    elevation: e.elevation,
  };
}
