/**
 * MobileButton — the standard mobile CTA button.
 *
 * One consistent button used across the mobile screens (primary / secondary / ghost), with a
 * consistent height + radius (from the spec), soft press feedback, and an optional leading
 * icon. Avoids the slightly different ad-hoc button styles scattered across screens. RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { MOBILE_FONT_FAMILY } from '../mobileUxSpec';
import { mobileColors, mobileMetrics } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export type MobileButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface MobileButtonProps {
  label: string;
  onPress: () => void;
  variant?: MobileButtonVariant;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  /** Compact height (44) instead of the full 56. */
  compact?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

export function MobileButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled = false,
  compact = false,
  testID,
  accessibilityLabel,
}: MobileButtonProps): React.JSX.Element {
  const { rowDirection } = useTheme();

  const bg =
    variant === 'primary'
      ? mobileColors.primary
      : variant === 'secondary'
        ? mobileColors.primarySoft
        : 'transparent';
  const fg =
    variant === 'primary'
      ? mobileColors.onPrimary
      : variant === 'ghost'
        ? mobileColors.textSecondary
        : mobileColors.primary;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: compact ? 46 : mobileMetrics.buttonHeight,
        borderRadius: mobileMetrics.buttonRadius,
        paddingHorizontal: 18,
        backgroundColor: bg,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 15, fontFamily: MOBILE_FONT_FAMILY }}>
        {label}
      </Text>
    </PressableScale>
  );
}
