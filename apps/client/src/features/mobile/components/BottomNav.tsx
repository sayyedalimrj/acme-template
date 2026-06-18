/**
 * BottomNav — mobile bottom tab bar (4 tabs).
 *
 * Home / Orders / Products / More. Support and notifications live in the header/More, not here.
 * Active tab is clearly blue (filled icon + accent dot + bold label), inactive muted; labels
 * are short and single-line so they never overlap. Bottom safe-area inset is included. Soft
 * press feedback via PressableScale. Active route derived from the pathname.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { StringKey } from '@/i18n/strings';

import { MOBILE_FONT_FAMILY } from '../mobileUxSpec';
import { mobileColors, mobileMetrics } from '../mobileTokens';
import { PressableScale } from './PressableScale';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabDef {
  key: string;
  labelKey: StringKey;
  href: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TABS: readonly TabDef[] = [
  { key: 'home', labelKey: 'nav.mobile.home', href: '/', icon: 'home-outline', iconActive: 'home' },
  {
    key: 'orders',
    labelKey: 'nav.mobile.orders',
    href: '/orders',
    icon: 'receipt-outline',
    iconActive: 'receipt',
  },
  {
    key: 'products',
    labelKey: 'nav.mobile.products',
    href: '/products',
    icon: 'pricetags-outline',
    iconActive: 'pricetags',
  },
  {
    key: 'more',
    labelKey: 'nav.mobile.more',
    href: '/more',
    icon: 'apps-outline',
    iconActive: 'apps',
  },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/' || pathname === '';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { rowDirection } = useTheme();

  return (
    <View
      style={{
        flexDirection: rowDirection,
        backgroundColor: mobileColors.bottomNav,
        borderTopWidth: 1,
        borderTopColor: mobileColors.separator,
        paddingBottom: insets.bottom,
        paddingTop: 8,
        paddingHorizontal: 6,
        height: mobileMetrics.bottomNavHeight + insets.bottom,
      }}
    >
      {TABS.map((tab) => {
        const active = isActiveRoute(pathname, tab.href);
        const color = active ? mobileColors.navActive : mobileColors.navInactive;
        return (
          <PressableScale
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(tab.labelKey)}
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
                backgroundColor: active ? mobileColors.navActive : 'transparent',
              }}
            />
            <Ionicons name={active ? tab.iconActive : tab.icon} size={23} color={color} />
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                fontWeight: active ? '700' : '500',
                color,
                fontFamily: MOBILE_FONT_FAMILY,
                textAlign: 'center',
              }}
            >
              {t(tab.labelKey)}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
