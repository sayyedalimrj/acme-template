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

export function shadow(tokens: ThemeTokens, level: ElevationLevel): ViewStyle {
  const e = tokens.elevation[level];
  if (level === 'none' || e.elevation === 0) {
    return {};
  }

  if (Platform.OS === 'web') {
    // rgba alpha derived from the level opacity; color from the theme shadow color.
    return {
      // boxShadow is a valid style on react-native-web.
      boxShadow: `0px ${e.offsetY}px ${e.shadowRadius}px rgba(16,24,40,${e.shadowOpacity})`,
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
