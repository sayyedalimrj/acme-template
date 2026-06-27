/**
 * Side-by-side comparison of plugin vs WooCommerce REST connection methods.
 */
import React from 'react';
import { View } from 'react-native';

import { Badge, Text } from '@/components/ui';
import { PressableScale } from '@/features/mobile/components';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

export interface ConnectionMethodCompareProps {
  selected: 'woo_rest' | 'plugin';
  onSelect: (mode: 'woo_rest' | 'plugin') => void;
}

function MethodCard({
  title,
  badge,
  benefits,
  selected,
  onPress,
  testID,
}: {
  title: string;
  badge?: string;
  benefits: string[];
  selected: boolean;
  onPress: () => void;
  testID: string;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <PressableScale onPress={onPress} testID={testID} pressScale={0.98}>
      <View
        style={{
          gap: tokens.spacing.sm,
          padding: tokens.spacing.md,
          borderRadius: tokens.radius.lg,
          borderWidth: selected ? 2 : tokens.borderWidth.hairline,
          borderColor: selected ? tokens.color.primary : tokens.color.border,
          backgroundColor: tokens.color.surface,
        }}
      >
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.sm }}>
          <Text variant="subheading">{title}</Text>
          {badge ? <Badge tone="primary" label={badge} /> : null}
        </View>
        {benefits.map((line) => (
          <Text key={line} variant="caption" tone="muted">
            • {line}
          </Text>
        ))}
      </View>
    </PressableScale>
  );
}

export function ConnectionMethodCompare({
  selected,
  onSelect,
}: ConnectionMethodCompareProps): React.JSX.Element {
  const t = useT();
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} testID="connect-method-compare">
      <Text variant="subheading">{t('connectSite.compare.title')}</Text>
      <MethodCard
        testID="connect-method-plugin"
        title={t('connectSite.compare.pluginTitle')}
        badge={t('connectSite.compare.pluginRecommended')}
        benefits={[
          t('connectSite.compare.pluginBenefit1'),
          t('connectSite.compare.pluginBenefit2'),
          t('connectSite.compare.pluginBenefit3'),
        ]}
        selected={selected === 'plugin'}
        onPress={() => onSelect('plugin')}
      />
      <MethodCard
        testID="connect-method-rest"
        title={t('connectSite.compare.restTitle')}
        badge={t('connectSite.compare.restLegacy')}
        benefits={[
          t('connectSite.compare.restBenefit1'),
          t('connectSite.compare.restBenefit2'),
          t('connectSite.compare.restBenefit3'),
        ]}
        selected={selected === 'woo_rest'}
        onPress={() => onSelect('woo_rest')}
      />
    </View>
  );
}
