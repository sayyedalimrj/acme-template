/**
 * ActiveSiteIndicator.
 *
 * Surfaces the current active site (name + URL) in the app shell and links to Connect Site.
 * When no site is connected it becomes a clear call-to-action to connect one — making the
 * multi-site context visible everywhere (a first-class product concept).
 *
 * `compact` is used in the TopBar; the full variant is used in the Sidebar.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

export interface ActiveSiteIndicatorProps {
  compact?: boolean;
}

export function ActiveSiteIndicator({
  compact = false,
}: ActiveSiteIndicatorProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const { data: site, isPending } = useActiveSite();

  const goToConnect = () => router.navigate('/connect-site' as never);

  const rowStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.sm,
  };

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={site ? `${t('site.activeLabel')}: ${site.name}` : t('site.connectCta')}
        onPress={goToConnect}
        style={({ pressed }) => [
          rowStyle,
          {
            paddingVertical: tokens.spacing.xs,
            paddingHorizontal: tokens.spacing.sm,
            borderRadius: tokens.radius.pill,
            backgroundColor: pressed ? tokens.color.surfaceAlt : 'transparent',
            maxWidth: 240,
          },
        ]}
      >
        <Ionicons
          name={site ? 'globe-outline' : 'add-circle-outline'}
          size={16}
          color={site ? tokens.color.success : tokens.color.primary}
        />
        <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
          {isPending ? t('common.loading') : (site?.name ?? t('site.connectCta'))}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={goToConnect}
      style={({ pressed }) => [
        {
          padding: tokens.spacing.md,
          borderRadius: tokens.radius.md,
          borderWidth: tokens.borderWidth.hairline,
          borderColor: tokens.color.border,
          backgroundColor: pressed ? tokens.color.surfaceAlt : tokens.color.surface,
          gap: tokens.spacing.xs,
        },
      ]}
    >
      <Text
        variant="caption"
        tone="muted"
        style={{ textTransform: 'uppercase', letterSpacing: 0.6 }}
      >
        {t('site.activeLabel')}
      </Text>
      {site ? (
        <>
          <View style={rowStyle}>
            <Ionicons name="globe-outline" size={16} color={tokens.color.success} />
            <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
              {site.name}
            </Text>
          </View>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {site.url}
          </Text>
        </>
      ) : (
        <View style={rowStyle}>
          <Ionicons name="add-circle-outline" size={16} color={tokens.color.primary} />
          <Text variant="label" tone="primary">
            {isPending ? t('common.loading') : t('site.connectCta')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
