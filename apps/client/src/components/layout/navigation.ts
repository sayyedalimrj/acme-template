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
  /** When true the route exists but the feature is a placeholder (shows a "Soon" badge). */
  placeholder?: boolean;
}

export const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', href: '/', icon: 'grid-outline' },
  { key: 'onboarding', labelKey: 'nav.onboarding', href: '/onboarding', icon: 'rocket-outline' },
  { key: 'support', labelKey: 'nav.support', href: '/support', icon: 'headset-outline' },
  { key: 'plans', labelKey: 'nav.plans', href: '/plans', icon: 'pricetags-outline' },
  { key: 'advisor', labelKey: 'nav.advisor', href: '/advisor', icon: 'sparkles-outline' },
  {
    key: 'intelligence',
    labelKey: 'nav.intelligence',
    href: '/intelligence',
    icon: 'analytics-outline',
  },
  {
    key: 'automations',
    labelKey: 'nav.automation',
    href: '/automations',
    icon: 'chatbubbles-outline',
  },
  { key: 'reports', labelKey: 'nav.reports', href: '/reports', icon: 'bar-chart-outline' },
  {
    key: 'media-studio',
    labelKey: 'nav.mediaStudio',
    href: '/media-studio',
    icon: 'color-palette-outline',
  },
  { key: 'connect-site', labelKey: 'nav.connectSite', href: '/connect-site', icon: 'link-outline' },
  { key: 'products', labelKey: 'nav.products', href: '/products', icon: 'pricetags-outline' },
  { key: 'inventory', labelKey: 'nav.inventory', href: '/inventory', icon: 'cube-outline' },
  { key: 'orders', labelKey: 'nav.orders', href: '/orders', icon: 'receipt-outline' },
  {
    key: 'fulfillment',
    labelKey: 'nav.fulfillment',
    href: '/fulfillment',
    icon: 'paper-plane-outline',
  },
  { key: 'customers', labelKey: 'nav.customers', href: '/customers', icon: 'people-outline' },
  { key: 'settings', labelKey: 'nav.settings', href: '/settings', icon: 'settings-outline' },
];
