/**
 * Reports & Analytics (index) — lightweight, mock-only business reporting.
 *
 * Sections: header + privacy note, provider/readiness status, period selector, executive
 * summary, sales report, product performance, customer report, inventory report, search
 * demand, campaign/SMS readiness, a conversion funnel (progress rows — no chart library), and
 * review-only insights + recommendations.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real analytics provider, no GA4, no WooCommerce Reports API,
 * no tracking/cookies, no external send, no PII beyond mock data, no export (see
 * security-model.md). Changing the period only re-fetches scaled mock values.
 */
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import {
  Badge,
  Button,
  Card,
  ChartCard,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  MiniBars,
  Screen,
  Surface,
  Text,
  type MiniBarDatum,
} from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatNumber } from '@/utils/format';
import type {
  AnalyticsReadiness,
  ProductPerformanceEntry,
  ReportPeriod,
  SearchDemandInsight,
} from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  audienceKindLabelKey,
  campaignReadinessMeta,
  consentMeta,
  insightCategoryLabelKey,
  PERIOD_OPTIONS,
  priorityMeta,
  readinessMeta,
  recommendationTypeLabelKey,
  restockPriorityMeta,
  stockRiskMeta,
  trendMeta,
} from './reportsHelpers';
import { useReportsOverview } from './useReports';

const READINESS_ROWS: { key: keyof AnalyticsReadiness; labelKey: StringKey }[] = [
  { key: 'analyticsProvider', labelKey: 'reports.readinessRow.analyticsProvider' },
  { key: 'wooCommerceReports', labelKey: 'reports.readinessRow.wooCommerceReports' },
  { key: 'ga4', labelKey: 'reports.readinessRow.ga4' },
  { key: 'backendPipeline', labelKey: 'reports.readinessRow.backendPipeline' },
  { key: 'webhooks', labelKey: 'reports.readinessRow.webhooks' },
  { key: 'export', labelKey: 'reports.readinessRow.export' },
];

/** A compact KPI tile used across summary/section grids. */
function StatTile({
  label,
  value,
  trendBadge,
}: {
  label: string;
  value: string;
  trendBadge?: React.ReactNode;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <Surface
      variant="surfaceAlt"
      padding="sm"
      style={{ flexGrow: 1, flexBasis: 150, minWidth: 130, gap: 4 }}
    >
      <Text variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </Text>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.xs,
        }}
      >
        <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
          {value}
        </Text>
        {trendBadge}
      </View>
    </Surface>
  );
}

/** A horizontal progress row (no chart library — RN View width fraction). */
function BarRow({
  label,
  valueText,
  fraction,
  tone = 'primary',
}: {
  label: string;
  valueText: string;
  fraction: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const pct = Math.max(2, Math.min(100, Math.round(fraction * 100)));
  const fillColor =
    tone === 'success'
      ? tokens.color.success
      : tone === 'warning'
        ? tokens.color.warning
        : tone === 'danger'
          ? tokens.color.danger
          : tone === 'info'
            ? tokens.color.info
            : tokens.color.primary;
  return (
    <View style={{ gap: 4, paddingVertical: tokens.spacing.xs }}>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <Text variant="caption" numberOfLines={1} style={{ flexShrink: 1 }}>
          {label}
        </Text>
        <Text variant="caption" tone="muted">
          {valueText}
        </Text>
      </View>
      <View
        style={{
          flexDirection: rowDirection,
          height: 8,
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.surfaceAlt,
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: pct, backgroundColor: fillColor, borderRadius: tokens.radius.pill }} />
        {pct < 100 ? <View style={{ flex: 100 - pct }} /> : null}
      </View>
    </View>
  );
}

/** A product row shared by the top / low / stock-risk performance lists. */
function ProductPerfRow({
  entry,
  currency,
  showDivider,
}: {
  entry: ProductPerformanceEntry;
  currency: string;
  showDivider: boolean;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const risk = stockRiskMeta(entry.stockRisk);
  return (
    <View>
      {showDivider ? <Divider /> : null}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.sm,
          paddingVertical: tokens.spacing.sm,
        }}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" numberOfLines={1}>
            {entry.productName}
          </Text>
          <Text variant="caption" tone="muted">
            {entry.sku} · {formatNumber(entry.unitsSold)} {t('orders.items')} ·{' '}
            {entry.revenueSharePercent}%
          </Text>
        </View>
        <Text variant="caption">{formatCurrency(entry.revenue, currency)}</Text>
        {entry.stockRisk !== 'none' ? <Badge tone={risk.tone} label={t(risk.labelKey)} /> : null}
        {entry.href ? (
          <Button
            label={t('reports.action.open')}
            variant="ghost"
            size="sm"
            onPress={() => router.navigate(entry.href as never)}
          />
        ) : null}
      </View>
    </View>
  );
}

/** A search-demand term row shared by the top / no-match / restock lists. */
function SearchDemandRow({
  insight,
  showDivider,
}: {
  insight: SearchDemandInsight;
  showDivider: boolean;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  return (
    <View>
      {showDivider ? <Divider /> : null}
      <View style={{ paddingVertical: tokens.spacing.sm, gap: 4 }}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            gap: tokens.spacing.xs,
            flexWrap: 'wrap',
          }}
        >
          <Text variant="label" style={{ flexShrink: 1 }}>
            {insight.term}
          </Text>
          <Badge tone="neutral" label={`${insight.count}`} />
          <Badge
            tone={insight.matched ? 'success' : 'warning'}
            label={insight.matched ? t('reports.search.matched') : t('reports.search.noMatch')}
          />
        </View>
        <Text variant="caption" tone="muted">
          {insight.suggestedAction}
        </Text>
      </View>
    </View>
  );
}

export function ReportsScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const [period, setPeriod] = useState<ReportPeriod>('last_30_days');
  const query = useReportsOverview(period);

  const currency = query.data?.executiveSummary.currency ?? 'USD';
  const money = (value: string) => formatCurrency(value, currency);

  return (
    <Screen testID="reports-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('reports.title')}</Text>
        <Text tone="muted">{t('reports.subtitle')}</Text>
      </View>

      <SecurityNote messageKey="reports.safety.note" />

      {/* C. Period selector */}
      <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        {PERIOD_OPTIONS.map((option) => (
          <Button
            key={option.period}
            label={t(option.labelKey)}
            variant={option.period === period ? 'primary' : 'secondary'}
            size="sm"
            onPress={() => setPeriod(option.period)}
          />
        ))}
      </View>

      {query.isPending ? (
        <LoadingState label={t('common.loading')} fill={false} />
      ) : query.isError || !query.data ? (
        <ErrorState
          title={t('reports.error')}
          retryLabel={t('common.retry')}
          onRetry={() => query.refetch()}
          fill={false}
        />
      ) : (
        <>
          {/* B. Provider / readiness */}
          <Card title={t('reports.readinessTitle')}>
            {READINESS_ROWS.map((row, index) => {
              const meta = readinessMeta(String(query.data.readiness[row.key]));
              return (
                <View key={row.key}>
                  {index > 0 ? <Divider /> : null}
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: tokens.spacing.sm,
                      paddingVertical: tokens.spacing.xs,
                    }}
                  >
                    <Text variant="label">{t(row.labelKey)}</Text>
                    <Badge tone={meta.tone} label={t(meta.labelKey)} />
                  </View>
                </View>
              );
            })}
          </Card>

          {/* D. Executive summary */}
          <Card title={t('reports.executiveTitle')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
              {query.data.executiveSummary.metrics.map((metric) => {
                const trend = trendMeta(metric.trend);
                return (
                  <StatTile
                    key={metric.id}
                    label={metric.label}
                    value={metric.value}
                    trendBadge={
                      <Badge
                        tone={trend.tone}
                        label={
                          metric.changeLabel
                            ? `${trend.symbol} ${metric.changeLabel}`
                            : trend.symbol
                        }
                      />
                    }
                  />
                );
              })}
            </View>
          </Card>

          {/* E. Sales report */}
          <Card title={t('reports.salesTitle')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
              <StatTile
                label={t('reports.sales.total')}
                value={money(query.data.sales.totalSales)}
                trendBadge={
                  <Badge
                    tone={trendMeta(query.data.sales.trend).tone}
                    label={`${trendMeta(query.data.sales.trend).symbol} ${query.data.sales.changeLabel ?? ''}`}
                  />
                }
              />
              <StatTile
                label={t('reports.sales.orders')}
                value={formatNumber(query.data.sales.ordersCount)}
              />
              <StatTile
                label={t('reports.sales.aov')}
                value={money(query.data.sales.averageOrderValue)}
              />
            </View>
            {query.data.sales.bestDayLabel ? (
              <Text variant="caption" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
                {t('reports.sales.bestDay')}: {query.data.sales.bestDayLabel}
                {query.data.sales.bestDaySales ? ` · ${money(query.data.sales.bestDaySales)}` : ''}
              </Text>
            ) : null}

            <Divider />
            <Text variant="label" tone="muted">
              {t('reports.sales.byStatus')}
            </Text>
            {query.data.sales.byStatus.map((entry, index) => (
              <View key={entry.status}>
                {index > 0 ? <Divider /> : null}
                <View
                  style={{
                    flexDirection: rowDirection,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                  }}
                >
                  <Text variant="caption">{t(`orders.status.${entry.status}` as StringKey)}</Text>
                  <Text variant="caption" tone="muted">
                    {formatNumber(entry.orders)} · {money(entry.revenue)}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {/* E2. Sales trend — Ecme-style chart panel (dependency-free MiniBars). */}
          <ChartCard
            title={t('reports.chart.salesTrend')}
            subtitle={t('reports.chart.salesTrendCaption')}
            headerAction={<Badge tone="neutral" label={t('reports.chart.period')} />}
            legend={[
              { label: t('reports.chart.legendSales'), color: tokens.color.borderStrong },
              { label: t('reports.chart.legendBest'), color: tokens.color.primary },
            ]}
          >
            {query.data.sales.trendPoints.length === 0 ? (
              <Text tone="muted">{t('reports.chart.empty')}</Text>
            ) : (
              <MiniBars
                height={120}
                data={query.data.sales.trendPoints.map<MiniBarDatum>((point) => ({
                  label: point.label,
                  value: Number.parseFloat(point.value),
                  highlight: point.label === query.data.sales.bestDayLabel,
                }))}
              />
            )}
          </ChartCard>

          {/* F. Product performance */}
          <Card title={t('reports.productTitle')}>
            <Text variant="label" tone="muted">
              {t('reports.product.top')}
            </Text>
            {query.data.productPerformance.topProducts.map((entry, index) => (
              <ProductPerfRow
                key={entry.productId}
                entry={entry}
                currency={currency}
                showDivider={index > 0}
              />
            ))}
            <Divider />
            <Text variant="label" tone="muted">
              {t('reports.product.low')}
            </Text>
            {query.data.productPerformance.lowPerformers.map((entry, index) => (
              <ProductPerfRow
                key={entry.productId}
                entry={entry}
                currency={currency}
                showDivider={index > 0}
              />
            ))}
            {query.data.productPerformance.stockRisk.length > 0 ? (
              <>
                <Divider />
                <Text variant="label" tone="muted">
                  {t('reports.product.stockRisk')}
                </Text>
                {query.data.productPerformance.stockRisk.map((entry, index) => (
                  <ProductPerfRow
                    key={entry.productId}
                    entry={entry}
                    currency={currency}
                    showDivider={index > 0}
                  />
                ))}
              </>
            ) : null}
          </Card>

          {/* G. Customer report */}
          <Card title={t('reports.customerTitle')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
              <StatTile
                label={t('reports.customer.total')}
                value={formatNumber(query.data.customers.totalCustomers)}
              />
              <StatTile
                label={t('reports.customer.repeat')}
                value={`${formatNumber(query.data.customers.repeatCustomers)} · ${query.data.customers.repeatRatePercent}%`}
              />
              <StatTile
                label={t('reports.customer.vip')}
                value={formatNumber(query.data.customers.vipCustomers)}
              />
              <StatTile
                label={t('reports.customer.inactive')}
                value={formatNumber(query.data.customers.inactiveCustomers)}
              />
            </View>
            <Text variant="caption" tone="muted" style={{ marginTop: tokens.spacing.sm }}>
              {query.data.customers.retentionOpportunity}
            </Text>
            <View style={{ flexDirection: rowDirection, marginTop: tokens.spacing.sm }}>
              <Button
                label={t('reports.action.viewCustomers')}
                variant="secondary"
                size="sm"
                onPress={() => go('/customers')}
              />
            </View>
          </Card>

          {/* H. Inventory report */}
          <Card title={t('reports.inventoryTitle')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
              <StatTile
                label={t('reports.inventory.lowStock')}
                value={formatNumber(query.data.inventory.lowStock)}
              />
              <StatTile
                label={t('reports.inventory.outOfStock')}
                value={formatNumber(query.data.inventory.outOfStock)}
              />
              <StatTile
                label={t('reports.inventory.backorder')}
                value={formatNumber(query.data.inventory.backorder)}
              />
            </View>
            <Divider />
            <Text variant="label" tone="muted">
              {t('reports.inventory.restockPriority')}
            </Text>
            {query.data.inventory.restockPriority.length === 0 ? (
              <Text tone="muted">{t('reports.inventory.healthy')}</Text>
            ) : (
              query.data.inventory.restockPriority.map((item, index) => {
                const meta = restockPriorityMeta(item.priority);
                return (
                  <View key={item.productId}>
                    {index > 0 ? <Divider /> : null}
                    <View
                      style={{
                        flexDirection: rowDirection,
                        alignItems: 'center',
                        gap: tokens.spacing.sm,
                        paddingVertical: tokens.spacing.sm,
                      }}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="label" numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <Text variant="caption" tone="muted">
                          {item.sku} · {item.stockStatus}
                        </Text>
                      </View>
                      <Badge tone={meta.tone} label={t(meta.labelKey)} />
                      {item.href ? (
                        <Button
                          label={t('reports.action.open')}
                          variant="ghost"
                          size="sm"
                          onPress={() => go(item.href as string)}
                        />
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ flexDirection: rowDirection, marginTop: tokens.spacing.sm }}>
              <Button
                label={t('reports.action.viewInventory')}
                variant="secondary"
                size="sm"
                onPress={() => go('/inventory')}
              />
            </View>
          </Card>

          {/* I. Search demand */}
          <Card title={t('reports.searchTitle')}>
            <Text variant="label" tone="muted">
              {t('reports.search.top')}
            </Text>
            {query.data.searchDemand.topTerms.map((insight, index) => (
              <SearchDemandRow key={insight.id} insight={insight} showDivider={index > 0} />
            ))}
            {query.data.searchDemand.noMatchTerms.length > 0 ? (
              <>
                <Divider />
                <Text variant="label" tone="muted">
                  {t('reports.search.noMatchTitle')}
                </Text>
                {query.data.searchDemand.noMatchTerms.map((insight, index) => (
                  <SearchDemandRow key={insight.id} insight={insight} showDivider={index > 0} />
                ))}
              </>
            ) : null}
            {query.data.searchDemand.restockTerms.length > 0 ? (
              <>
                <Divider />
                <Text variant="label" tone="muted">
                  {t('reports.search.restockTitle')}
                </Text>
                {query.data.searchDemand.restockTerms.map((insight, index) => (
                  <SearchDemandRow key={insight.id} insight={insight} showDivider={index > 0} />
                ))}
              </>
            ) : null}
          </Card>

          {/* J. Campaign / SMS readiness */}
          <Card title={t('reports.campaignTitle')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
              <StatTile
                label={t('reports.campaign.backInStock')}
                value={formatNumber(query.data.campaignReadiness.backInStockAudiences)}
              />
              <StatTile
                label={t('reports.campaign.abandoned')}
                value={formatNumber(query.data.campaignReadiness.abandonedCartCandidates)}
              />
              <StatTile
                label={t('reports.campaign.vip')}
                value={formatNumber(query.data.campaignReadiness.vipReactivationCandidates)}
              />
              <StatTile
                label={t('reports.campaign.drafts')}
                value={formatNumber(query.data.campaignReadiness.draftsReadyForReview)}
              />
            </View>
            <View
              style={{
                flexDirection: rowDirection,
                alignItems: 'center',
                gap: tokens.spacing.xs,
                marginTop: tokens.spacing.sm,
              }}
            >
              <Text variant="caption" tone="muted">
                {t('reports.campaign.consent')}
              </Text>
              <Badge
                tone={readinessMeta(query.data.campaignReadiness.consentReadiness).tone}
                label={t(readinessMeta(query.data.campaignReadiness.consentReadiness).labelKey)}
              />
            </View>
            <Divider />
            {query.data.campaignReadiness.audiences.map((audience, index) => {
              const ready = campaignReadinessMeta(audience.readiness);
              const consent = consentMeta(audience.consent);
              return (
                <View key={audience.id}>
                  {index > 0 ? <Divider /> : null}
                  <View style={{ paddingVertical: tokens.spacing.sm, gap: 4 }}>
                    <View
                      style={{
                        flexDirection: rowDirection,
                        alignItems: 'center',
                        gap: tokens.spacing.xs,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Text variant="label" style={{ flexShrink: 1 }}>
                        {audience.label}
                      </Text>
                      <Badge tone="neutral" label={`${formatNumber(audience.size)}`} />
                      <Badge tone={ready.tone} label={t(ready.labelKey)} />
                      <Badge tone={consent.tone} label={t(consent.labelKey)} />
                    </View>
                    <Text variant="caption" tone="muted">
                      {t(audienceKindLabelKey(audience.kind))}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={{ flexDirection: rowDirection, marginTop: tokens.spacing.sm }}>
              <Button
                label={t('reports.action.viewAutomations')}
                variant="secondary"
                size="sm"
                onPress={() => go('/automations')}
              />
            </View>
          </Card>

          {/* K. Conversion funnel */}
          <Card title={t('reports.funnelTitle')}>
            <Text variant="caption" tone="muted">
              {t('reports.funnel.overall')}: {query.data.funnel.overallConversionPercent}%
            </Text>
            <View style={{ marginTop: tokens.spacing.sm }}>
              {query.data.funnel.steps.map((step) => (
                <BarRow
                  key={step.step}
                  label={`${step.label} · ${step.conversionPercent}%`}
                  valueText={formatNumber(step.count)}
                  fraction={step.conversionPercent / 100}
                  tone={
                    step.step === 'purchase'
                      ? 'success'
                      : step.step === 'abandoned_cart'
                        ? 'danger'
                        : 'primary'
                  }
                />
              ))}
            </View>
          </Card>

          {/* L. Insights */}
          <Card title={t('reports.insightsTitle')}>
            {query.data.insights.map((insight, index) => (
              <View key={insight.id}>
                {index > 0 ? <Divider /> : null}
                <View style={{ paddingVertical: tokens.spacing.sm, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: rowDirection,
                      alignItems: 'center',
                      gap: tokens.spacing.xs,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Text variant="label" style={{ flexShrink: 1 }}>
                      {insight.title}
                    </Text>
                    <Badge tone="info" label={t(insightCategoryLabelKey(insight.category))} />
                    {insight.trend ? (
                      <Badge
                        tone={trendMeta(insight.trend).tone}
                        label={trendMeta(insight.trend).symbol}
                      />
                    ) : null}
                  </View>
                  <Text variant="caption" tone="muted">
                    {insight.summary}
                  </Text>
                </View>
              </View>
            ))}
          </Card>

          {/* L. Recommendations */}
          <Card title={t('reports.recommendationsTitle')}>
            {query.data.recommendations.length === 0 ? (
              <EmptyState title={t('reports.empty')} icon="bar-chart-outline" fill={false} />
            ) : (
              <View style={{ gap: tokens.spacing.sm }}>
                {query.data.recommendations.map((rec) => {
                  const priority = priorityMeta(rec.priority);
                  return (
                    <Surface key={rec.id} bordered padding="md" style={{ gap: tokens.spacing.sm }}>
                      <View
                        style={{
                          flexDirection: rowDirection,
                          alignItems: 'center',
                          gap: tokens.spacing.xs,
                          flexWrap: 'wrap',
                        }}
                      >
                        <Text variant="label" style={{ flexShrink: 1 }}>
                          {rec.title}
                        </Text>
                        <Badge tone="neutral" label={t(recommendationTypeLabelKey(rec.type))} />
                        <Badge tone={priority.tone} label={t(priority.labelKey)} />
                      </View>
                      <Text variant="caption" tone="muted">
                        {rec.summary}
                      </Text>
                      <Text variant="caption" tone="muted">
                        {rec.suggestedStep}
                      </Text>
                      {rec.href ? (
                        <View style={{ flexDirection: rowDirection }}>
                          <Button
                            label={t('reports.action.open')}
                            variant="secondary"
                            size="sm"
                            onPress={() => go(rec.href as string)}
                          />
                        </View>
                      ) : null}
                    </Surface>
                  );
                })}
              </View>
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}
