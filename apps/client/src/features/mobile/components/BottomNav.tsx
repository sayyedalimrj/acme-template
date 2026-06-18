/**
 * BottomNav — mobile bottom tab bar.
 *
 * Four tabs (Home / Orders / Products / More). The active tab is clearly blue (filled icon +
 * accent), inactive tabs are muted. Press feedback via PressableScale; bottom safe-area inset
 * respected. Active route is derived from the pathname. RN primitives + Expo Router only.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import type { StringKey } from '@/i18n/strings';

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

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: mobileColors.bottomNav,
        borderTopWidth: 1,
        borderTopColor: mobileColors.separator,
        paddingBottom: insets.bottom,
        paddingTop: 8,
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
            onPress={() => {
              if (!active) {
                router.navigate(tab.href as never);
              }
            }}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            <View
              style={{
                width: 28,
                height: 3,
                borderRadius: 2,
                marginBottom: 3,
                backgroundColor: active ? mobileColors.navActive : 'transparent',
              }}
            />
            <Ionicons name={active ? tab.iconActive : tab.icon} size={22} color={color} />
            <Text style={{ fontSize: 12, fontWeight: active ? '700' : '500', color }}>
              {t(tab.labelKey)}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
