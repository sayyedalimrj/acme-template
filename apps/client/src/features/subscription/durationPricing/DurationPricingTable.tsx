/**
 * DurationPricingTable — جدول مقایسه‌ی تعرفه برای «یک اشتراک، چند مدت».
 *
 * ستون‌ها مدت اشتراک‌اند (۱/۳/۶/۱۲ ماهه) و هرکدام قیمت با تخفیف و قیمت مؤثر ماهانه را نشان
 * می‌دهند. ردیف‌ها امکانات‌اند و هر خانه تیک ✓ / ضرب ✕ / یا یک متن کوتاه است. همه‌ی داده و
 * متن‌های قابل‌ویرایش در `durationPricingConfig.ts` است؛ این فایل فقط آن را نمایش می‌دهد.
 *
 * RTL-aware و کاملاً cross-platform (فقط primitiveهای React Native + توکن‌های تم). برای
 * صفحه‌های باریک به‌صورت افقی اسکرول می‌شود.
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { Badge, Surface, Text } from '@/components/ui';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';

import {
  durationPricingConfig as defaultConfig,
  type DurationKey,
  type DurationPlan,
  type DurationPricingConfig,
} from './durationPricingConfig';
import {
  classifyCell,
  computeAllPrices,
  groupFeatures,
  type ComputedDurationPrice,
} from './durationPricingHelpers';

const LABEL_W = 184;
const COL_W = 132;

export interface DurationPricingTableProps {
  /** پیکربندی جدول. اگر ندهی، از `durationPricingConfig` پیش‌فرض استفاده می‌شود. */
  config?: DurationPricingConfig;
  testID?: string;
}

export function DurationPricingTable({
  config = defaultConfig,
  testID = 'duration-pricing-table',
}: DurationPricingTableProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const fmt = useFormatters();

  const prices = useMemo(() => computeAllPrices(config), [config]);
  const priceByKey = useMemo(() => {
    const map = {} as Record<DurationKey, ComputedDurationPrice>;
    for (const p of prices) map[p.key] = p;
    return map;
  }, [prices]);
  const groups = useMemo(() => groupFeatures(config.features), [config.features]);

  const money = (value: number): string => fmt.money(String(value), 'IRR');
  const minWidth = LABEL_W + config.durations.length * COL_W;

  const highlightBg = (highlight?: boolean) =>
    highlight ? { backgroundColor: tokens.color.primarySoft } : undefined;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator testID={testID}>
      <View style={{ minWidth }}>
        {/* ── سرستون قیمت‌ها ── */}
        <View style={{ flexDirection: rowDirection, alignItems: 'stretch' }}>
          <View style={{ width: LABEL_W, justifyContent: 'flex-end', padding: tokens.spacing.sm }}>
            <Text variant="subheading">{config.subscriptionName}</Text>
            <Text variant="caption" tone="muted">
              {config.subscriptionTagline}
            </Text>
          </View>

          {config.durations.map((duration) => (
            <PriceHeaderCell
              key={duration.key}
              duration={duration}
              price={priceByKey[duration.key]}
              money={money}
              currencySuffix={config.labels.currencySuffix}
              discountPrefix={config.labels.discountPrefix}
              perMonth={config.labels.perMonth}
              totalLabel={config.labels.totalLabel}
            />
          ))}
        </View>

        {/* ── گروه‌ها و ردیف‌ها ── */}
        {groups.map((group) => (
          <View key={group.group || 'ungrouped'}>
            {group.group ? (
              <Text
                variant="caption"
                tone="muted"
                style={{
                  paddingTop: tokens.spacing.md,
                  paddingBottom: tokens.spacing.xs,
                  paddingHorizontal: tokens.spacing.sm,
                  fontWeight: '600',
                }}
              >
                {group.group}
              </Text>
            ) : null}

            {group.features.map((feature, index) => (
              <View
                key={feature.label}
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'stretch',
                  borderTopWidth: index === 0 ? 0 : tokens.borderWidth.hairline,
                  borderTopColor: tokens.color.border,
                }}
              >
                <View
                  style={{
                    width: LABEL_W,
                    justifyContent: 'center',
                    paddingVertical: tokens.spacing.sm,
                    paddingHorizontal: tokens.spacing.sm,
                  }}
                >
                  <Text variant="body">{feature.label}</Text>
                </View>

                {config.durations.map((duration) => (
                  <View
                    key={duration.key}
                    style={{
                      width: COL_W,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: tokens.spacing.sm,
                      ...highlightBg(duration.highlight),
                    }}
                  >
                    <FeatureCell value={feature.values[duration.key]} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}

        {/* ── راهنما ── */}
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: tokens.spacing.md,
            marginTop: tokens.spacing.md,
            paddingHorizontal: tokens.spacing.sm,
          }}
        >
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
            <Ionicons name="checkmark-circle" size={16} color={tokens.color.success} />
            <Text variant="caption" tone="muted">
              {config.labels.legendIncluded}
            </Text>
          </View>
          <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
            <Ionicons name="close-circle" size={16} color={tokens.color.danger} />
            <Text variant="caption" tone="muted">
              {config.labels.legendExcluded}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

interface PriceHeaderCellProps {
  duration: DurationPlan;
  price: ComputedDurationPrice;
  money: (value: number) => string;
  currencySuffix: string;
  discountPrefix: string;
  perMonth: string;
  totalLabel: string;
}

function PriceHeaderCell({
  duration,
  price,
  money,
  discountPrefix,
  perMonth,
  totalLabel,
}: PriceHeaderCellProps): React.JSX.Element {
  const { tokens } = useTheme();
  const highlighted = Boolean(duration.highlight);

  return (
    <Surface
      bordered
      padding="sm"
      radius="md"
      style={{
        width: COL_W,
        alignItems: 'center',
        gap: 2,
        borderColor: highlighted ? tokens.color.primary : tokens.color.border,
        borderWidth: highlighted ? tokens.borderWidth.thick : tokens.borderWidth.hairline,
        backgroundColor: highlighted ? tokens.color.primarySoft : tokens.color.surface,
      }}
    >
      <Text variant="label" style={{ textAlign: 'center' }}>
        {duration.label}
      </Text>

      {duration.badge ? (
        <Badge tone={highlighted ? 'primary' : 'success'} label={duration.badge} />
      ) : null}

      {price.hasDiscount ? (
        <Badge tone="danger" label={`${discountPrefix}${price.discountPercent} تخفیف`} />
      ) : null}

      <Text variant="subheading" tone="primary" style={{ textAlign: 'center' }}>
        {money(price.total)}
      </Text>
      <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {totalLabel}
      </Text>

      {price.hasDiscount ? (
        <Text
          variant="caption"
          tone="muted"
          style={{ textAlign: 'center', textDecorationLine: 'line-through' }}
        >
          {money(price.originalTotal)}
        </Text>
      ) : null}

      <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
        {money(price.monthlyEffective)} / {perMonth}
      </Text>
    </Surface>
  );
}

function FeatureCell({ value }: { value: boolean | string }): React.JSX.Element {
  const { tokens } = useTheme();
  const cell = classifyCell(value);

  if (cell.kind === 'included') {
    return <Ionicons name="checkmark-circle" size={20} color={tokens.color.success} />;
  }
  if (cell.kind === 'excluded') {
    return <Ionicons name="close-circle" size={20} color={tokens.color.danger} />;
  }
  return (
    <Text variant="label" tone="primary" style={{ textAlign: 'center' }}>
      {cell.text}
    </Text>
  );
}
