/**
 * BrandAssetsChecklist — toggles each brand asset between "ready" and "need help".
 *
 * No files are uploaded here (this is a mock); only readiness flags are collected so support
 * knows what the merchant can provide. Each row pairs an asset label with a two-option toggle.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Divider, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { AssetReadiness, BrandAssetItem } from '@/domain/types';

import { brandAssetLabelKey } from '../onboardingHelpers';

interface ToggleProps {
  active: boolean;
  tone: 'success' | 'warning';
  label: string;
  onPress: () => void;
}

function Toggle({ active, tone, label, onPress }: ToggleProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const fg = active ? tokens.color[tone] : tokens.color.textMuted;
  const bg = active
    ? tone === 'success'
      ? tokens.color.successSoft
      : tokens.color.warningSoft
    : tokens.color.surface;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.xs,
          paddingVertical: tokens.spacing.xs,
          paddingHorizontal: tokens.spacing.sm,
          borderRadius: tokens.radius.pill,
          borderWidth: tokens.borderWidth.thin,
          borderColor: active ? tokens.color[tone] : tokens.color.border,
          backgroundColor: bg,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={fg} />
      <Text variant="caption" style={{ color: fg, fontWeight: active ? '600' : '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}

export interface BrandAssetsChecklistProps {
  value: BrandAssetItem[];
  onChange: (key: BrandAssetItem['key'], readiness: AssetReadiness) => void;
}

export function BrandAssetsChecklist({
  value,
  onChange,
}: BrandAssetsChecklistProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      {value.map((item, index) => (
        <View key={item.key} style={{ gap: tokens.spacing.sm }}>
          {index > 0 ? <Divider /> : null}
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: tokens.spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <Text variant="label" style={{ flexShrink: 1 }}>
              {t(brandAssetLabelKey(item.key))}
            </Text>
            <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs }}>
              <Toggle
                active={item.readiness === 'have'}
                tone="success"
                label={t('onboarding.asset.have')}
                onPress={() => onChange(item.key, 'have')}
              />
              <Toggle
                active={item.readiness === 'need'}
                tone="warning"
                label={t('onboarding.asset.need')}
                onPress={() => onChange(item.key, 'need')}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
