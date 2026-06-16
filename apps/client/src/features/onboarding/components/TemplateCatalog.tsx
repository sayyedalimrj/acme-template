/**
 * TemplateCatalog — a responsive grid of store-template cards (mock catalog).
 *
 * Each card shows a placeholder preview band (no real theme asset is bundled), name +
 * category, description, highlights, "best for", included pages, estimated setup time, and
 * an optional suggested plan. Supports a selection mode used by the new-store launch form;
 * "coming soon" templates are shown but not selectable.
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';

import { Badge, Button, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme, type ColorTokens } from '@/theme';
import type { StoreTemplate, SubscriptionPlan } from '@/domain/types';

type Accent = NonNullable<StoreTemplate['accent']>;

const ACCENT_BG: Record<Accent, keyof ColorTokens> = {
  primary: 'primarySoft',
  success: 'successSoft',
  warning: 'warningSoft',
  info: 'infoSoft',
  danger: 'dangerSoft',
};
const ACCENT_FG: Record<Accent, keyof ColorTokens> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  info: 'info',
  danger: 'danger',
};

interface TemplateCardProps {
  template: StoreTemplate;
  selectable: boolean;
  selected: boolean;
  planName?: string;
  onSelect?: (id: string) => void;
}

function TemplateCard({
  template,
  selectable,
  selected,
  planName,
  onSelect,
}: TemplateCardProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const accent: Accent = template.accent ?? 'primary';
  const comingSoon = template.availability === 'coming_soon';

  return (
    <Surface
      bordered
      padding="none"
      style={{
        flexGrow: 1,
        flexBasis: 300,
        minWidth: 260,
        overflow: 'hidden',
        borderColor: selected ? tokens.color.primary : tokens.color.border,
        borderWidth: selected ? tokens.borderWidth.thick : tokens.borderWidth.hairline,
        opacity: comingSoon ? 0.8 : 1,
      }}
    >
      {/* Placeholder preview band — no real asset, just a tinted label. */}
      <View
        style={{
          height: 96,
          backgroundColor: tokens.color[ACCENT_BG[accent]],
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: tokens.spacing.md,
        }}
      >
        <Ionicons name="image-outline" size={22} color={tokens.color[ACCENT_FG[accent]]} />
        <Text variant="caption" style={{ color: tokens.color[ACCENT_FG[accent]], marginTop: 4 }}>
          {template.previewLabel}
        </Text>
      </View>

      <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Text variant="subheading" style={{ flexShrink: 1 }}>
            {template.name}
          </Text>
          <Badge tone="neutral" label={template.category} />
          {template.recommended ? (
            <Badge tone="primary" label={t('onboarding.template.recommended')} />
          ) : null}
          {comingSoon ? <Badge tone="warning" label={t('onboarding.template.comingSoon')} /> : null}
        </View>

        <Text tone="muted" variant="body">
          {template.description}
        </Text>

        <View style={{ gap: 2 }}>
          <Text variant="caption" tone="muted">
            {t('onboarding.template.recommendedFor')}: {template.recommendedFor}
          </Text>
          <Text variant="caption" tone="muted">
            {t('onboarding.template.setupTime')}: {template.setupTimeLabel}
          </Text>
          <Text variant="caption" tone="muted">
            {t('onboarding.template.includedPages')}: {template.includedPages.join('، ')}
          </Text>
          {planName ? (
            <Text variant="caption" tone="muted">
              {t('onboarding.template.requiredPlan')}: {planName}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
          {template.highlights.map((h) => (
            <Badge key={h} tone="info" label={h} />
          ))}
        </View>

        {selectable ? (
          <Button
            label={selected ? t('onboarding.template.selected') : t('onboarding.template.select')}
            variant={selected ? 'primary' : 'secondary'}
            size="sm"
            disabled={comingSoon}
            onPress={() => onSelect?.(template.id)}
            leading={
              selected ? (
                <Ionicons name="checkmark" size={16} color={tokens.color.onPrimary} />
              ) : undefined
            }
          />
        ) : null}
      </View>
    </Surface>
  );
}

export interface TemplateCatalogProps {
  templates: StoreTemplate[];
  plans?: SubscriptionPlan[];
  selectable?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  testID?: string;
}

export function TemplateCatalog({
  templates,
  plans = [],
  selectable = false,
  selectedId = null,
  onSelect,
  testID,
}: TemplateCatalogProps): React.JSX.Element {
  const { tokens } = useTheme();
  const planName = (id?: string) => plans.find((p) => p.id === id)?.name;

  return (
    <View
      testID={testID}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.lg }}
    >
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          selectable={selectable}
          selected={selectedId === template.id}
          planName={planName(template.requiredPlan)}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}
