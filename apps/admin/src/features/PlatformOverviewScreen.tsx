/**
 * Platform Admin overview — decision-first internal control surface.
 * Mock-only. KPIs + customer health (filterable) + next tasks above the fold; site/sync
 * health, subscription breakdown, recent security, usage, and support below.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import {
  Card,
  DataListRow,
  EmptyState,
  ErrorState,
  HealthScoreBadge,
  LoadingState,
  MetricCard,
  Screen,
  SegmentedControl,
  StatusBadge,
  Surface,
  Text,
} from '@/ui';
import type { PlatformTenant } from '@/domain/types';
import { platformService } from '@/services/platformService';

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
} from './helpers';

type TenantFilter = 'all' | 'at_risk' | 'past_due';

export function PlatformOverviewScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as Href);

  const overview = useAsync(() => platformService.getOverview(), []);
  const tenants = useAsync(() => platformService.listTenants(), []);
  const usage = useAsync(() => platformService.listUsage(), []);
  const [filter, setFilter] = useState<TenantFilter>('all');

  const healthLabels = {
    healthy: t(HEALTH_LABEL_KEYS.healthy),
    degraded: t(HEALTH_LABEL_KEYS.degraded),
    critical: t(HEALTH_LABEL_KEYS.critical),
  };

  const allTenants = useMemo(() => tenants.data ?? [], [tenants.data]);
  const filtered = useMemo(() => {
    if (filter === 'at_risk') return allTenants.filter((x) => x.healthScore < 70);
    if (filter === 'past_due') return allTenants.filter((x) => x.subscription.state === 'past_due');
    return allTenants;
  }, [allTenants, filter]);
  const tenantName = (id?: string) => allTenants.find((x) => x.id === id)?.name ?? id ?? '—';
  const nearLimit = (usage.data ?? []).filter((u) => u.nearLimit);

  if (overview.loading) {
    return (
      <Screen testID="platform-overview-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }
  if (overview.error || !overview.data) {
    return (
      <Screen testID="platform-overview-screen">
        <ErrorState title={t('common.error')} retryLabel={t('common.retry')} onRetry={overview.reload} />
      </Screen>
    );
  }

  const data = overview.data;
  const k = data.kpis;

  const tenantRow = (tenant: PlatformTenant) => {
    const status = tenantStatusMeta(tenant.status);
    return (
      <DataListRow
        key={tenant.id}
        title={tenant.name}
        subtitle={`${t(status.labelKey)} · ${t(planTierLabelKey(tenant.subscription.tier))} · ${fmt.num(tenant.sitesCount)} ${t('platformAdmin.tenant.sitesLabel')}`}
        trailing={<HealthScoreBadge score={tenant.healthScore} labels={healthLabels} />}
        onPress={() => go(`/customers/${tenant.id}`)}
      />
    );
  };

  return (
    <Screen testID="platform-overview-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('platformAdmin.title')}</Text>
        <Text tone="muted">{t('platformAdmin.subtitle')}</Text>
      </View>

      <Surface bordered padding="md">
        <Text variant="caption" tone="muted">
          {t('platformAdmin.security.note')}
        </Text>
      </Surface>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.md }}>
        <MetricCard label={t('platformAdmin.kpi.customers')} value={fmt.num(k.totalCustomers)} tint="primary" />
        <MetricCard label={t('platformAdmin.kpi.activeSites')} value={fmt.num(k.activeSites)} tint="info" />
        <MetricCard label={t('platformAdmin.kpi.mrr')} value={fmt.money(k.mrr, k.currency)} tint="success" />
        <MetricCard label={t('platformAdmin.kpi.openSupport')} value={fmt.num(k.openSupport)} tint="warning" />
        <MetricCard label={t('platformAdmin.kpi.syncIssues')} value={fmt.num(k.syncIssues)} tint="warning" />
        <MetricCard label={t('platformAdmin.kpi.securityAlerts')} value={fmt.num(k.securityAlerts)} tint="danger" />
      </View>

      <Card title={t('platformAdmin.section.atRisk')}>
        <SegmentedControl<TenantFilter>
          value={filter}
          onChange={setFilter}
          stretch
          options={[
            { value: 'all', label: t('common.all') },
            { value: 'at_risk', label: t('platformAdmin.filter.atRisk') },
            { value: 'past_due', label: t('platformAdmin.filter.pastDue') },
          ]}
        />
        {filtered.length === 0 ? <Text tone="muted">{t('platformAdmin.empty.tenants')}</Text> : filtered.map(tenantRow)}
      </Card>

      <Card title={t('platformAdmin.section.tasks')}>
        {data.topTasks.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.tasks')}</Text>
        ) : (
          data.topTasks.map((task) => (
            <DataListRow
              key={task.id}
              title={task.title}
              subtitle={`${t('platformAdmin.task.next')}: ${task.nextAction}`}
              trailing={<StatusBadge tone={priorityMeta(task.priority).tone} label={t(priorityMeta(task.priority).labelKey)} />}
              onPress={task.tenantId ? () => go(`/customers/${task.tenantId}`) : undefined}
            />
          ))
        )}
      </Card>

      <Card title={t('platformAdmin.section.sitesHealth')}>
        {data.sitesAtRisk.map((site) => (
          <DataListRow
            key={site.id}
            title={site.name}
            subtitle={`${t(connectionMeta(site.connection).labelKey)} · ${t(syncStateMeta(site.sync.state).labelKey)} · ${t('platformAdmin.site.plugin')} v${site.plugin.pluginVersion}`}
            trailing={<HealthScoreBadge score={site.healthScore} labels={healthLabels} />}
            onPress={() => go(`/customers/${site.tenantId}`)}
          />
        ))}
      </Card>

      <Card title={t('platformAdmin.section.subscriptions')}>
        {data.subscriptionBreakdown.map((b) => (
          <View
            key={b.state}
            style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm, paddingVertical: 3 }}
          >
            <StatusBadge tone={subscriptionStateMeta(b.state).tone} label={t(subscriptionStateMeta(b.state).labelKey)} dot={false} />
            <Text variant="label">{fmt.num(b.count)}</Text>
          </View>
        ))}
      </Card>

      <Card title={t('platformAdmin.section.security')}>
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

      <Card title={t('platformAdmin.section.usage')}>
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

      <Card title={t('platformAdmin.section.support')}>
        {allTenants.filter((x) => x.support.openItems > 0).length === 0 ? (
          <EmptyState title={t('platformAdmin.empty.tasks')} />
        ) : (
          allTenants
            .filter((x) => x.support.openItems > 0)
            .map((tenant) => (
              <DataListRow
                key={tenant.id}
                title={tenant.name}
                subtitle={`${fmt.num(tenant.support.openItems)} · ${tenant.support.owner ?? '—'}`}
                trailing={<StatusBadge tone={priorityMeta(tenant.support.priority).tone} label={t(priorityMeta(tenant.support.priority).labelKey)} />}
                onPress={() => go(`/customers/${tenant.id}`)}
              />
            ))
        )}
      </Card>
    </Screen>
  );
}
