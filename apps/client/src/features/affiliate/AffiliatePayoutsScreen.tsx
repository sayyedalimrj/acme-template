/**
 * AffiliatePayoutsScreen — request a payout + payout history ("/affiliate/payouts").
 *
 * The "request payout" button adds a mock `requested` entry to in-memory state. No real money
 * moves — real payouts run server-side via the platform payment gateway later.
 */
import React, { useState } from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Button, Text } from '@/components/ui';
import { MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics, mobileType, useMobileColors } from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';
import { payoutMethodLabel, payoutStatusMeta } from '@/features/admin/adminFormat';
import type { AffiliatePayout } from '@/domain/affiliate';

import { AFFILIATE_OVERVIEW, AFFILIATE_PAYOUTS } from './affiliateMockData';

export function AffiliatePayoutsScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const { isRTL } = useTheme();
  const [payouts, setPayouts] = useState<AffiliatePayout[]>(() => [...AFFILIATE_PAYOUTS]);
  const [requested, setRequested] = useState(false);

  const requestPayout = (): void => {
    const entry: AffiliatePayout = {
      id: `ap-new-${payouts.length + 1}`,
      amountLabel: AFFILIATE_OVERVIEW.availableLabel,
      method: 'bank_card',
      maskedDestination: 'کارت •••• ۴۳۲۱',
      status: 'requested',
      requestedAt: '1404-03-30',
    };
    setPayouts((prev) => [entry, ...prev]);
    setRequested(true);
  };

  return (
    <MobilePage testID="affiliate-payouts-screen" header={<MobileTabHeader title="تسویه حساب" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <View
          style={{
            borderRadius: mobileMetrics.cardRadius,
            backgroundColor: colors.primarySoft,
            padding: 18,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: mobileType.captionSize, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }}>
            موجودی قابل برداشت
          </Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.text, textAlign: isRTL ? 'right' : 'left' }}>
            {AFFILIATE_OVERVIEW.availableLabel}
          </Text>
          <Button
            label={requested ? 'درخواست ثبت شد' : 'درخواست تسویه'}
            onPress={requestPayout}
            disabled={requested}
            testID="affiliate-request-payout"
          />
          <Text style={{ fontSize: mobileType.captionSize, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left', lineHeight: 20 }}>
            این یک نمونه‌ی نمایشی است. تسویه واقعی پس از اتصال درگاه پرداخت سمت سرور انجام می‌شود.
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PortalMetricTile label="در انتظار" value={AFFILIATE_OVERVIEW.pendingLabel} tone="warning" />
          <PortalMetricTile label="پرداخت‌شده" value={AFFILIATE_OVERVIEW.paidLabel} tone="success" />
        </View>

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="تاریخچه تسویه" />
          <View style={{ gap: 10 }}>
            {payouts.map((p) => (
              <PortalRowCard
                key={p.id}
                icon="wallet-outline"
                title={p.amountLabel}
                subtitle={`${payoutMethodLabel(p.method)} • ${p.maskedDestination}`}
                metaSub={p.paidAt ?? p.requestedAt}
                badge={payoutStatusMeta(p.status)}
                testID={`affiliate-payout-${p.id}`}
              />
            ))}
          </View>
        </View>
      </View>
    </MobilePage>
  );
}
