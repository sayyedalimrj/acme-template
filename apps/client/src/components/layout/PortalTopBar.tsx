/**
 * PortalTopBar — the persistent top app bar for the admin & affiliate portals.
 *
 * Mirrors the merchant `GlobalHeader` visuals (avatar + greeting/title on the leading side,
 * controls on the trailing side) but is portal-agnostic: the title/subtitle and the avatar
 * initials are supplied by the caller. Carries the light/dark toggle and a "switch portal"
 * control so the demo owner can hop between experiences. RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { PressableScale } from '@/features/mobile/components';
import {
  mobileMetrics,
  useMobileColors,
  useMobileType,
} from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';

export interface PortalTopBarProps {
  /** Bold primary line (e.g. the portal / account name). */
  title: string;
  /** Small muted line above the title. */
  subtitle?: string;
  /** Avatar initials. */
  initials: string;
  /** Tapping the avatar (e.g. opens the portal "more"/account screen). */
  onPressAvatar?: () => void;
  /** Tapping the switch-portal control. */
  onPressSwitch?: () => void;
  switchLabel?: string;
  accountLabel?: string;
}

export function PortalTopBar({
  title,
  subtitle,
  initials,
  onPressAvatar,
  onPressSwitch,
  switchLabel = 'تغییر نسخه',
  accountLabel = 'حساب',
}: PortalTopBarProps): React.JSX.Element {
  const colors = useMobileColors();
  const type = useMobileType();
  const insets = useSafeAreaInsets();
  const { rowDirection, isRTL } = useTheme();
  const avatarSize = mobileMetrics.avatarSize;

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
        zIndex: 20,
      }}
    >
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: 12,
          minHeight: mobileMetrics.headerHeight,
          paddingHorizontal: mobileMetrics.screenPadding,
          paddingVertical: 8,
        }}
      >
        <PressableScale
          onPress={onPressAvatar}
          accessibilityLabel={accountLabel}
          testID="portal-avatar"
          pressScale={0.92}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 16 }}>
            {initials}
          </Text>
        </PressableScale>

        <View style={{ flex: 1, minWidth: 0 }}>
          {subtitle ? (
            <Text
              style={{
                fontSize: type.greetingSize,
                color: colors.textSecondary,
                textAlign: isRTL ? 'right' : 'left',
              }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
          <Text
            style={{
              fontSize: Math.round(type.titleSize * 0.82),
              fontWeight: type.titleWeight,
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>

        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <ThemeToggleButton />
          {onPressSwitch ? (
            <PressableScale
              onPress={onPressSwitch}
              accessibilityLabel={switchLabel}
              testID="portal-switch"
              style={{
                width: mobileMetrics.headerButton,
                height: mobileMetrics.headerButton,
                borderRadius: mobileMetrics.headerButton / 2,
                backgroundColor: colors.tile,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="swap-horizontal" size={20} color={colors.text} />
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}
