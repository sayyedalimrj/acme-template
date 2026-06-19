/**
 * MobileSubHeader — header for secondary mobile screens.
 *
 * A circular soft back button (direction-aware) plus a title, with an optional trailing slot.
 * Used by the More / Support / Notifications shells.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileMetrics, mobileType, useMobileColors } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface MobileSubHeaderProps {
  title: string;
  onBack: () => void;
  backLabel: string;
  trailing?: ReactNode;
}

export function MobileSubHeader({
  title,
  onBack,
  backLabel,
  trailing,
}: MobileSubHeaderProps): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, directional, isRTL } = useTheme();

  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 12,
        minHeight: mobileMetrics.headerHeight,
        paddingHorizontal: mobileMetrics.screenPadding,
      }}
    >
      <PressableScale
        onPress={onBack}
        accessibilityLabel={backLabel}
        testID="mobile-back"
        style={{
          width: mobileMetrics.headerButton,
          height: mobileMetrics.headerButton,
          borderRadius: mobileMetrics.headerButton / 2,
          backgroundColor: colors.tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name={directional('chevron-back', 'chevron-forward')}
          size={22}
          color={colors.text}
        />
      </PressableScale>

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

      {trailing ?? null}
    </View>
  );
}
