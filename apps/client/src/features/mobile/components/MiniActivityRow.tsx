/**
 * MiniActivityRow — a compact activity / list row.
 *
 * Tinted icon chip + title + caption + optional chevron. Press feedback when interactive.
 * Used by the short home activity section and the notifications/support shells.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileColors, mobileMetrics, mobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export type ActivityTint = 'primary' | 'success' | 'attention' | 'muted';

const TINTS: Record<ActivityTint, { fg: string; bg: string }> = {
  primary: { fg: mobileColors.primary, bg: mobileColors.tile },
  success: { fg: mobileColors.statusActive, bg: mobileColors.statusActiveSoft },
  attention: { fg: mobileColors.statusAttention, bg: mobileColors.statusAttentionSoft },
  muted: { fg: mobileColors.muted, bg: mobileColors.tile },
};

export interface MiniActivityRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  caption?: string;
  tint?: ActivityTint;
  onPress?: () => void;
  unread?: boolean;
  testID?: string;
}

export function MiniActivityRow({
  icon,
  title,
  caption,
  tint = 'primary',
  onPress,
  unread = false,
  testID,
}: MiniActivityRowProps): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();
  const tones = TINTS[tint];

  const body = (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 12,
        minHeight: mobileMetrics.listRowHeight,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: tones.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={tones.fg} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{
            fontSize: mobileType.labelSize,
            fontWeight: '600',
            color: mobileColors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {caption ? (
          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: mobileColors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {caption}
          </Text>
        ) : null}
      </View>
      {unread ? (
        <View
          style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: mobileColors.badge }}
        />
      ) : onPress ? (
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={16}
          color={mobileColors.mutedSoft}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return <View testID={testID}>{body}</View>;
  }
  return (
    <PressableScale onPress={onPress} accessibilityLabel={title} testID={testID} pressScale={0.99}>
      {body}
    </PressableScale>
  );
}
