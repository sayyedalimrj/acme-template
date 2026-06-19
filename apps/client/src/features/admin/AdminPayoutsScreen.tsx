/**
 * AdminPayoutsScreen — commission payout requests ("/admin/payouts").
 *
 * Lists marketers' payout requests with a mock "approve / mark paid" action. No real money
 * movement — actions update in-memory state only and are gated behind a backend later.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Button } from '@/components/ui';
import { MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';
import { adminPayoutAction, useAdminPayouts } from '@/services/adminApi';
import type { PayoutRequestStatus } from '@/domain/admin';

import { payoutMethodLabel, payoutStatusMeta } from './adminFormat';

/** The next mock status when an admin advances a payout request. */
function nextStatus(status: PayoutRequestStatus): PayoutRequestStatus {
  if (status === 'requested') return 'approved';
  if (status === 'approved') return 'paid';
  return status;
}

function actionLabel(status: PayoutRequestStatus): string | null {
  if (status === 'requested') return 'تأیید';
  if (status === 'approved') return 'ثبت پرداخت';
  return null;
}

export function AdminPayoutsScreen(): React.JSX.Element {
  const { data: live } = useAdminPayouts();
  // Optimistic status overrides keyed by payout id (no effect-driven mirroring of live state).
  const [overrides, setOverrides] = useState<Record<string, PayoutRequestStatus>>({});
  const requests = useMemo(
    () => live.map((r) => (overrides[r.id] ? { ...r, status: overrides[r.id] } : r)),
    [live, overrides],
  );

  const advance = (id: string): void => {
    const current = requests.find((r) => r.id === id);
    if (!current) return;
    const action = current.status === 'requested' ? 'approve' : 'mark_paid';
    void adminPayoutAction(id, action);
    setOverrides((prev) => ({ ...prev, [id]: nextStatus(current.status) }));
  };

  const pending = requests.filter((r) => r.status === 'requested').length;
  const paid = requests.filter((r) => r.status === 'paid').length;

  return (
    <MobilePage testID="admin-payouts-screen" header={<MobileTabHeader title="تسویه پورسانت" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PortalMetricTile label="در انتظار" value={String(pending)} tone="warning" />
          <PortalMetricTile label="پرداخت‌شده" value={String(paid)} tone="success" />
          <PortalMetricTile label="کل درخواست‌ها" value={String(requests.length)} />
        </View>

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="درخواست‌های تسویه" />
          <View style={{ gap: 10 }}>
            {requests.map((r) => {
              const label = actionLabel(r.status);
              return (
                <View key={r.id} style={{ gap: 10 }}>
                  <PortalRowCard
                    initials={r.marketerName.slice(0, 1)}
                    title={r.marketerName}
                    subtitle={`${payoutMethodLabel(r.method)} • ${r.maskedDestination}`}
                    meta={r.amountLabel}
                    metaSub={r.requestedAt}
                    badge={payoutStatusMeta(r.status)}
                    testID={`admin-payout-${r.id}`}
                  />
                  {label ? (
                    <View style={{ paddingHorizontal: 4 }}>
                      <Button
                        label={label}
                        onPress={() => advance(r.id)}
                        variant="secondary"
                        testID={`admin-payout-action-${r.id}`}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </MobilePage>
  );
}
