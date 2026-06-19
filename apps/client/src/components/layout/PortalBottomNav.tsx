/**
 * PortalBottomNav — a reusable bottom tab bar for the admin & affiliate portals.
 *
 * Same look/feel as the merchant `BottomNav` (active tab is blue: accent bar + filled icon +
 * bold label) but it is data-driven: each portal passes its own tab list with inline labels and
 * routes. Bottom safe-area inset is included; RTL-safe via the theme row direction.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMobileFontFamily } from '@/features/mobile/mobileUxSpec';
import { mobileMetrics, useMobileColors } from '@/features/mobile/mobileTokens';
import { PressableScale } from '@/features/mobile/components';
import { useTheme } from '@/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface PortalTab {
  key: string;
  label: string;
  href: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

export interface PortalBottomNavProps {
  tabs: readonly PortalTab[];
  /** The route prefix that "home" lives at, e.g. "/admin" or "/affiliate". */
  homeHref: string;
}

function isActiveRoute(pathname: string, href: string, homeHref: string): boolean {
  if (href === homeHref) {
    return pathname === homeHref || pathname === `${homeHref}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PortalBottomNav({ tabs, homeHref }: PortalBottomNavProps): React.JSX.Element {
  const colors = useMobileColors();
  const fontFamily = useMobileFontFamily();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { rowDirection } = useTheme();

  const bottomInset = Platform.OS === 'web' ? Math.max(insets.bottom, 16) : insets.bottom;

  return (
    <View
      style={{
        flexDirection: rowDirection,
        backgroundColor: colors.bottomNav,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
        paddingBottom: bottomInset,
        paddingTop: 8,
        paddingHorizontal: 6,
        height: mobileMetrics.bottomNavHeight + bottomInset,
      }}
    >
      {tabs.map((tab) => {
        const active = isActiveRoute(pathname, tab.href, homeHref);
        const color = active ? colors.navActive : colors.navInactive;
        return (
          <PressableScale
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            testID={`tab-${tab.key}`}
            pressScale={0.92}
            onPress={() => {
              if (!active) {
                router.navigate(tab.href as never);
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                width: 20,
                height: 3,
                borderRadius: 2,
                backgroundColor: active ? colors.navActive : 'transparent',
              }}
            />
            <Ionicons name={active ? tab.iconActive : tab.icon} size={23} color={color} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: active ? '700' : '500',
                color,
                fontFamily,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
