/**
 * Customer list screen.
 *
 * Active-site-aware customer management view: search (name/email/username) + segment filter
 * over the mocked customers, with loading/empty/error states. Rows surface customer value
 * signals (total spent, order count, last order, segment) and navigate to detail. Filtering
 * is client-side for snappy UX; `useCustomers` also accepts server-side query params for
 * future real-data scale.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';

import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import type { Customer } from '@/domain/types';
import type { StringKey } from '@/i18n/strings';

import {
  customerFullName,
  customerSegment,
  filterCustomers,
  segmentBadge,
  type SegmentFilter,
} from './customerHelpers';
import { useCustomers } from './useCustomers';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: ChipProps): React.JSX.Element {
  const { tokens } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        paddingVertical: tokens.spacing.xs + 2,
        paddingHorizontal: tokens.spacing.md,
        borderRadius: tokens.radius.pill,
        borderWidth: tokens.borderWidth.thin,
        borderColor: active ? tokens.color.primary : tokens.color.border,
        backgroundColor: active ? tokens.color.primarySoft : tokens.color.surface,
      }}
    >
      <Text
        variant="caption"
        style={{ color: active ? tokens.color.primary : tokens.color.textMuted }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface CustomerRowProps {
  customer: Customer;
  onPress: () => void;
}

function CustomerRow({ customer, onPress }: CustomerRowProps): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const segment = segmentBadge(customerSegment(customer));
  const initials =
    `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase() || '?';

  const rowStyle: ViewStyle = {
    flexDirection: rowDirection,
    alignItems: 'center',
    gap: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.md,
    borderWidth: tokens.borderWidth.hairline,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.surface,
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={customerFullName(customer)}
      onPress={onPress}
      style={({ pressed }) => [
        rowStyle,
        pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: tokens.radius.pill,
          backgroundColor: tokens.color.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text variant="label" tone="primary" style={{ fontWeight: '700' }}>
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: tokens.spacing.xs }}>
          <Text variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {customerFullName(customer)}
          </Text>
          <Badge tone={segment.tone} label={t(segment.labelKey)} />
        </View>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {customer.email}
        </Text>
        <Text variant="caption" tone="muted">
          {formatNumber(customer.ordersCount)} {t('customers.orders')}
          {customer.lastOrderDate
            ? ` · ${t('customers.label.lastOrder')} ${formatDate(customer.lastOrderDate)}`
            : ''}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <Text variant="label">{formatCurrency(customer.totalSpent, customer.currency)}</Text>
        <Text variant="caption" tone="muted">
          {t('customers.label.totalSpent')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tokens.color.textMuted} />
    </Pressable>
  );
}

const SEGMENT_FILTERS: { value: SegmentFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'customers.filter.allSegments' },
  { value: 'vip', labelKey: 'customers.segment.vip' },
  { value: 'repeat', labelKey: 'customers.segment.repeat' },
  { value: 'new', labelKey: 'customers.segment.new' },
];

export function CustomerListScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const router = useRouter();

  const activeSite = useActiveSite();
  const customersQuery = useCustomers();

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<SegmentFilter>('all');

  const items = customersQuery.data?.items;
  const filtered = useMemo(
    () => filterCustomers(items ?? [], { search, segment }),
    [items, search, segment],
  );
  const total = items?.length ?? 0;

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('customers.noSite.title')}
          body={t('customers.noSite.body')}
          icon="storefront-outline"
          action={{
            label: t('site.connectCta'),
            onPress: () => router.navigate('/connect-site' as never),
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen testID="customer-list-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('customers.title')}</Text>
        <Text tone="muted">{t('customers.subtitle')}</Text>
      </View>

      <Card>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder={t('customers.searchPlaceholder')}
          autoCapitalize="none"
          testID="customer-search"
        />
        <View style={{ flexDirection: rowDirection, flexWrap: 'wrap', gap: tokens.spacing.xs }}>
          {SEGMENT_FILTERS.map((f) => (
            <FilterChip
              key={f.value}
              label={t(f.labelKey)}
              active={segment === f.value}
              onPress={() => setSegment(f.value)}
            />
          ))}
        </View>
      </Card>

      {customersQuery.isPending ? (
        <LoadingState label={t('common.loading')} />
      ) : customersQuery.isError ? (
        <ErrorState
          title={t('customers.error')}
          retryLabel={t('common.retry')}
          onRetry={() => customersQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title={t('customers.empty')} icon="people-outline" fill={false} />
      ) : (
        <View style={{ gap: tokens.spacing.sm }} testID="customer-list">
          <Text variant="caption" tone="muted">
            {formatNumber(filtered.length)} / {formatNumber(total)}
          </Text>
          {filtered.map((customer) => (
            <CustomerRow
              key={customer.id}
              customer={customer}
              onPress={() => router.navigate(`/customers/${customer.id}` as never)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
