/**
 * MobileHeader — the home top header.
 *
 * Avatar + store/business name on the leading side; notification (bell + unread badge) and
 * support icons on the trailing side. Short, friendly copy only — no technical terms. RTL-safe
 * via the theme row direction.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

import { mobileColors, mobileMetrics, mobileType } from '../mobileTokens';
import { PressableScale } from './PressableScale';

export interface MobileHeaderProps {
  /** Small greeting line above the name (e.g. "Welcome back"). */
  greeting?: string;
  /** Store / business name. */
  name: string;
  /** Initials shown in the avatar circle. */
  initials: string;
  unreadNotifications?: number;
  unreadSupport?: number;
  onPressNotifications: () => void;
  onPressSupport: () => void;
  /** Opens account settings when the avatar is tapped. */
  onPressAvatar?: () => void;
  notificationsLabel: string;
  supportLabel: string;
  accountLabel: string;
}

function IconButton({
  icon,
  badge,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  badge?: number;
  onPress: () => void;
  label: string;
}): React.JSX.Element {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        width: mobileMetrics.headerButton,
        height: mobileMetrics.headerButton,
        borderRadius: mobileMetrics.headerButton / 2,
        backgroundColor: mobileColors.tile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={20} color={mobileColors.text} />
      {badge && badge > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            backgroundColor: mobileColors.badge,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: mobileColors.background,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: mobileColors.onPrimary }}>
            {badge > 9 ? '9+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export function MobileHeader({
  greeting,
  name,
  initials,
  unreadNotifications = 0,
  unreadSupport = 0,
  onPressNotifications,
  onPressSupport,
  onPressAvatar,
  notificationsLabel,
  supportLabel,
  accountLabel,
}: MobileHeaderProps): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();

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
        onPress={onPressAvatar}
        accessibilityLabel={accountLabel}
        testID="home-avatar"
        pressScale={0.92}
        style={{
          width: mobileMetrics.avatarSize,
          height: mobileMetrics.avatarSize,
          borderRadius: mobileMetrics.avatarSize / 2,
          backgroundColor: mobileColors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: mobileColors.onPrimary, fontWeight: '700', fontSize: 16 }}>
          {initials}
        </Text>
      </PressableScale>

      <View style={{ flex: 1, minWidth: 0 }}>
        {greeting ? (
          <Text
            style={{
              fontSize: mobileType.greetingSize,
              color: mobileColors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {greeting}
          </Text>
        ) : null}
        <Text
          style={{
            fontSize: mobileType.titleSize,
            fontWeight: mobileType.titleWeight,
            color: mobileColors.text,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
      </View>

      <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 10 }}>
        <IconButton
          icon="notifications-outline"
          badge={unreadNotifications}
          onPress={onPressNotifications}
          label={notificationsLabel}
        />
        <IconButton
          icon="chatbubble-ellipses-outline"
          badge={unreadSupport}
          onPress={onPressSupport}
          label={supportLabel}
        />
      </View>
    </View>
  );
}
