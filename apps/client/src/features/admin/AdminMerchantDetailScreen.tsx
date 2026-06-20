/**
 * AdminMerchantDetailScreen — a single merchant's account view ("/admin/merchants/[id]").
 *
 * Read-only overview: status, plan, revenue, store metrics, referral source, and mock
 * management actions (suspend / message). Mock data only — no real account mutations.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { PortalMetricTile, PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { Text, EmptyState } from '@/components/ui';
import { MobilePage, MobileSubHeader, siteInitials } from '@/features/mobile/components';
import { mobileMetrics, mobileType, useMobileColors } from '@/features/mobile/mobileTokens';
import { useTheme } from '@/theme';

import { findAdminMerchant } from './adminMockData';
import { merchantStatusMeta } from './adminFormat';

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function AdminMerchantDetailScreen(): React.JSX.Element {
  const colors = useMobileColors();
  const { isRTL } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const merchant = findAdminMerchant(firstParam(params.id));

  if (!merchant) {
    return (
      <MobilePage testID="admin-merchant-detail-screen" header={<MobileSubHeader title="فروشنده" backLabel="بازگشت" onBack={() => router.back()} />}>
        <EmptyState title="فروشنده پیدا نشد" body="این حساب در دسترس نیست." fill={false} />
      </MobilePage>
    );
  }

  const meta = merchantStatusMeta(merchant.status);

  return (
    <MobilePage
      testID="admin-merchant-detail-screen"
      header={<MobileSubHeader title={merchant.storeName} backLabel="بازگشت" onBack={() => router.back()} />}
    >
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <PortalRowCard
          initials={siteInitials(merchant.storeName)}
          title={merchant.storeName}
          subtitle={merchant.url}
          badge={meta}
        />

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="وضعیت اشتراک" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ width: '47.5%', flexGrow: 1 }}>
              <PortalMetricTile label="پلن" value={merchant.planName} tone="info" />
            </View>
            <View style={{ width: '47.5%', flexGrow: 1 }}>
              <PortalMetricTile label="درآمد ماهانه" value={merchant.mrrLabel} tone="success" />
            </View>
            <View style={{ width: '47.5%', flexGrow: 1 }}>
              <PortalMetricTile label="فروش فروشگاه" value={merchant.storeSalesLabel} />
            </View>
            <View style={{ width: '47.5%', flexGrow: 1 }}>
              <PortalMetricTile label="مالک" value={merchant.ownerName} />
            </View>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="آمار فروشگاه" />
          <PortalRowCard icon="receipt-outline" title="سفارش‌ها" meta={String(merchant.ordersCount)} />
          <PortalRowCard icon="pricetags-outline" title="محصولات" meta={String(merchant.productsCount)} />
          <PortalRowCard icon="calendar-outline" title="تاریخ عضویت" meta={merchant.joinedAt} />
          <PortalRowCard icon="time-outline" title="آخرین فعالیت" meta={merchant.lastActiveAt} />
        </View>

        {merchant.referredByMarketerName ? (
          <View style={{ gap: 12 }}>
            <PortalSectionTitle title="معرف" />
            <PortalRowCard
              icon="megaphone-outline"
              title={merchant.referredByMarketerName}
              subtitle="این فروشنده از طریق بازاریاب جذب شده است"
            />
          </View>
        ) : null}

        <View
          style={{
            gap: 8,
            backgroundColor: colors.primarySoft,
            borderRadius: mobileMetrics.cardRadiusSmall,
            padding: 14,
          }}
        >
          <Text
            style={{
              fontSize: mobileType.captionSize,
              color: colors.textSecondary,
              textAlign: isRTL ? 'right' : 'left',
              lineHeight: 20,
            }}
          >
            اقدامات مدیریتی (تعلیق، تغییر پلن، تماس) به‌زودی در این بخش ارائه می‌شود.
          </Text>
        </View>
      </View>
    </MobilePage>
  );
}
