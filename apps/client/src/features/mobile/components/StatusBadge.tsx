/**
 * StatusBadge — a soft, low-density status chip for the mobile UI.
 *
 * Maps a small set of tones to soft (muted) backgrounds + colored text, avoiding harsh bright
 * badges. Used for product stock and order status chips.
 */
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';

import { mobileColors, mobileType } from '../mobileTokens';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<StatusTone, { fg: string; bg: string }> = {
  success: { fg: mobileColors.statusActive, bg: mobileColors.statusActiveSoft },
  warning: { fg: mobileColors.statusAttention, bg: mobileColors.statusAttentionSoft },
  danger: { fg: mobileColors.statusDanger, bg: mobileColors.statusDangerSoft },
  info: { fg: mobileColors.primary, bg: mobileColors.primarySoft },
  neutral: { fg: mobileColors.textSecondary, bg: mobileColors.tile },
};

export interface StatusBadgeProps {
  tone: StatusTone;
  label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps): React.JSX.Element {
  const tones = TONES[tone];
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
