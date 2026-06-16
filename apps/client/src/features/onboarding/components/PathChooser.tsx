/**
 * PathChooser — the onboarding entry chooser ("two front doors").
 *
 * Two large, pressable cards: connect an existing WordPress/WooCommerce site, or have us
 * launch a new store. Responsive: side-by-side on wide viewports, stacked on narrow/native.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState, type ComponentProps } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { Button, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { OnboardingType } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface PathCardProps {
  icon: IoniconName;
  titleKey: StringKey;
  bodyKey: StringKey;
  ctaKey: StringKey;
  onPress: () => void;
  testID?: string;
}

function PathCard({
  icon,
  titleKey,
  bodyKey,
  ctaKey,
  onPress,
  testID,
}: PathCardProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={t(titleKey)}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={{ flexGrow: 1, flexBasis: 280, minWidth: 240 }}
    >
      <Surface
        bordered
        padding="lg"
        elevation={hovered ? 'md' : 'sm'}
        style={{
          flex: 1,
          gap: tokens.spacing.md,
          borderColor: hovered ? tokens.color.primary : tokens.color.border,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: tokens.radius.pill,
            backgroundColor: tokens.color.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={24} color={tokens.color.primary} />
        </View>
        <View style={{ gap: tokens.spacing.xs, flex: 1 }}>
          <Text variant="heading">{t(titleKey)}</Text>
          <Text tone="muted">{t(bodyKey)}</Text>
        </View>
        <Button label={t(ctaKey)} onPress={onPress} />
      </Surface>
    </Pressable>
  );
}

export interface PathChooserProps {
  onSelect: (path: OnboardingType) => void;
}

export function PathChooser({ onSelect }: PathChooserProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const { width } = useWindowDimensions();
  const twoCol = width >= 768;

  return (
    <View style={{ gap: tokens.spacing.md }}>
      <Text variant="subheading">{t('onboarding.chooser.title')}</Text>
      <View
        style={{
          flexDirection: twoCol ? rowDirection : 'column',
          gap: tokens.spacing.lg,
          alignItems: 'stretch',
        }}
      >
        <PathCard
          testID="onboarding-path-existing"
          icon="link-outline"
          titleKey="onboarding.path.existing.title"
          bodyKey="onboarding.path.existing.body"
          ctaKey="onboarding.path.existing.cta"
          onPress={() => onSelect('existing')}
        />
        <PathCard
          testID="onboarding-path-new"
          icon="rocket-outline"
          titleKey="onboarding.path.new.title"
          bodyKey="onboarding.path.new.body"
          ctaKey="onboarding.path.new.cta"
          onPress={() => onSelect('new')}
        />
      </View>
    </View>
  );
}
