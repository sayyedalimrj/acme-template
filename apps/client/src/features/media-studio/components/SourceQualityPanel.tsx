/**
 * SourceQualityPanel — pick a SIMULATED source scenario (no upload), run a mock analysis,
 * and show the quality score, detected issues, and recommended fixes. Picking a recommended
 * fix selects that task in the chooser.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Surface, Text } from '@/components/ui';
import { ChoiceGroup } from '@/features/onboarding/components/ChoiceGroup';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type {
  MediaStudioAsset,
  MediaStudioSourcePreset,
  MediaStudioTaskType,
} from '@/domain/types';

import {
  SOURCE_PRESETS,
  issueLabelKey,
  presetLabelKey,
  qualityMeta,
  taskLabelKey,
} from '../mediaStudioHelpers';

export interface SourceQualityPanelProps {
  preset: MediaStudioSourcePreset;
  onPresetChange: (preset: MediaStudioSourcePreset) => void;
  analyzing: boolean;
  asset: MediaStudioAsset | null;
  onAnalyze: () => void;
  onSelectFix: (task: MediaStudioTaskType) => void;
}

export function SourceQualityPanel({
  preset,
  onPresetChange,
  analyzing,
  asset,
  onAnalyze,
  onSelectFix,
}: SourceQualityPanelProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const quality = asset ? qualityMeta(asset.quality) : null;

  return (
    <View style={{ gap: tokens.spacing.md }}>
      <Text variant="caption" tone="muted">
        {t('mediaStudio.source.presetHint')}
      </Text>
      <ChoiceGroup
        value={preset}
        disabled={analyzing}
        onChange={onPresetChange}
        choices={SOURCE_PRESETS.map((value) => ({ value, label: t(presetLabelKey(value)) }))}
      />

      {/* Placeholder source preview (no real image). */}
      <Surface
        variant="surfaceAlt"
        bordered
        padding="lg"
        style={{ alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.xs }}
      >
        <Ionicons name="image-outline" size={28} color={tokens.color.textMuted} />
        <Text variant="caption" tone="muted">
          {t(presetLabelKey(preset))}
        </Text>
      </Surface>

      <Button
        label={analyzing ? t('mediaStudio.source.analyzing') : t('mediaStudio.source.analyze')}
        variant="secondary"
        size="sm"
        loading={analyzing}
        onPress={onAnalyze}
        leading={<Ionicons name="scan-outline" size={15} color={tokens.color.primary} />}
      />

      {asset && quality ? (
        <Surface bordered padding="md" style={{ gap: tokens.spacing.sm }} testID="media-analysis">
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              gap: tokens.spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <Text variant="label">{t('mediaStudio.source.quality')}</Text>
            <Badge tone={quality.tone} label={t(quality.labelKey)} />
            <Badge tone="neutral" label={`${asset.qualityScore}/100`} />
          </View>
          <Text variant="caption" tone="muted">
            {asset.note}
          </Text>
          {asset.issues.length > 0 ? (
            <View style={{ gap: tokens.spacing.xs }}>
              <Text variant="caption" tone="muted">
                {t('mediaStudio.source.issues')}
              </Text>
              <View
                style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}
              >
                {asset.issues.map((issue) => (
                  <Badge key={issue} tone="warning" label={t(issueLabelKey(issue))} />
                ))}
              </View>
            </View>
          ) : null}
          <View style={{ gap: tokens.spacing.xs }}>
            <Text variant="caption" tone="muted">
              {t('mediaStudio.source.recommendedFixes')}
            </Text>
            <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
              {asset.recommendedFixes.map((fix) => (
                <Pressable
                  key={fix}
                  accessibilityRole="button"
                  onPress={() => onSelectFix(fix)}
                  style={({ pressed }) => [
                    {
                      paddingVertical: tokens.spacing.xs,
                      paddingHorizontal: tokens.spacing.md,
                      borderRadius: tokens.radius.pill,
                      borderWidth: tokens.borderWidth.thin,
                      borderColor: tokens.color.primary,
                      backgroundColor: tokens.color.primarySoft,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text variant="caption" tone="primary">
                    {t(taskLabelKey(fix))}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Surface>
      ) : null}
    </View>
  );
}
