/**
 * Platform Admin — customer/tenant detail.
 *
 * Our internal 360° view of a single SaaS customer: profile, subscription, sites + plugin/
 * sync health, support & admin tasks, security/audit signals, usage/limits, an internal-notes
 * placeholder, and clearly-disabled mock actions (open support / upgrade / review sync /
 * contact / suspend). Unknown ids show a clean not-found state with a safe back action.
 *
 * SECURITY/PRIVACY: MOCK-ONLY. No real billing/backend/PII, no real mutations. See
 * security-model.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

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
} from '@/components/ui';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';

import {
  connectionMeta,
  HEALTH_LABEL_KEYS,
  planTierLabelKey,
  securityTypeLabelKey,
  severityMeta,
  signedStateMeta,
  subscriptionStateMeta,
  syncStateMeta,
  tenantStatusMeta,
  workflowStatusMeta,
} from './platformAdminHelpers';
import {
  usePlatformAdminTasks,
  usePlatformSecuritySignals,
  usePlatformSites,
  usePlatformTenant,
  usePlatformUsage,
} from './usePlatformAdmin';

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        justifyContent: 'space-between',
        gap: tokens.spacing.md,
        paddingVertical: 3,
      }}
    >
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="label" style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Text>
    </View>
  );
}

export function PlatformTenantDetailScreen({
  tenantId,
}: {
  tenantId: string;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();

  const tenantQuery = usePlatformTenant(tenantId);
  const sitesQuery = usePlatformSites();
  const tasksQuery = usePlatformAdminTasks();
  const signalsQuery = usePlatformSecuritySignals();
  const usageQuery = usePlatformUsage();

  const healthLabels = {
    healthy: t(HEALTH_LABEL_KEYS.healthy),
    degraded: t(HEALTH_LABEL_KEYS.degraded),
    critical: t(HEALTH_LABEL_KEYS.critical),
  };

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/platform-admin' as Href);
  };

  if (tenantQuery.isPending) {
    return (
      <Screen testID="platform-tenant-detail-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (tenantQuery.isError || !tenantQuery.data) {
    return (
      <Screen testID="platform-tenant-detail-screen">
        <EmptyState
          title={t('platformAdmin.notFound.title')}
          body={t('platformAdmin.notFound.body')}
          icon="alert-circle-outline"
          fill={false}
        />
        <View style={{ alignItems: 'flex-start' }}>
          <Button
            label={t('platformAdmin.detail.back')}
            variant="secondary"
            size="sm"
            onPress={back}
            leading={<Ionicons name="arrow-back" size={16} color={tokens.color.primary} />}
          />
        </View>
      </Screen>
    );
  }

  const tenant = tenantQuery.data;
  const status = tenantStatusMeta(tenant.status);
  const subState = subscriptionStateMeta(tenant.subscription.state);
  const sites = (sitesQuery.data ?? []).filter((s) => s.tenantId === tenant.id);
  const tasks = (tasksQuery.data ?? []).filter((x) => x.tenantId === tenant.id);
  const signals = (signalsQuery.data ?? []).filter((x) => x.tenantId === tenant.id);
  const usage = (usageQuery.data ?? []).find((u) => u.tenantId === tenant.id);

  return (
    <Screen testID="platform-tenant-detail-screen">
      <View style={{ alignItems: 'flex-start' }}>
        <Button
          label={t('platformAdmin.detail.back')}
          variant="ghost"
          size="sm"
          onPress={back}
          leading={<Ionicons name="arrow-back" size={16} color={tokens.color.primary} />}
        />
      </View>

      {/* Profile */}
      <Card title={t('platformAdmin.detail.profile')} contentStyle={{ gap: tokens.spacing.sm }}>
        <View
          style={{
            flexDirection: rowDirection,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: tokens.spacing.md,
          }}
        >
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

      {/* Subscription */}
      <Card title={t('platformAdmin.detail.subscription')} contentStyle={{ gap: tokens.spacing.xs }}>
        <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
          <StatusBadge tone="primary" label={t(planTierLabelKey(tenant.subscription.tier))} dot={false} />
          <StatusBadge tone={subState.tone} label={t(subState.labelKey)} />
        </View>
        <DetailRow label={t('platformAdmin.mrr')} value={fmt.money(tenant.subscription.mrr, tenant.subscription.currency)} />
        {tenant.subscription.renewsAt ? (
          <DetailRow label={t('platformAdmin.renews')} value={fmt.date(tenant.subscription.renewsAt)} />
        ) : null}
        {tenant.subscription.trialEndsAt ? (
          <DetailRow label={t('platformAdmin.trialEnds')} value={fmt.date(tenant.subscription.trialEndsAt)} />
        ) : null}
      </Card>

      {/* Sites & sync health */}
      <Card title={t('platformAdmin.detail.sites')} contentStyle={{ gap: tokens.spacing.sm }}>
        {sites.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.sites')}</Text>
        ) : (
          sites.map((site) => (
            <Surface key={site.id} bordered padding="md" style={{ gap: tokens.spacing.xs }}>
              <View
                style={{
                  flexDirection: rowDirection,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: tokens.spacing.sm,
                }}
              >
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
              <DetailRow label={`${t('platformAdmin.site.plugin')}`} value={`v${site.plugin.pluginVersion} → v${site.plugin.latestVersion}`} />
              <DetailRow label={t('platformAdmin.site.lastSync')} value={site.sync.lastSyncAt ? fmt.date(site.sync.lastSyncAt) : t('platformAdmin.sync.never')} />
              <DetailRow label={`${t('platformAdmin.site.queued')} · ${t('platformAdmin.site.failures')}`} value={`${fmt.num(site.sync.queuedEvents)} · ${fmt.num(site.sync.failures)}`} />
            </Surface>
          ))
        )}
      </Card>

      {/* Support & admin tasks */}
      <Card title={t('platformAdmin.detail.tasks')} contentStyle={{ gap: tokens.spacing.sm }}>
        {tasks.length === 0 ? (
          <Text tone="muted">{t('platformAdmin.empty.tasks')}</Text>
        ) : (
          tasks.map((task) => (
            <DataListRow
              key={task.id}
              title={task.title}
              subtitle={
                task.blockedReason
                  ? `${t('platformAdmin.task.blocked')}: ${task.blockedReason}`
                  : `${t('platformAdmin.task.next')}: ${task.nextAction}`
              }
              trailing={<StatusBadge tone={workflowStatusMeta(task.status).tone} label={t(workflowStatusMeta(task.status).labelKey)} />}
            />
          ))
        )}
      </Card>

      {/* Security & audit signals */}
      <Card title={t('platformAdmin.detail.security')} contentStyle={{ gap: tokens.spacing.sm }}>
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

      {/* Usage & limits */}
      {usage ? (
        <Card title={t('platformAdmin.detail.usage')} contentStyle={{ gap: tokens.spacing.xs }}>
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

      {/* Internal notes placeholder */}
      <Card title={t('platformAdmin.detail.notes')}>
        <Text tone="muted" variant="caption">
          {tenant.internalNote ?? t('platformAdmin.detail.notesPlaceholder')}
        </Text>
      </Card>

      {/* Mock actions — clearly disabled (no backend mutation). */}
      <Card contentStyle={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        <MockActionButton label={t('platformAdmin.action.openSupport')} note={t('common.mock')} />
        <MockActionButton label={t('platformAdmin.action.requestUpgrade')} note={t('common.mock')} />
        <MockActionButton label={t('platformAdmin.action.reviewSync')} note={t('common.mock')} />
        <MockActionButton label={t('platformAdmin.action.contactLater')} note={t('common.mock')} />
        <MockActionButton label={t('platformAdmin.action.suspendLater')} note={t('common.mock')} />
      </Card>
    </Screen>
  );
}
