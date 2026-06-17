/**
 * Navigation model for the app shell.
 *
 * Data-driven nav (inspired by Ecme's grouped navigation config). Items are organized into
 * labeled sections — Store Operations, Growth, Platform, System — so the sidebar reads as a
 * premium SaaS information architecture rather than one long flat list. Every destination is
 * a real Expo Router route; active state is derived from the pathname (see NavLink).
 *
 * `navItems` remains exported as the flattened list (section order) so the mobile nav and any
 * consumer that wants a single list keep working without knowing about sections.
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

export interface NavSection {
  key: string;
  /** i18n key for the section header label. */
  labelKey: StringKey;
  items: NavItem[];
}

/**
 * Grouped navigation. Section labels are localized (English + Persian) via i18n keys:
 * Store Operations (عملیات فروشگاه), Growth (رشد), Platform (پلتفرم), System (سیستم).
 */
export const navSections: NavSection[] = [
  {
    key: 'store-ops',
    labelKey: 'nav.section.storeOps',
    items: [
      { key: 'dashboard', labelKey: 'nav.dashboard', href: '/', icon: 'grid-outline' },
      {
        key: 'connect-site',
        labelKey: 'nav.connectSite',
        href: '/connect-site',
        icon: 'link-outline',
      },
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
    ],
  },
  {
    key: 'growth',
    labelKey: 'nav.section.growth',
    items: [
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
    ],
  },
  {
    key: 'platform',
    labelKey: 'nav.section.platform',
    items: [
      { key: 'onboarding', labelKey: 'nav.onboarding', href: '/onboarding', icon: 'rocket-outline' },
      { key: 'support', labelKey: 'nav.support', href: '/support', icon: 'headset-outline' },
      { key: 'plans', labelKey: 'nav.plans', href: '/plans', icon: 'pricetags-outline' },
    ],
  },
  {
    key: 'system',
    labelKey: 'nav.section.system',
    items: [
      { key: 'settings', labelKey: 'nav.settings', href: '/settings', icon: 'settings-outline' },
    ],
  },
];

/** Flattened list (section order) for the mobile nav and single-list consumers. */
export const navItems: NavItem[] = navSections.flatMap((section) => section.items);
