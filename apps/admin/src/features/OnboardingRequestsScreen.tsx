/**
 * OnboardingRequestsScreen — internal queue of merchant site launch / connection requests.
 */
import { useRouter, type Href } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useAsync, useFmt, useT, useTheme } from '@/system';
import type { LabelKey } from '@/labels';
import { Badge, Card, ErrorState, LoadingState, Screen, StatusBadge, Surface, Text } from '@/ui';
import type { AdminOnboardingRequest } from '@/mock/onboardingRequests';
import { onboardingService } from '@/services/onboardingService';

function statusMeta(status: AdminOnboardingRequest['status']): {
  labelKey: LabelKey;
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
} {
  switch (status) {
    case 'submitted':
    case 'under_review':
      return { labelKey: 'onboarding.status.awaitingApproval', tone: 'info' };
    case 'provisioning':
      return { labelKey: 'onboarding.status.preparing', tone: 'warning' };
    case 'needs_customer_action':
      return { labelKey: 'onboarding.status.needsInfo', tone: 'warning' };
    case 'ready':
      return { labelKey: 'onboarding.status.readyForDelivery', tone: 'success' };
    case 'delivered':
      return { labelKey: 'onboarding.status.delivered', tone: 'success' };
    case 'rejected':
    default:
      return { labelKey: 'onboarding.status.rejected', tone: 'danger' };
  }
}

function RequestCard({
  item,
  onPress,
}: {
  item: AdminOnboardingRequest;
  onPress: () => void;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFmt();
  const meta = statusMeta(item.status);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}>
      <Surface bordered padding="md" style={{ gap: tokens.spacing.xs }}>
        <Text variant="label" numberOfLines={2}>
          {item.businessName}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {item.tenantName}
          {item.domain ? ` · ${item.domain}` : item.siteUrl ? ` · ${item.siteUrl}` : ''}
        </Text>
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
          <StatusBadge tone={meta.tone} label={t(meta.labelKey)} dot={false} />
          {item.planLabel ? <Badge tone="neutral" label={item.planLabel} /> : null}
          {item.templateLabel ? <Badge tone="neutral" label={item.templateLabel} /> : null}
        </View>
        {item.missingItems.length > 0 ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {t('onboarding.missing')}: {item.missingItems.join('، ')}
          </Text>
        ) : null}
        <View style={{ flexDirection: rowDirection, justifyContent: 'space-between', gap: tokens.spacing.sm }}>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {item.owner ?? '—'}
          </Text>
          <Text variant="caption" tone="muted">
            {fmt.date(item.createdAt)}
          </Text>
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>
          {t('onboarding.nextAction')}: {item.nextAction}
        </Text>
      </Surface>
    </Pressable>
  );
}

export function OnboardingRequestsScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listState = useAsync(() => onboardingService.listOpenRequests(), []);
  const items = useMemo(() => listState.data ?? [], [listState.data]);
  const selected = items.find((i) => i.id === selectedId) ?? null;

  if (listState.loading) {
    return (
      <Screen testID="onboarding-requests-screen">
        <LoadingState label={t('common.loading')} />
      </Screen>
    );
  }

  if (listState.error) {
    return (
      <Screen testID="onboarding-requests-screen">
        <ErrorState
          title={t('common.error')}
          retryLabel={t('common.retry')}
          onRetry={listState.reload}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="onboarding-requests-screen">
      <Card title={t('nav.onboarding')}>
        <Text variant="caption" tone="muted">
          {t('onboarding.subtitle')}
        </Text>
      </Card>

      <View style={{ gap: tokens.spacing.md, marginTop: tokens.spacing.lg }}>
        {items.length === 0 ? (
          <Card>
            <Text tone="muted">{t('onboarding.empty')}</Text>
          </Card>
        ) : (
          items.map((item) => (
            <RequestCard key={item.id} item={item} onPress={() => setSelectedId(item.id)} />
          ))
        )}
      </View>

      {selected ? (
        <Card title={selected.businessName} style={{ marginTop: tokens.spacing.lg }}>
          <Text variant="caption" tone="muted">
            {t('onboarding.detailHint')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate('/workflows' as Href)}
            style={{ marginTop: tokens.spacing.sm }}
          >
            <Text variant="label" tone="primary">
              {t('onboarding.openWorkflows')}
            </Text>
          </Pressable>
        </Card>
      ) : null}
    </Screen>
  );
}
