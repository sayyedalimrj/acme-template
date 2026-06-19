/**
 * CustomerStatusBadge — customer-friendly site status pill.
 *
 * Maps the internal site status to simple, non-technical Persian/English labels (فعال /
 * نیاز به بررسی / بدون اتصال) with a colored dot. No technical platform terms. Renders on light
 * surfaces by default and on the dark hero via the `onDark` variant.
 */
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import type { SiteStatus } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import { mobileType, useMobileColors, type MobileColorTokens } from '../mobileTokens';

interface StatusMeta {
  labelKey: StringKey;
  color: string;
  soft: string;
}

function statusMeta(colors: MobileColorTokens): Record<SiteStatus, StatusMeta> {
  return {
    connected: {
      labelKey: 'home.hero.statusActive',
      color: colors.statusActive,
      soft: colors.statusActiveSoft,
    },
    pending: {
      labelKey: 'home.hero.statusAttention',
      color: colors.statusAttention,
      soft: colors.statusAttentionSoft,
    },
    error: {
      labelKey: 'home.hero.statusAttention',
      color: colors.statusAttention,
      soft: colors.statusAttentionSoft,
    },
    disconnected: {
      labelKey: 'home.hero.statusDisconnected',
      color: colors.statusOffline,
      soft: colors.statusOfflineSoft,
    },
  };
}

export interface CustomerStatusBadgeProps {
  status: SiteStatus;
  onDark?: boolean;
}

export function CustomerStatusBadge({
  status,
  onDark = false,
}: CustomerStatusBadgeProps): React.JSX.Element {
  const t = useT();
  const colors = useMobileColors();
  const meta = statusMeta(colors)[status];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: onDark ? colors.heroLayer : meta.soft,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: meta.color }} />
      <Text
        style={{
          fontSize: mobileType.captionSize,
          fontWeight: '600',
          color: onDark ? colors.heroText : meta.color,
        }}
      >
        {t(meta.labelKey)}
      </Text>
    </View>
  );
}
