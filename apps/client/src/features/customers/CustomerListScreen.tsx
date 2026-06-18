/**
 * Customer list screen (mobile-first).
 *
 * Calm customers view matching the Products/Orders lists: a soft search field, a single
 * low-density segment filter row, a prominent "add customer" action (mock), and tidy customer
 * cards. The customer NAME is the dominant text (no raw email on the card); value signals
 * (orders, last order, total spent) are shown compactly. RTL-correct. Mock-only via
 * useCustomers; rows deep-link to customer detail.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import {
  AddActionButton,
  AnimatedSection,
  AppCard,
  EmptySiteCard,
  FilterChipRow,
  MobilePage,
  MobileSearchField,
  PressableScale,
  StatusBadge,
  type StatusTone,
} from '@/features/mobile/components';
import { mobileColors, mobileMetrics, mobileType } from '@/features/mobile/mobileTokens';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { BadgeTone } from '@/components/ui';
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

function toStatusTone(tone: BadgeTone): StatusTone {
  if (tone === 'success' || tone === 'warning' || tone === 'danger' || tone === 'info') {
    return tone;
  }
  return 'neutral';
}

const SEGMENT_FILTERS: readonly { value: SegmentFilter; labelKey: StringKey }[] = [
  { value: 'all', labelKey: 'customers.filter.allSegments' },
  { value: 'vip', labelKey: 'customers.segment.vip' },
  { value: 'repeat', labelKey: 'customers.segment.repeat' },
  { value: 'new', labelKey: 'customers.segment.new' },
];

function ScreenTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();
  return (
    <View
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: mobileMetrics.screenPadding,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          flex: 1,
          fontSize: mobileType.titleSize,
          fontWeight: '700',
          color: mobileColors.text,
          textAlign: isRTL ? 'right' : 'left',
        }}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

function CustomerRow({
  customer,
  onPress,
}: {
  customer: Customer;
  onPress: () => void;
}): React.JSX.Element {
  const { rowDirection, isRTL } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const segment = segmentBadge(customerSegment(customer));
  const initials =
    `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.toUpperCase() || '?';

  const meta = `${fmt.num(customer.ordersCount)} ${t('customers.label.orders')}${
    customer.lastOrderDate ? ` · ${fmt.date(customer.lastOrderDate)}` : ''
  }`;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={customerFullName(customer)}
      pressScale={0.985}
      style={{
        flexDirection: rowDirection,
        alignItems: 'center',
        gap: 12,
        minHeight: mobileMetrics.listRowHeight,
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: mobileColors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: mobileColors.primary, fontWeight: '700', fontSize: 15 }}>
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
        <View style={{ flexDirection: rowDirection, alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              flexShrink: 1,
              fontSize: mobileType.labelSize,
              fontWeight: '700',
              color: mobileColors.text,
              textAlign: isRTL ? 'right' : 'left',
            }}
            numberOfLines={1}
          >
            {customerFullName(customer)}
          </Text>
          <StatusBadge tone={toStatusTone(segment.tone)} label={t(segment.labelKey)} />
        </View>
        <Text
          style={{
            fontSize: mobileType.captionSize,
            color: mobileColors.textSecondary,
            textAlign: isRTL ? 'right' : 'left',
          }}
          numberOfLines={1}
        >
          {meta}
        </Text>
      </View>

      <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 2 }}>
        <Text
          style={{ fontSize: mobileType.labelSize, fontWeight: '700', color: mobileColors.text }}
        >
          {fmt.money(customer.totalSpent, customer.currency)}
        </Text>
        <Ionicons
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={16}
          color={mobileColors.mutedSoft}
        />
      </View>
    </PressableScale>
  );
}

export function CustomerListScreen(): React.JSX.Element {
  const t = useT();
  const router = useRouter();
  const { isRTL } = useTheme();

  const activeSite = useActiveSite();
  const customersQuery = useCustomers();

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<SegmentFilter>('all');

  const items = customersQuery.data?.items;
  const filtered = useMemo(
    () => filterCustomers(items ?? [], { search, segment }),
    [items, search, segment],
  );

  const header = (
    <ScreenTitle
      title={t('customers.title')}
      action={
        <AddActionButton
          label={t('customers.add')}
          comingSoonLabel={t('mock.comingSoonActive')}
          testID="customer-add"
        />
      }
    />
  );

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <MobilePage testID="customer-list-screen" header={header}>
        <View style={{ paddingHorizontal: mobileMetrics.screenPadding }}>
          <EmptySiteCard
            onPrimary={() => router.navigate('/onboarding' as never)}
            onSecondary={() => router.navigate('/connect-site' as never)}
          />
        </View>
      </MobilePage>
    );
  }

  return (
    <MobilePage testID="customer-list-screen" header={header}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: 16 }}>
        <AnimatedSection index={0}>
          <View style={{ gap: 12 }}>
            <MobileSearchField
              value={search}
              onChangeText={setSearch}
              placeholder={t('customers.searchPlaceholder')}
              testID="customer-search"
            />
            <FilterChipRow
              options={SEGMENT_FILTERS.map((f) => ({ value: f.value, label: t(f.labelKey) }))}
              value={segment}
              onChange={setSegment}
            />
          </View>
        </AnimatedSection>

        {customersQuery.isPending ? (
          <Text style={{ color: mobileColors.muted, textAlign: isRTL ? 'right' : 'left' }}>
            {t('common.loading')}
          </Text>
        ) : customersQuery.isError ? (
          <PressableScale
            onPress={() => customersQuery.refetch()}
            accessibilityLabel={t('common.retry')}
            style={{ paddingVertical: 24, alignItems: 'center' }}
          >
            <Text style={{ color: mobileColors.primary, fontWeight: '700' }}>
              {t('customers.error')} · {t('common.retry')}
            </Text>
          </PressableScale>
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={34} color={mobileColors.mutedSoft} />
            <Text style={{ color: mobileColors.muted, marginTop: 10 }}>{t('customers.empty')}</Text>
          </View>
        ) : (
          <AnimatedSection index={1}>
            <AppCard padding={0} testID="customer-list" style={{ paddingHorizontal: 16 }}>
              {filtered.map((customer, index) => (
                <View key={customer.id}>
                  {index > 0 ? (
                    <View style={{ height: 1, backgroundColor: mobileColors.separator }} />
                  ) : null}
                  <CustomerRow
                    customer={customer}
                    onPress={() => router.navigate(`/customers/${customer.id}` as never)}
                  />
                </View>
              ))}
            </AppCard>
          </AnimatedSection>
        )}
      </View>
    </MobilePage>
  );
}
