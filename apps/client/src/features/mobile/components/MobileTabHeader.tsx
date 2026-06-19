/**
 * MobileTabHeader — sticky title row for bottom-tab screens (home tab siblings).
 *
 * Title on the leading side; optional trailing actions + the theme toggle (moon/sun).
 */
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileMetrics, useMobileColors, useMobileType } from '../mobileTokens';

export interface MobileTabHeaderProps {
  title: string;
  /** Extra trailing controls rendered on the trailing side (e.g. add product). */
  trailing?: ReactNode;
}

export function MobileTabHeader({ title, trailing }: MobileTabHeaderProps): React.JSX.Element {
  const colors = useMobileColors();
  const type = useMobileType();
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
          fontSize: type.titleSize,
          fontWeight: type.titleWeight,
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      {trailing}
    </View>
  );
}
