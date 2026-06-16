/**
 * StoreContextCard — a lightweight, frontend-safe snapshot of the store the advisor uses to
 * ground its suggestions (sales, orders, products, customers, stock, fulfillment, plan).
 */
import React from 'react';
import { View } from 'react-native';

import { Card, Surface, Text } from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import type { AIAdvisorStoreContextSummary } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

export interface StoreContextCardProps {
  context: AIAdvisorStoreContextSummary;
}

export function StoreContextCard({ context }: StoreContextCardProps): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();

  const stats: { labelKey: StringKey; value: string }[] = [
    { labelKey: 'advisor.context.sales', value: `${context.salesTotal} ${context.currency}` },
    { labelKey: 'advisor.context.orders', value: String(context.ordersCount) },
    { labelKey: 'advisor.context.products', value: String(context.productsCount) },
    { labelKey: 'advisor.context.customers', value: String(context.customersCount) },
    { labelKey: 'advisor.context.lowStock', value: String(context.lowStockCount) },
    { labelKey: 'advisor.context.outOfStock', value: String(context.outOfStockCount) },
    { labelKey: 'advisor.context.fulfillmentPending', value: String(context.fulfillmentPending) },
    { labelKey: 'advisor.context.plan', value: context.planName },
  ];

  return (
    <Card title={t('advisor.context.title')} testID="advisor-context">
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        {stats.map((stat) => (
          <Surface
            key={stat.labelKey}
            variant="surfaceAlt"
            padding="sm"
            style={{ flexGrow: 1, flexBasis: 140, minWidth: 120, gap: 2 }}
          >
            <Text variant="caption" tone="muted">
              {t(stat.labelKey)}
            </Text>
            <Text variant="subheading">{stat.value}</Text>
          </Surface>
        ))}
      </View>
      {context.topProductName ? (
        <Text variant="caption" tone="muted">
          {t('advisor.context.topProduct')}: {context.topProductName}
        </Text>
      ) : null}
    </Card>
  );
}
