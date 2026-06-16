/**
 * NavLink: a single navigation entry used by the sidebar and the mobile nav.
 *
 * Active state is derived from the current Expo Router pathname (no custom nav state).
 * "Coming soon" entries are rendered disabled so the IA is visible without dead links.
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

export function NavLink({ item, compact = false }: NavLinkProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = !item.comingSoon && pathname === item.href;
  const disabled = Boolean(item.comingSoon);

  const containerStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    backgroundColor: isActive ? tokens.color.primarySoft : 'transparent',
    opacity: disabled ? 0.5 : 1,
  };

  const color = isActive ? tokens.color.primary : tokens.color.textMuted;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ selected: isActive, disabled }}
      disabled={disabled}
      onPress={() => {
        if (!disabled) router.navigate(item.href as never);
      }}
      style={({ pressed }) => [
        containerStyle,
        pressed && !disabled ? { backgroundColor: tokens.color.surfaceAlt } : null,
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
            style={{ color: isActive ? tokens.color.primary : tokens.color.text, flexShrink: 1 }}
          >
            {t(item.labelKey)}
          </Text>
          {item.comingSoon ? <Badge tone="neutral" label={t('nav.comingSoon')} /> : null}
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
