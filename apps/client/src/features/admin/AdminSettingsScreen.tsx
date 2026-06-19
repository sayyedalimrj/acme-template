/**
 * AdminSettingsScreen — platform configuration overview ("/admin/settings").
 *
 * Read-only status of the platform's integrations (payment gateway, SMS/OTP, default commission,
 * plans). Real editing lands once the backend admin endpoints are wired; this surfaces the
 * structure the platform owner manages.
 */
import React from 'react';
import { View } from 'react-native';

import { PortalRowCard, PortalSectionTitle } from '@/components/portal/PortalUI';
import { MobilePage, MobileTabHeader } from '@/features/mobile/components';
import { mobileMetrics } from '@/features/mobile/mobileTokens';

export function AdminSettingsScreen(): React.JSX.Element {
  return (
    <MobilePage testID="admin-settings-screen" header={<MobileTabHeader title="تنظیمات پلتفرم" />}>
      <View style={{ paddingHorizontal: mobileMetrics.screenPadding, gap: mobileMetrics.sectionGap }}>
        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="یکپارچه‌سازی‌ها" />
          <PortalRowCard
            icon="card-outline"
            title="درگاه پرداخت"
            subtitle="برای تسویه اشتراک‌ها و پورسانت‌ها"
            badge={{ tone: 'warning', label: 'پیکربندی سمت سرور' }}
          />
          <PortalRowCard
            icon="chatbubble-ellipses-outline"
            title="پنل پیامک (ippanel)"
            subtitle="ارسال کد ورود (OTP)"
            badge={{ tone: 'info', label: 'از طریق بک‌اند' }}
          />
        </View>

        <View style={{ gap: 12 }}>
          <PortalSectionTitle title="قوانین کسب‌وکار" />
          <PortalRowCard icon="megaphone-outline" title="پورسانت پیش‌فرض بازاریاب" meta="۲۰٪" />
          <PortalRowCard icon="pricetag-outline" title="پلن‌ها" subtitle="پایه، رشد، حرفه‌ای، مدیریت‌شده" meta="۴" />
          <PortalRowCard icon="shield-checkmark-outline" title="دسترسی مدیران" subtitle="بر اساس فهرست مجاز شماره‌ها" />
        </View>
      </View>
    </MobilePage>
  );
}
