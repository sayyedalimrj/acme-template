/**
 * AdminShell — the authenticated chrome for the platform admin portal.
 *
 * Reuses the shared PortalScaffold (centered mobile frame), a PortalTopBar (avatar + portal
 * name + theme toggle + switch-portal), and a PortalBottomNav with the admin tabs. The page
 * content is supplied by the route.
 */
import { useRouter } from 'expo-router';
import React, { type ReactNode } from 'react';

import {
  PortalBottomNav,
  PortalScaffold,
  PortalTopBar,
  type PortalTab,
} from '@/components/layout';
import { siteInitials } from '@/features/mobile/components';
import { useSession } from '@/session/SessionProvider';

const ADMIN_TABS: readonly PortalTab[] = [
  { key: 'home', label: 'خانه', href: '/admin', icon: 'grid-outline', iconActive: 'grid' },
  {
    key: 'merchants',
    label: 'فروشندگان',
    href: '/admin/merchants',
    icon: 'storefront-outline',
    iconActive: 'storefront',
  },
  {
    key: 'orders',
    label: 'سفارش‌ها',
    href: '/admin/orders',
    icon: 'receipt-outline',
    iconActive: 'receipt',
  },
  { key: 'more', label: 'بیشتر', href: '/admin/more', icon: 'apps-outline', iconActive: 'apps' },
];

export function AdminShell({ children }: { children: ReactNode }): React.JSX.Element {
  const router = useRouter();
  const { user } = useSession();
  const initials = siteInitials(user?.name ?? 'مدیر');
  const go = (href: string): void => router.navigate(href as never);

  return (
    <PortalScaffold
      header={
        <PortalTopBar
          title="پنل مدیریت"
          subtitle={user?.name ?? 'خوش آمدید'}
          initials={initials}
          onPressAvatar={() => go('/admin/more')}
        />
      }
      bottomNav={<PortalBottomNav tabs={ADMIN_TABS} homeHref="/admin" />}
    >
      {children}
    </PortalScaffold>
  );
}
