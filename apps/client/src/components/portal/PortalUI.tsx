/**
 * PortalUI — small presentational building blocks shared by the admin & affiliate portals.
 *
 * They reuse the merchant design system (mobile tokens, shadows, Text, StatusBadge) so the two
 * new portals look identical to the merchant app. RN primitives only; RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { type ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import {
  PressableScale,
  StatusBadge,
  type StatusTone,
} from '@/features/mobile/components';
import {
  mobileMetrics,
  mobileType,
  useMobileColors,
  useMobileShadow,
} from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Bold section title with an optional trailing action (e.g. "مشاهده همه"). */
export function PortalSectionTitle({
  title,
  actionLabel,
  onPressAction,
}: {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
}): React.JSX.Element {
  const colors = useMobileColors();
  const { rowDirection, isRTL } = useTheme();
  return (
    <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between' }}>
      <Text
        style={{
          fontSize: mobileType.sectionSize,
          fontWeight: '700',
          color: colors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {title}
      </Text>
      {actionLabel && onPressAction ? (
        <PressableScale onPress={onPressAction} accessibilityLabel={actionLabel}>
          <Text style={{ fontSize: mobileType.captionSize, fontWeight: '700', color: colors.primary }}>
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

/** A compact KPI tile (value on top, label below, optional change pill). */
export function PortalMetricTile({
  label,
  value,
  changeLabel,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  changeLabel?: string;
  tone?: StatusTone;
}): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const { isRTL } = useTheme();
  return (
    <View
      style={[
        {
          flex: 1,
          minWidth: 0,
          borderRadius: mobileMetrics.cardRadiusSmall,
          backgroundColor: colors.card,
          padding: 14,
          gap: 6,
        },
        shadow,
      ]}
    >
      <Text
        style={{ fontSize: 20, fontWeight: '800', color: colors.text, textAlign: isRTL ? 'right' : 'left' }}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {value}
      </Text>
      <Text
        style={{ fontSize: mobileType.captionSize, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }}
        numberOfLines={2}
      >
        {label}
      </Text>
      {changeLabel ? <StatusBadge tone={tone} label={changeLabel} /> : null}
    </View>
  );
}

/** A tappable list row card: leading icon/avatar + title/subtitle + trailing meta/badge. */
export function PortalRowCard({
  icon,
  initials,
  title,
  subtitle,
  meta,
  metaSub,
  badge,
  onPress,
  testID,
}: {
  icon?: IoniconName;
  /** Avatar initials (used when `icon` is not provided). */
  initials?: string;
  title: string;
  subtitle?: string;
  /** Trailing primary text (e.g. amount). */
  meta?: string;
  /** Trailing secondary text under `meta`. */
  metaSub?: string;
  badge?: { tone: StatusTone; label: string };
  onPress?: () => void;
  testID?: string;
}): React.JSX.Element {
  const colors = useMobileColors();
  const shadow = useMobileShadow();
  const { rowDirection, isRTL } = useTheme();

  const body: ReactNode = (
    <>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          backgroundColor: icon ? colors.tile : colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon ? (
          <Ionicons name={icon} size={20} color={colors.primary} />
        ) : (
          <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 15 }}>
            {initials ?? '•'}
          </Text>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          style={{
            fontSize: mobileType.labelSize,
            fontWeight: '700',
            color: colors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: colors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
        {badge ? <StatusBadge tone={badge.tone} label={badge.label} /> : null}
      </View>

      {meta || metaSub ? (
        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 3 }}>
          {meta ? (
            <Text style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: colors.text }}>
              {meta}
            </Text>
          ) : null}
          {metaSub ? (
            <Text style={{ fontSize: mobileType.captionSize, color: colors.textSecondary }}>
              {metaSub}
            </Text>
          ) : null}
        </View>
      ) : null}
    </>
  );

  const style = [
    {
      flexDirection: rowDirection,
      alignItems: 'center' as const,
      gap: 12,
      borderRadius: mobileMetrics.cardRadiusSmall,
      backgroundColor: colors.card,
      paddingVertical: 12,
      paddingHorizontal: 14,
      minHeight: 64,
    },
    shadow,
  ];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} accessibilityLabel={title} testID={testID} style={style}>
        {body}
      </PressableScale>
    );
  }
  return (
    <View testID={testID} style={style}>
      {body}
    </View>
  );
}
