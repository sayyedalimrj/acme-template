/**
 * GlobalHeader — the persistent top app bar.
 *
 * Like the bottom tab bar, this header is rendered once by the AppShell so it stays fixed on
 * every authenticated screen (it is intentionally NOT shown on the auth screens, which live
 * in a separate route group without the shell). It carries the always-available chrome:
 *   - the profile photo / avatar (opens account settings),
 *   - the active store name (reflects the store currently selected on the home carousel),
 *   - the light/dark toggle, notifications, and support.
 *
 * Per-screen back/title bars render BELOW this as contextual sub-headers. RTL-safe.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import { isApiConfigured } from '@/config/api.config';
import { PressableScale, siteInitials } from '@/features/mobile/components';
import { UNREAD } from '@/features/mobile/mobileMockData';
import {
  mobileMetrics,
  useMobileColors,
  useMobileType,
  type MobileColorTokens,
} from '@/features/mobile/mobileTokens';
import { useT } from '@/i18n/I18nProvider';
import { useSession } from '@/session/SessionProvider';
import { useTheme } from '@/theme';

function IconButton({
  icon,
  badge,
  onPress,
  label,
  colors,
  badgeTestID,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  badge?: number;
  onPress: () => void;
  label: string;
  colors: MobileColorTokens;
  badgeTestID?: string;
}): React.JSX.Element {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        width: mobileMetrics.headerButton,
        height: mobileMetrics.headerButton,
        borderRadius: mobileMetrics.headerButton / 2,
        backgroundColor: colors.tile,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      {badge && badge > 0 ? (
        <View
          testID={badgeTestID}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            paddingHorizontal: 4,
            backgroundColor: colors.badge,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.background,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.onPrimary }}>
            {badge > 9 ? '9+' : String(badge)}
          </Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

export function GlobalHeader(): React.JSX.Element {
  const colors = useMobileColors();
  const type = useMobileType();
  const t = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { rowDirection, isRTL } = useTheme();
  const { user } = useSession();

  // Notification/support badges are showcase-only counters (mock). With a real backend configured
  // (production) there is no real unread source yet, so never show a fake count — hide the badge
  // until it is backed by real data.
  const showcaseBadges = !isApiConfigured();

  const go = (href: string): void => router.navigate(href as never);

  // Top identity is the authenticated USER (not the active store). The store name is shown only
  // in store-specific UI (home carousel / site cards), so switching stores never changes this.
  const displayName = user?.name?.trim() || user?.mobile?.trim() || t('home.userFallback');
  const initials = siteInitials(user?.name?.trim() || user?.mobile?.trim() || '');
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
          onPress={() => go('/settings')}
          accessibilityLabel={t('home.accountLabel')}
          testID="global-avatar"
          pressScale={0.92}
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {user?.avatarUrl ? (
            <Image
              testID="header-avatar-image"
              source={{ uri: user.avatarUrl }}
              accessibilityIgnoresInvertColors
              style={{ width: avatarSize, height: avatarSize }}
              resizeMode="cover"
            />
          ) : (
            <Text
              testID="header-avatar-initials"
              style={{ color: colors.onPrimary, fontWeight: '700', fontSize: 16 }}
            >
              {initials}
            </Text>
          )}
        </PressableScale>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: type.greetingSize,
              color: colors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {t('home.greeting')}
          </Text>
          <Text
            style={{
              fontSize: Math.round(type.titleSize * 0.82),
              fontWeight: type.titleWeight,
              color: colors.text,
              textAlign: isRTL ? 'right' : 'left',
            }}
            // Allow up to two lines so a longer user name is never clipped.
            numberOfLines={2}
          >
            {displayName}
          </Text>
        </View>

        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <ThemeToggleButton />
          <IconButton
            icon="notifications-outline"
            badge={showcaseBadges ? UNREAD.notifications : 0}
            onPress={() => go('/notifications')}
            label={t('notif.title')}
            colors={colors}
            badgeTestID="header-notif-badge"
          />
          <IconButton
            icon="chatbubble-ellipses-outline"
            badge={showcaseBadges ? UNREAD.support : 0}
            onPress={() => go('/support')}
            label={t('csupport.title')}
            colors={colors}
            badgeTestID="header-support-badge"
          />
        </View>
      </View>
    </View>
  );
}
