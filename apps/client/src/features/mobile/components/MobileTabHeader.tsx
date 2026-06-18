/**
 * MobileTabHeader — sticky title row for bottom-tab screens (home tab siblings).
 *
 * Title on the leading side; optional trailing actions + the theme toggle (moon/sun).
 */
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { useTheme } from '@/theme';

import { mobileMetrics, mobileType, useMobileColors } from '../mobileTokens';

export interface MobileTabHeaderProps {
  title: string;
  /** Extra trailing controls rendered before the theme toggle (e.g. add product). */
  trailing?: ReactNode;
}

export function MobileTabHeader({ title, trailing }: MobileTabHeaderProps): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, isRTL } = useTheme();

  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 10,
        minHeight: mobileMetrics.headerHeight,
        paddingHorizontal: mobileMetrics.screenPadding,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: mobileType.titleSize,
          fontWeight: mobileType.titleWeight,
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {trailing}
      <ThemeToggleButton />
    </View>
  );
}
