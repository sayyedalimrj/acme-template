/**
 * Support operations queue (index).
 *
 * Internal/support view: summary cards, filters, and a prioritized list of onboarding
 * requests to review/assign/progress. Mock-only and account-level (not site-scoped). No
 * provisioning, connection, or notification happens here (see security-model.md).
 */
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card, EmptyState, ErrorState, LoadingState, Screen, Text } from '@/components/ui';
import { SecurityNote } from '@/features/onboarding/components/SecurityNote';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';

import { SupportFilters } from './components/SupportFilters';
import { SupportQueueList } from './components/SupportQueueList';
import { SupportSummaryCards } from './components/SupportSummaryCards';
import {
  computeSummary,
  DEFAULT_SUPPORT_FILTERS,
  filterQueue,
  sortQueue,
  type SupportFilters as Filters,
} from './supportHelpers';
import { useSupportQueue } from './useSupport';

export function SupportQueueScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const t = useT();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const queueQuery = useSupportQueue();
  const [filters, setFilters] = useState<Filters>(DEFAULT_SUPPORT_FILTERS);

  const items = useMemo(() => queueQuery.data ?? [], [queueQuery.data]);
  const summary = useMemo(() => computeSummary(items), [items]);
  const visible = useMemo(() => sortQueue(filterQueue(items, filters)), [items, filters]);

  return (
    <Screen testID="support-queue-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('support.title')}</Text>
        <Text tone="muted">{t('support.subtitle')}</Text>
      </View>

      <SecurityNote messageKey="support.security.note" />

      <SupportSummaryCards summary={summary} />

      <Card title={t('support.title')}>
        <SupportFilters filters={filters} onChange={setFilters} />
      </Card>

      <Card>
        {queueQuery.isPending ? (
          <LoadingState label={t('common.loading')} fill={false} />
        ) : queueQuery.isError ? (
          <ErrorState
            title={t('support.queue.error')}
            retryLabel={t('common.retry')}
            onRetry={() => queueQuery.refetch()}
            fill={false}
          />
        ) : visible.length === 0 ? (
          <EmptyState title={t('support.queue.empty')} icon="albums-outline" fill={false} />
        ) : (
          <SupportQueueList items={visible} onOpen={(id) => go(`/support/requests/${id}`)} />
        )}
      </Card>
    </Screen>
  );
}
