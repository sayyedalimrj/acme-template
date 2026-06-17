/**
 * CustomerContextPanel — the read-only, safe customer summary shown beside a support
 * conversation. Projects platform data (plan, sites, plugin/sync health, workflow/support
 * counts, usage) into a glanceable panel. Billing/security sections carry a visibility badge
 * marking them as future-RBAC-restricted; raw PII/secrets/credentials are never shown.
 */
import React from 'react';
import { View } from 'react-native';

import { useFmt, useT, useTheme } from '@/system';
import { Card, Divider, HealthScoreBadge, StatusBadge, Text } from '@/ui';
import type { SupportConversationContext } from '@/domain/types';

import {
  HEALTH_LABEL_KEYS,
  connectionMeta,
  planTierLabelKey,
  signedStateMeta,
  subscriptionStateMeta,
  syncStateMeta,
  visibilityMeta,
} from './helpers';

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
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

function VisibilityBadge({
  level,
}: {
  level: 'restricted_billing' | 'restricted_security';
}): React.JSX.Element {
  const t = useT();
  const meta = visibilityMeta(level);
  return <StatusBadge tone={meta.tone} label={t(meta.labelKey)} dot={false} />;
}

export function CustomerContextPanel({
  context,
  compact = false,
}: {
  context: SupportConversationContext;
  compact?: boolean;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const healthLabels = {
    healthy: t(HEALTH_LABEL_KEYS.healthy),
    degraded: t(HEALTH_LABEL_KEYS.degraded),
    critical: t(HEALTH_LABEL_KEYS.critical),
  };

  return (
    <Card title={compact ? t('support.context.preview') : t('support.context.title')}>
      {/* Identity + tenant health */}
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <Text variant="subheading" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
          {context.tenantName}
        </Text>
        <HealthScoreBadge score={context.tenantHealthScore} labels={healthLabels} />
      </View>

      {/* Plan & subscription (safe summary) */}
      <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
        <StatusBadge tone="primary" label={t(planTierLabelKey(context.plan))} dot={false} />
        <StatusBadge
          tone={subscriptionStateMeta(context.subscriptionState).tone}
          label={t(subscriptionStateMeta(context.subscriptionState).labelKey)}
        />
      </View>
      <Row label={t('support.context.owner')} value={context.supportOwner ?? t('common.none')} />
      <Row label={t('support.context.sites')} value={fmt.num(context.sitesCount)} />
      <Row label={t('support.context.openWorkflows')} value={fmt.num(context.openWorkflowTasks)} />
      <Row label={t('support.context.openSupport')} value={fmt.num(context.openSupportCount)} />
      <Row
        label={t('support.context.onboarding')}
        value={
          context.onboardingComplete
            ? t('support.context.onboardingDone')
            : t('support.context.onboardingPending')
        }
      />

      {/* Active site health (safe summary) */}
      {context.siteId ? (
        <>
          <Divider />
          <View
            style={{
              flexDirection: rowDirection,
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: tokens.spacing.sm,
            }}
          >
            <Text variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1, minWidth: 0 }}>
              {context.siteName}
            </Text>
            {typeof context.siteHealthScore === 'number' ? (
              <HealthScoreBadge score={context.siteHealthScore} labels={healthLabels} />
            ) : null}
          </View>
          {context.connection ? (
            <View style={{ flexDirection: rowDirection, gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
              <StatusBadge
                tone={connectionMeta(context.connection).tone}
                label={t(connectionMeta(context.connection).labelKey)}
              />
              {context.syncState ? (
                <StatusBadge
                  tone={syncStateMeta(context.syncState).tone}
                  label={t(syncStateMeta(context.syncState).labelKey)}
                />
              ) : null}
              {context.signedSync ? (
                <StatusBadge
                  tone={signedStateMeta(context.signedSync).tone}
                  label={t(signedStateMeta(context.signedSync).labelKey)}
                  dot={false}
                />
              ) : null}
            </View>
          ) : null}
          {!compact ? (
            <>
              <Row
                label={t('support.context.plugin')}
                value={
                  context.pluginVersion
                    ? `v${context.pluginVersion} → v${context.latestPluginVersion ?? context.pluginVersion}`
                    : t('common.none')
                }
              />
              <Row
                label={t('support.context.lastSync')}
                value={context.lastSyncAt ? fmt.date(context.lastSyncAt) : t('common.none')}
              />
              <Row label={t('support.context.queue')} value={fmt.num(context.queuedEvents ?? 0)} />
            </>
          ) : null}
        </>
      ) : null}

      {/* Usage (safe summary) */}
      {!compact && typeof context.apiCalls === 'number' ? (
        <>
          <Divider />
          <Row
            label={t('support.context.usage')}
            value={`${fmt.num(context.apiCalls)} / ${fmt.num(context.apiLimit ?? 0)}`}
          />
        </>
      ) : null}

      {/* Restricted sections — flagged for future RBAC (no raw data shown) */}
      <Divider />
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
          <Text variant="caption" tone="muted">
            {t('support.context.plan')}
          </Text>
          <VisibilityBadge level="restricted_billing" />
        </View>
        <Text variant="label">{fmt.money(context.mrr, context.currency)}</Text>
      </View>
      <View
        style={{
          flexDirection: rowDirection,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
          <Text variant="caption" tone="muted">
            {t('platformAdmin.section.security')}
          </Text>
          <VisibilityBadge level="restricted_security" />
        </View>
        <Text variant="label">{fmt.num(context.recentSecuritySignalIds.length)}</Text>
      </View>
    </Card>
  );
}
