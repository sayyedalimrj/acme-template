/**
 * ThemeToggleButton — moon/sun control for light ↔ dark mode.
 *
 * Moon in light mode (tap → dark), sun in dark mode (tap → light). Used in mobile headers
 * and the Screen chrome header.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { mobileMetrics, useMobileColors } from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

export interface ThemeToggleButtonProps {
  /** `mobile` matches mobile icon tiles; `chrome` matches Screen header buttons. */
  variant?: 'mobile' | 'chrome';
  testID?: string;
}

export function ThemeToggleButton({
  variant = 'mobile',
  testID = 'theme-toggle',
}: ThemeToggleButtonProps): React.JSX.Element {
  const t = useT();
  const { mode, toggleMode, tokens } = useTheme();
  const colors = useMobileColors();
  const isDark = mode === 'dark';
  const label = t('settings.appearance.toggleMode');

  const size = variant === 'mobile' ? mobileMetrics.headerButton : 40;

  const style: ViewStyle =
    variant === 'mobile'
      ? {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }
      : {
          width: size,
          height: size,
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.surfaceAlt,
          alignItems: 'center',
          justifyContent: 'center',
        };

  const iconColor = variant === 'mobile' ? colors.text : tokens.color.text;
  const iconName = isDark ? 'sunny-outline' : 'moon-outline';

  return (
    <Pressable
      onPress={toggleMode}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isDark }}
      testID={testID}
      style={({ pressed }) => [style, pressed ? { opacity: 0.85 } : null]}
    >
      <Ionicons name={iconName} size={20} color={iconColor} />
    </Pressable>
  );
}
