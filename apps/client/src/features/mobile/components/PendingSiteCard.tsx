/**
 * PendingSiteCard — hero card for site build requests awaiting admin action.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, type DimensionValue } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { PendingSiteCard as PendingSiteCardType } from '@/domain/types';

import { mobileMetrics, useMobileColors, useMobileShadow, useMobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface PendingSiteCardProps {
  request: PendingSiteCardType;
  onPress: () => void;
  width?: DimensionValue;
}

export function PendingSiteCard({
  request,
  onPress,
  width = '100%',
}: PendingSiteCardProps): React.JSX.Element {
  const t = useT();
  const fmt = useFormatters();
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const type = useMobileType();
  const { rowDirection, isRTL } = useTheme();

  const statusLabel = t(`home.pending.status.${request.status}` as never);

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={request.title}
      testID={`pending-site-${request.id}`}
      style={[
        {
          width,
          minHeight: mobileMetrics.heroHeight,
          borderRadius: mobileMetrics.cardRadius,
          backgroundColor: colors.hero,
          padding: 20,
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.statusAttention,
        },
        shadow,
      ]}
    >
      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            backgroundColor: colors.statusAttentionSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="construct-outline" size={22} color={colors.statusAttention} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: type.heroTitleSize,
              fontWeight: '700',
              color: colors.heroText,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {request.title}
          </Text>
          <Text
            style={{
              fontSize: type.captionSize,
              color: colors.heroTextSoft,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {request.domainOrUrl}
          </Text>
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 16 }}>
        <View
          style={{
            alignSelf: isRTL ? 'flex-end' : 'flex-start',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            backgroundColor: colors.statusAttentionSoft,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.statusAttention }}>
            {statusLabel}
          </Text>
        </View>
        <Text
          style={{
            fontSize: type.captionSize,
            color: colors.heroTextSoft,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={2}
        >
          {request.nextStepMessage.startsWith('home.')
            ? t(request.nextStepMessage as never)
            : request.nextStepMessage}
        </Text>
        <Text
          style={{
            fontSize: type.captionSize,
            color: colors.heroTextSoft,
            textAlign: isRTL ? 'right' : 'left',
          }}
        >
          {t('home.pending.requestDate', { date: fmt.date(request.requestDate) })}
        </Text>
      </View>
    </PressableScale>
  );
}
