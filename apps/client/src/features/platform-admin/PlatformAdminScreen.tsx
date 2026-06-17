/**
 * Platform Admin overview (index) — OUR internal control layer over the SaaS customers.
 *
 * Decision-first and compact: a safety note, KPI strip, customer-health list (filterable),
 * next admin tasks, then below-the-fold site/sync health, subscription breakdown, recent
 * security/audit signals, usage/limits, and a support operations summary.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real billing/backend/PII. Built entirely from the shared
 * Ecme-inspired UI primitives. See security-model.md.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import {
  Card,
  ChartCard,
  DataListRow,
  EmptyState,
  ErrorState,
  HealthScoreBadge,
  LoadingState,
  MetricCard,
  MiniBars,
  Screen,
  SegmentedControl,
  StatusBadge,
  Text,
  type MiniBarDatum,
} from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { PlatformTenant } from '@/domain/types';

import {
  connectionMeta,
  HEALTH_LABEL_KEYS,
  planTierLabelKey,
  priorityMeta,
  securityTypeLabelKey,
  severityMeta,
  subscriptionStateMeta,
  syncStateMeta,
  tenantStatusMeta,
} from './platformAdminHelpers';
import { usePlatformOverview, usePlatformTenants, usePlatformUsage } from './usePlatformAdmin';

type TenantFilter = 'all' | 'at_risk' | 'past_due';

export function PlatformAdminScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as Href);

  const overview = usePlatformOverview();
  const tenantsQuery = usePlatformTenants();
  const usageQuery = usePlatformUsage();
  const [filter, setFilter] = useState<TenantFilter>('all');

  const healthLabels = {
    healthy: t(HEALTH_LABEL_KEYS.healthy),
    degraded: t(HEALTH_LABEL_KEYS.degraded),
    critical: t(HEALTH_LABEL_KEYS.critical),
  };

  const tenants = useMemo(() => tenantsQuery.data ?? [], [tenantsQuery.data]);
  const filteredTenants = useMemo(() => {
    if (filter === 'at_risk') return tenants.filter((x) => x.healthScore < 70);
    if (filter === 'past_due') return tenants.filter((x) => x.subscription.state === 'past_due');
    return tenants;
  }, [tenants, filter]);

  const tenantName = (id?: string) => tenants.find((x) => x.id === id)?.name ?? id ?? '—';
  const nearLimit = (usageQuery.data ?? []).filter((u) => u.nearLimit);

  if (overview.isPending) {
    return (
      <Screen testID="platform-admin-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }
  if (overview.isError || !overview.data) {
    return (
      <Screen testID="platform-admin-screen">
        <ErrorState
          title={t('common.error')}
          retryLabel={t('common.retry')}
          onRetry={() => overview.refetch()}
        />
      </Screen>
    );
  }

  const data = overview.data;
  const k = data.kpis;

  const renderTenantRow = (tenant: PlatformTenant) => {
    const status = tenantStatusMeta(tenant.status);
    return (
      <DataListRow
        key={tenant.id}
        title={tenant.name}
        subtitle={`${t(status.labelKey)} · ${t(planTierLabelKey(tenant.subscription.tier))} · ${fmt.num(tenant.sitesCount)} ${t('platformAdmin.tenant.sitesLabel')}`}
        trailing={<HealthScoreBadge score={tenant.healthScore} labels={healthLabels} />}
        onPress={() => go(`/platform-admin/customers/${tenant.id}`)}
      />
    );
  };

  const subscriptionBars: MiniBarDatum[] = data.subscriptionBreakdown.map((b) => ({
    label: t(subscriptionStateMeta(b.state).labelKey),
    value: b.count,
    highlight: b.state === 'active',
  }));

  return (
    <Screen testID="platform-admin-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('platformAdmin.title')}</Text>
        <Text tone="muted">{t('platformAdmin.subtitle')}</Text>
      </View>

      <SecurityNote messageKey="platformAdmin.security.note" />

      {/* KPI strip */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
        <MetricCard label={t('platformAdmin.kpi.customers')} value={fmt.num(k.totalCustomers)} icon="people-outline" tint="primary" />
        <MetricCard label={t('platformAdmin.kpi.activeSites')} value={fmt.num(k.activeSites)} icon="globe-outline" tint="info" />
        <MetricCard label={t('platformAdmin.kpi.mrr')} value={fmt.money(k.mrr, k.currency)} icon="cash-outline" tint="success" />
        <MetricCard label={t('platformAdmin.kpi.openSupport')} value={fmt.num(k.openSupport)} icon="headset-outline" tint="warning" />
        <MetricCard label={t('platformAdmin.kpi.syncIssues')} value={fmt.num(k.syncIssues)} icon="sync-outline" tint="warning" />
        <MetricCard label={t('platformAdmin.kpi.securityAlerts')} value={fmt.num(k.securityAlerts)} icon="shield-checkmark-outline" tint="danger" />
      </View>

      {/* Customer health (filterable) */}
      <Card title={t('platformAdmin.section.atRisk')} contentStyle={{ gap: tokens.spacing.sm }}>
        <SegmentedControl<TenantFilter>
          value={filter}
          onChange={setFilter}
          stretch
          options={[
            { value: 'all', label: t('platformAdmin.filter.all') },
            { value: 'at_risk', label: t('platformAdmin.filter.atRisk') },
            { value: 'past_due', label: t('platformAdmin.filter.pastDue') },
          ]}
        />
        {filteredTenants.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.tenants')}</Text>
        ) : (
          filteredTenants.map(renderTenantRow)
        )}
      </Card>

      {/* Next admin tasks */}
      <Card title={t('platformAdmin.section.tasks')} contentStyle={{ gap: tokens.spacing.sm }}>
        {data.topTasks.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.tasks')}</Text>
        ) : (
          data.topTasks.map((task) => (
            <DataListRow
              key={task.id}
              title={task.title}
              subtitle={`${t('platformAdmin.task.next')}: ${task.nextAction}`}
              trailing={<StatusBadge tone={priorityMeta(task.priority).tone} label={t(priorityMeta(task.priority).labelKey)} />}
              onPress={task.tenantId ? () => go(`/platform-admin/customers/${task.tenantId}`) : undefined}
            />
          ))
        )}
      </Card>

      {/* Site & sync health */}
      <Card title={t('platformAdmin.section.sitesHealth')} contentStyle={{ gap: tokens.spacing.sm }}>
        {data.sitesAtRisk.map((site) => (
          <DataListRow
            key={site.id}
            title={site.name}
            subtitle={`${t(connectionMeta(site.connection).labelKey)} · ${t(syncStateMeta(site.sync.state).labelKey)} · ${t('platformAdmin.site.plugin')} v${site.plugin.pluginVersion}`}
            trailing={<HealthScoreBadge score={site.healthScore} labels={healthLabels} />}
            onPress={() => go(`/platform-admin/customers/${site.tenantId}`)}
          />
        ))}
      </Card>

      {/* Subscription health */}
      <ChartCard
        title={t('platformAdmin.section.subscriptions')}
        legend={[
          { label: t('platformAdmin.subState.active'), color: tokens.color.primary },
          { label: t('platformAdmin.filter.all'), color: tokens.color.primarySoft },
        ]}
      >
        <MiniBars data={subscriptionBars} height={120} />
      </ChartCard>

      {/* Recent security & audit */}
      <Card title={t('platformAdmin.section.security')} contentStyle={{ gap: tokens.spacing.sm }}>
        {data.recentSecuritySignals.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.signals')}</Text>
        ) : (
          data.recentSecuritySignals.map((sig) => (
            <DataListRow
              key={sig.id}
              title={`${t(securityTypeLabelKey(sig.type))} · ${tenantName(sig.tenantId)}`}
              subtitle={sig.message}
              trailing={<StatusBadge tone={severityMeta(sig.severity).tone} label={t(severityMeta(sig.severity).labelKey)} />}
            />
          ))
        )}
      </Card>

      {/* Usage & limits */}
      <Card title={t('platformAdmin.section.usage')} contentStyle={{ gap: tokens.spacing.sm }}>
        {nearLimit.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.tenants')}</Text>
        ) : (
          nearLimit.map((u) => (
            <DataListRow
              key={u.tenantId}
              title={tenantName(u.tenantId)}
              subtitle={`${t('platformAdmin.usage.api')}: ${fmt.num(u.apiCalls)} / ${fmt.num(u.apiLimit)}`}
              trailing={<StatusBadge tone="warning" label={t('platformAdmin.usage.nearLimit')} />}
            />
          ))
        )}
      </Card>

      {/* Support operations */}
      <Card title={t('platformAdmin.section.support')} contentStyle={{ gap: tokens.spacing.sm }}>
        {tenants.filter((x) => x.support.openItems > 0).length === 0 ? (
          <EmptyState title={t('platformAdmin.empty.tasks')} icon="headset-outline" fill={false} />
        ) : (
          tenants
            .filter((x) => x.support.openItems > 0)
            .map((tenant) => (
              <DataListRow
                key={tenant.id}
                title={tenant.name}
                subtitle={`${fmt.num(tenant.support.openItems)} · ${tenant.support.owner ?? '—'}`}
                trailing={<StatusBadge tone={priorityMeta(tenant.support.priority).tone} label={t(priorityMeta(tenant.support.priority).labelKey)} />}
                onPress={() => go(`/platform-admin/customers/${tenant.id}`)}
              />
            ))
        )}
      </Card>
    </Screen>
  );
}
