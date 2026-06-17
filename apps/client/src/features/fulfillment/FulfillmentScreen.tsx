/**
 * Fulfillment queue screen.
 *
 * Orders that still need processing or shipping, prioritized (blocked/awaiting first) and
 * deep-linking to order detail. Active-site-aware via `useOrders`; read-only — no status,
 * mark-fulfilled, or tracking mutations. Mock-only.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, type ComponentProps, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import {
  Badge,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Text,
} from '@/components/ui';
import { fulfillmentBadge, orderItemCount, orderStatusBadge } from '@/features/orders/orderHelpers';
import { useOrders } from '@/features/orders/useOrders';
import { useActiveSite } from '@/features/site/useSites';
import { useT } from '@/i18n/I18nProvider';
import { useFormatters } from '@/i18n/useFormatters';
import { useTheme } from '@/theme';
import type { Order } from '@/domain/types';

import {
  filterFulfillmentQueue,
  fulfillmentPriority,
  fulfillmentPriorityTint,
} from './fulfillmentHelpers';

type IoniconName = ComponentProps<typeof Ionicons>['name'];
type ChipTint = 'danger' | 'warning' | 'info';

function Chip({ icon, tint }: { icon: IoniconName; tint: ChipTint }): React.JSX.Element {
  const { tokens } = useTheme();
  const map: Record<ChipTint, { bg: string; fg: string }> = {
    danger: { bg: tokens.color.dangerSoft, fg: tokens.color.danger },
    warning: { bg: tokens.color.warningSoft, fg: tokens.color.warning },
    info: { bg: tokens.color.infoSoft, fg: tokens.color.info },
  };
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: tokens.radius.pill,
        backgroundColor: map[tint].bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={18} color={map[tint].fg} />
    </View>
  );
}

function Row({
  onPress,
  children,
}: {
  onPress: () => void;
  children: ReactNode;
}): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        {
          flexDirection: rowDirection,
          alignItems: 'center',
          gap: tokens.spacing.md,
          paddingVertical: tokens.spacing.sm,
          paddingHorizontal: tokens.spacing.sm,
          borderRadius: tokens.radius.md,
        },
        hovered || pressed ? { backgroundColor: tokens.color.surfaceAlt } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function FulfillmentScreen(): React.JSX.Element {
  const { tokens, rowDirection } = useTheme();
  const t = useT();
  const fmt = useFormatters();
  const router = useRouter();
  const go = (href: string) => router.navigate(href as never);

  const activeSite = useActiveSite();
  const ordersQuery = useOrders();

  if (!activeSite.isPending && !activeSite.data) {
    return (
      <Screen scroll={false} padded={false}>
        <EmptyState
          title={t('fulfillment.noSite.title')}
          body={t('fulfillment.noSite.body')}
          icon="storefront-outline"
          action={{ label: t('site.connectCta'), onPress: () => go('/connect-site') }}
        />
      </Screen>
    );
  }

  const queue = filterFulfillmentQueue(ordersQuery.data?.items ?? []);

  return (
    <Screen testID="fulfillment-screen">
      <View style={{ gap: tokens.spacing.xs }}>
        <Text variant="title">{t('fulfillment.title')}</Text>
        <Text tone="muted">{t('fulfillment.subtitle')}</Text>
      </View>

      {ordersQuery.isPending ? (
        <LoadingState label={t('common.loading')} />
      ) : ordersQuery.isError ? (
        <ErrorState
          title={t('fulfillment.error')}
          retryLabel={t('common.retry')}
          onRetry={() => ordersQuery.refetch()}
        />
      ) : queue.length === 0 ? (
        <EmptyState title={t('fulfillment.empty')} icon="checkmark-done-outline" fill={false} />
      ) : (
        <Card
          title={t('fulfillment.title')}
          headerAction={
            <Badge
              tone="neutral"
              label={`${fmt.num(queue.length)} ${t('fulfillment.queueCount')}`}
            />
          }
        >
          {queue.map((order: Order, index) => {
            const status = orderStatusBadge(order.status);
            const fulfillment = fulfillmentBadge(order.fulfillment);
            const priority = fulfillmentPriority(order);
            return (
              <View key={order.id}>
                {index > 0 ? <Divider /> : null}
                <Row onPress={() => go(`/orders/${order.id}`)}>
                  <Chip icon="paper-plane-outline" tint={fulfillmentPriorityTint(priority)} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="label">#{order.number}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {order.billing.firstName} {order.billing.lastName} ·{' '}
                      {fmt.num(orderItemCount(order))} {t('fulfillment.itemsCount')} ·{' '}
                      {fmt.date(order.dateCreated)}
                    </Text>
                    <View
                      style={{
                        flexDirection: rowDirection,
                        gap: tokens.spacing.xs,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Badge tone={status.tone} label={t(status.labelKey)} />
                      <Badge tone={fulfillment.tone} label={t(fulfillment.labelKey)} />
                    </View>
                  </View>
                  <Text variant="label">{fmt.money(order.total, order.currency)}</Text>
                  <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
                </Row>
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
