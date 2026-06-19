/**
 * StatusBadge — a soft, low-density status chip for the mobile UI.
 *
 * Maps a small set of tones to soft (muted) backgrounds + colored text, avoiding harsh bright
 * badges. Used for product stock and order status chips.
 */
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

import { mobileType, useMobileColors, type MobileColorTokens } from '../mobileTokens';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

function statusTones(colors: MobileColorTokens): Record<StatusTone, { fg: string; bg: string }> {
  return {
    success: { fg: colors.statusActive, bg: colors.statusActiveSoft },
    warning: { fg: colors.statusAttention, bg: colors.statusAttentionSoft },
    danger: { fg: colors.statusDanger, bg: colors.statusDangerSoft },
    info: { fg: colors.primary, bg: colors.primarySoft },
    neutral: { fg: colors.textSecondary, bg: colors.tile },
  };
}

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps): React.JSX.Element {
  const colors = useMobileColors();
  const tones = statusTones(colors)[tone];
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: tones.bg,
      }}
    >
      <Text style={{ fontSize: mobileType.captionSize, fontWeight: '600', color: tones.fg }}>
        {label}
      </Text>
    </View>
  );
}
