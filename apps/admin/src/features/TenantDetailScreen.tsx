/**
 * Platform Admin — customer/tenant detail. Profile, subscription, sites + plugin/sync health,
 * support/admin tasks, security signals, usage, internal-notes placeholder, and disabled mock
 * actions. Unknown ids show a clean not-found state. Mock-only.
 */
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import {
  Button,
  Card,
  DataListRow,
  Divider,
  EmptyState,
  HealthScoreBadge,
  LoadingState,
  MockActionButton,
  Screen,
  StatusBadge,
  Surface,
  Text,
} from '@/ui';
import { platformService } from '@/services/platformService';

import {
  adminTaskStatusMeta,
  connectionMeta,
  HEALTH_LABEL_KEYS,
  planTierLabelKey,
  securityTypeLabelKey,
  severityMeta,
  signedStateMeta,
  subscriptionStateMeta,
  syncStateMeta,
  tenantStatusMeta,
} from './helpers';

function DetailRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', gap: tokens.spacing.md, paddingVertical: 3 }}>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export function TenantDetailScreen({ tenantId }: { tenantId: string }): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const router = useRouter();

  const tenantQ = useAsync(() => platformService.getTenant(tenantId), [tenantId]);
  const sitesQ = useAsync(() => platformService.listSites(), []);
  const tasksQ = useAsync(() => platformService.listAdminTasks(), []);
  const signalsQ = useAsync(() => platformService.listSecuritySignals(), []);
  const usageQ = useAsync(() => platformService.listUsage(), []);

  const healthLabels = {
    healthy: t(HEALTH_LABEL_KEYS.healthy),
    degraded: t(HEALTH_LABEL_KEYS.degraded),
    critical: t(HEALTH_LABEL_KEYS.critical),
  };

  const back = () => router.navigate('/' as Href);

  if (tenantQ.loading) {
    return (
      <Screen testID="tenant-detail-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (tenantQ.error || !tenantQ.data) {
    return (
      <Screen testID="tenant-detail-screen">
        <EmptyState title={t('platformAdmin.notFound.title')} body={t('platformAdmin.notFound.body')} />
        <View style={{ alignItems: 'flex-start' }}>
          <Button label={t('platformAdmin.detail.back')} variant="secondary" size="sm" onPress={back} />
        </View>
      </Screen>
    );
  }

  const tenant = tenantQ.data;
  const status = tenantStatusMeta(tenant.status);
  const subState = subscriptionStateMeta(tenant.subscription.state);
  const sites = (sitesQ.data ?? []).filter((s) => s.tenantId === tenant.id);
  const tasks = (tasksQ.data ?? []).filter((x) => x.tenantId === tenant.id);
  const signals = (signalsQ.data ?? []).filter((x) => x.tenantId === tenant.id);
  const usage = (usageQ.data ?? []).find((u) => u.tenantId === tenant.id);

  return (
    <Screen testID="tenant-detail-screen">
      <View style={{ alignItems: 'flex-start' }}>
        <Button label={t('platformAdmin.detail.back')} variant="ghost" size="sm" onPress={back} />
      </View>

      <Card title={t('platformAdmin.detail.profile')}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.md }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="subheading" numberOfLines={1}>
              {tenant.name}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {tenant.owner.label} · {tenant.owner.email}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: tokens.spacing.xs }}>
            <HealthScoreBadge score={tenant.healthScore} labels={healthLabels} />
            <StatusBadge tone={status.tone} label={t(status.labelKey)} />
          </View>
        </View>
        <Divider />
        <DetailRow label={t('platformAdmin.owner')} value={tenant.owner.role ?? tenant.owner.label} />
        <DetailRow label={t('platformAdmin.tenant.lastActive')} value={fmt.date(tenant.lastActiveAt)} />
      </Card>

      <Card title={t('platformAdmin.detail.subscription')}>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
          <StatusBadge tone="primary" label={t(planTierLabelKey(tenant.subscription.tier))} dot={false} />
          <StatusBadge tone={subState.tone} label={t(subState.labelKey)} />
        </View>
        <DetailRow label={t('platformAdmin.mrr')} value={fmt.money(tenant.subscription.mrr, tenant.subscription.currency)} />
        {tenant.subscription.renewsAt ? <DetailRow label={t('platformAdmin.renews')} value={fmt.date(tenant.subscription.renewsAt)} /> : null}
        {tenant.subscription.trialEndsAt ? <DetailRow label={t('platformAdmin.trialEnds')} value={fmt.date(tenant.subscription.trialEndsAt)} /> : null}
      </Card>

      <Card title={t('platformAdmin.detail.sites')}>
        {sites.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.sites')}</Text>
        ) : (
          sites.map((site) => (
            <Surface key={site.id} bordered padding="md" style={{ gap: tokens.spacing.xs }}>
              <View style={{ flexDirection: rowDirection, alignItems: 'center', justifyContent: 'space-between', gap: tokens.spacing.sm }}>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text variant="label" numberOfLines={1}>
                    {site.name}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1} style={{ writingDirection: 'ltr' }}>
                    {site.url}
                  </Text>
                </View>
                <HealthScoreBadge score={site.healthScore} labels={healthLabels} />
              </View>
              <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
                <StatusBadge tone={connectionMeta(site.connection).tone} label={t(connectionMeta(site.connection).labelKey)} />
                <StatusBadge tone={syncStateMeta(site.sync.state).tone} label={t(syncStateMeta(site.sync.state).labelKey)} />
                <StatusBadge tone={signedStateMeta(site.sync.signed).tone} label={t(signedStateMeta(site.sync.signed).labelKey)} dot={false} />
                <StatusBadge
                  tone={site.plugin.wooCommerceActive ? 'success' : 'danger'}
                  label={site.plugin.wooCommerceActive ? t('platformAdmin.site.wooActive') : t('platformAdmin.site.wooMissing')}
                  dot={false}
                />
              </View>
              <DetailRow label={t('platformAdmin.site.plugin')} value={`v${site.plugin.pluginVersion} → v${site.plugin.latestVersion}`} />
              <DetailRow label={t('platformAdmin.site.lastSync')} value={site.sync.lastSyncAt ? fmt.date(site.sync.lastSyncAt) : t('platformAdmin.sync.never')} />
              <DetailRow label={`${t('platformAdmin.site.queued')} · ${t('platformAdmin.site.failures')}`} value={`${fmt.num(site.sync.queuedEvents)} · ${fmt.num(site.sync.failures)}`} />
            </Surface>
          ))
        )}
      </Card>

      <Card title={t('platformAdmin.detail.tasks')}>
        {tasks.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.tasks')}</Text>
        ) : (
          tasks.map((task) => (
            <DataListRow
              key={task.id}
              title={task.title}
              subtitle={task.blockedReason ? `${t('platformAdmin.task.blocked')}: ${task.blockedReason}` : `${t('platformAdmin.task.next')}: ${task.nextAction}`}
              trailing={<StatusBadge tone={adminTaskStatusMeta(task.status).tone} label={t(adminTaskStatusMeta(task.status).labelKey)} />}
            />
          ))
        )}
      </Card>

      <Card title={t('platformAdmin.detail.security')}>
        {signals.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.signals')}</Text>
        ) : (
          signals.map((sig) => (
            <DataListRow
              key={sig.id}
              title={t(securityTypeLabelKey(sig.type))}
              subtitle={sig.message}
              trailing={<StatusBadge tone={severityMeta(sig.severity).tone} label={t(severityMeta(sig.severity).labelKey)} />}
            />
          ))
        )}
      </Card>

      {usage ? (
        <Card title={t('platformAdmin.detail.usage')}>
          <DetailRow label={t('platformAdmin.usage.orders')} value={fmt.num(usage.ordersSynced)} />
          <DetailRow label={t('platformAdmin.usage.events')} value={fmt.num(usage.eventsCaptured)} />
          <DetailRow label={t('platformAdmin.usage.api')} value={`${fmt.num(usage.apiCalls)} / ${fmt.num(usage.apiLimit)}`} />
          <DetailRow label={t('platformAdmin.usage.sites')} value={`${fmt.num(usage.sitesUsed)} / ${fmt.num(usage.sitesLimit)}`} />
          {usage.nearLimit ? (
            <View style={{ flexDirection: rowDirection, marginTop: tokens.spacing.xs }}>
              <StatusBadge tone="warning" label={t('platformAdmin.usage.nearLimit')} />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card title={t('platformAdmin.detail.notes')}>
        <Text tone="muted" variant="caption">
          {tenant.internalNote ?? t('platformAdmin.detail.notesPlaceholder')}
        </Text>
      </Card>

      <Card>
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
          <MockActionButton label={t('platformAdmin.action.openSupport')} note={t('common.mock')} />
          <MockActionButton label={t('platformAdmin.action.requestUpgrade')} note={t('common.mock')} />
          <MockActionButton label={t('platformAdmin.action.reviewSync')} note={t('common.mock')} />
          <MockActionButton label={t('platformAdmin.action.contactLater')} note={t('common.mock')} />
          <MockActionButton label={t('platformAdmin.action.suspendLater')} note={t('common.mock')} />
        </View>
      </Card>
    </Screen>
  );
}
