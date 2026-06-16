/**
 * NavLink: a single navigation entry used by the sidebar and the mobile nav.
 *
 * Active state is derived from the current Expo Router pathname (no custom nav state). All
 * destinations are real routes and navigable; placeholder modules show a "Soon" badge.
 */
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import type { NavItem } from './navigation';

export interface NavLinkProps {
  item: NavItem;
  /** Compact layout (used in the horizontal mobile nav). */
  compact?: boolean;
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ item, compact = false }: NavLinkProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = isRouteActive(pathname, item.href);

  const containerStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: isActive ? tokens.color.primarySoft : 'transparent',
  };

  const color = isActive ? tokens.color.primary : tokens.color.textMuted;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: isActive }}
      onPress={() => router.navigate(item.href as never)}
      style={({ pressed }) => [
        containerStyle,
        pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      <Ionicons name={item.icon} size={compact ? 18 : 20} color={color} />
      {!compact && (
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.sm,
            flex: 1,
          }}
        >
          <Text
            variant="label"
            style={{
              color: isActive ? tokens.color.primary : tokens.color.text,
              fontWeight: isActive ? '600' : '500',
              flexShrink: 1,
            }}
          >
            {t(item.labelKey)}
          </Text>
          {item.placeholder ? <Badge tone="neutral" label={t('nav.soon')} /> : null}
        </View>
      )}
      {compact && (
        <Text variant="caption" style={{ color }}>
          {t(item.labelKey)}
        </Text>
      )}
    </Pressable>
  );
}
