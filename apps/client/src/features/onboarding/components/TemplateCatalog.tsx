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
import { useFormatters } from '@/i18n/useFormatters';
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
  const fmt = useFormatters();
  const accent: Accent = template.accent ?? 'primary';
  const comingSoon = template.availability === 'coming_soon';
  const accentFg = tokens.color[ACCENT_FG[accent]];
  const accentBg = tokens.color[ACCENT_BG[accent]];

  return (
    <Surface
      bordered
      padding="none"
      style={{
        flexGrow: 1,
        flexBasis: 300,
        minWidth: 260,
        maxWidth: 420,
        overflow: 'hidden',
        borderColor: selected ? tokens.color.primary : tokens.color.border,
        borderWidth: selected ? tokens.borderWidth.thick : tokens.borderWidth.hairline,
        opacity: comingSoon ? 0.85 : 1,
      }}
    >
      {/* Thumbnail: a small mock "site preview" composed from Views (no real asset). */}
      <View style={{ height: 132, backgroundColor: accentBg, padding: tokens.spacing.md, gap: 6 }}>
        {/* Browser chrome bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: accentFg, opacity: 0.5 }} />
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: accentFg, opacity: 0.35 }} />
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: accentFg, opacity: 0.2 }} />
          <View
            style={{
              flex: 1,
              height: 10,
              marginLeft: 6,
              borderRadius: 999,
              backgroundColor: tokens.color.surface,
              opacity: 0.7,
            }}
          />
        </View>
        {/* Hero + content blocks (suggest a storefront layout) */}
        <View style={{ flex: 1, flexDirection: rowDirection, gap: 6 }}>
          <View
            style={{
              flex: 1,
              borderRadius: tokens.radius.sm,
              backgroundColor: tokens.color.surface,
              opacity: 0.92,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="storefront-outline" size={26} color={accentFg} />
          </View>
          <View style={{ width: 64, gap: 6 }}>
            <View style={{ height: 10, borderRadius: 999, backgroundColor: tokens.color.surface, opacity: 0.85 }} />
            <View style={{ height: 10, borderRadius: 999, backgroundColor: tokens.color.surface, opacity: 0.6 }} />
            <View style={{ flex: 1, borderRadius: tokens.radius.sm, backgroundColor: tokens.color.surface, opacity: 0.5 }} />
          </View>
        </View>
      </View>

      <View style={{ padding: tokens.spacing.lg, gap: tokens.spacing.sm }}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: tokens.spacing.sm,
          }}
        >
          <Text variant="subheading" numberOfLines={1} style={{ flex: 1, fontWeight: '700' }}>
            {template.name}
          </Text>
          {template.recommended ? (
            <Badge tone="primary" label={t('onboarding.template.recommended')} />
          ) : comingSoon ? (
            <Badge tone="warning" label={t('onboarding.template.comingSoon')} />
          ) : null}
        </View>

        <Text tone="muted" variant="caption" numberOfLines={2}>
          {template.description}
        </Text>

        {/* Compact meta row: category · pages · setup time */}
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.sm,
            flexWrap: 'wrap',
          }}
        >
          <Badge tone="neutral" label={template.category} />
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 4 }}>
            <Ionicons name="document-outline" size={13} color={tokens.color.textMuted} />
            <Text variant="caption" tone="muted">
              {fmt.num(template.includedPages.length)} {t('onboarding.template.pages')}
            </Text>
          </View>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 4 }}>
            <Ionicons name="time-outline" size={13} color={tokens.color.textMuted} />
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {template.setupTimeLabel}
            </Text>
          </View>
        </View>

        {/* Actions: secondary Preview (mock) + primary Select. */}
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.sm, marginTop: 2 }}>
          <Button
            label={t('onboarding.template.preview')}
            variant="secondary"
            size="sm"
            disabled
            style={{ flex: 1 }}
            leading={<Ionicons name="eye-outline" size={15} color={tokens.color.textMuted} />}
          />
          {selectable ? (
            <Button
              label={selected ? t('onboarding.template.selected') : t('onboarding.template.select')}
              variant={selected ? 'primary' : 'secondary'}
              size="sm"
              disabled={comingSoon}
              onPress={() => onSelect?.(template.id)}
              style={{ flex: 1 }}
              leading={
                selected ? (
                  <Ionicons name="checkmark" size={16} color={tokens.color.onPrimary} />
                ) : undefined
              }
            />
          ) : null}
        </View>
        {planName ? (
          <Text variant="caption" tone="muted">
            {t('onboarding.template.requiredPlan')}: {planName}
          </Text>
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
