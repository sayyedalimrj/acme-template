/**
 * AffiliateShell — authenticated chrome for the marketer / affiliate portal.
 *
 * Reuses the shared PortalScaffold, PortalTopBar, and PortalBottomNav with affiliate tabs.
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

const AFFILIATE_TABS: readonly PortalTab[] = [
  { key: 'home', label: 'خانه', href: '/affiliate', icon: 'grid-outline', iconActive: 'grid' },
  {
    key: 'referrals',
    label: 'معرفی‌ها',
    href: '/affiliate/referrals',
    icon: 'people-outline',
    iconActive: 'people',
  },
  {
    key: 'earnings',
    label: 'درآمد',
    href: '/affiliate/earnings',
    icon: 'cash-outline',
    iconActive: 'cash',
  },
  { key: 'more', label: 'بیشتر', href: '/affiliate/more', icon: 'apps-outline', iconActive: 'apps' },
];

export function AffiliateShell({ children }: { children: ReactNode }): React.JSX.Element {
  const router = useRouter();
  const { user } = useSession();
  const initials = siteInitials(user?.name ?? 'بازاریاب');
  const go = (href: string): void => router.navigate(href as never);

  return (
    <PortalScaffold
      header={
        <PortalTopBar
          title="پنل بازاریاب"
          subtitle={user?.name ?? 'خوش آمدید'}
          initials={initials}
          onPressAvatar={() => go('/affiliate/more')}
          onPressSwitch={() => go('/affiliate/more')}
        />
      }
      bottomNav={<PortalBottomNav tabs={AFFILIATE_TABS} homeHref="/affiliate" />}
    >
      {children}
    </PortalScaffold>
  );
}
