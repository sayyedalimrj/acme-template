/**
 * Navigation model for the app shell.
 *
 * Data-driven nav (inspired by Ecme's navigation config concept). Only the Dashboard route
 * is active in Task 1; the other modules are listed as disabled "coming soon" entries so
 * the shell shows the intended information architecture without dead links.
 */
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { StringKey } from '@/i18n/strings';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface NavItem {
  key: string;
  /** i18n key for the label. */
  labelKey: StringKey;
  /** Expo Router href. */
  href: string;
  icon: IoniconName;
  /** When true the destination is not implemented yet (disabled in the UI). */
  comingSoon?: boolean;
}

export const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', href: '/', icon: 'grid-outline' },
  { key: 'orders', labelKey: 'nav.orders', href: '/', icon: 'receipt-outline', comingSoon: true },
  {
    key: 'products',
    labelKey: 'nav.products',
    href: '/',
    icon: 'pricetags-outline',
    comingSoon: true,
  },
  {
    key: 'customers',
    labelKey: 'nav.customers',
    href: '/',
    icon: 'people-outline',
    comingSoon: true,
  },
  {
    key: 'connect-site',
    labelKey: 'nav.connectSite',
    href: '/',
    icon: 'link-outline',
    comingSoon: true,
  },
  {
    key: 'settings',
    labelKey: 'nav.settings',
    href: '/',
    icon: 'settings-outline',
    comingSoon: true,
  },
];
