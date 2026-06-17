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
  /** Whether the group starts expanded (workflow-first defaults). */
  defaultOpen?: boolean;
}

/**
 * Grouped navigation, ordered as a commerce operating workflow:
 * Setup & Connection (شروع و اتصال) → Store Operations (عملیات فروشگاه) →
 * Growth & Marketing (رشد و بازاریابی) → Support Operations (پشتیبانی و عملیات) →
 * Platform Admin (مدیریت پلتفرم) → System (سیستم). Section labels are localized via i18n.
 * Setup and Store Operations start expanded; the rest collapse by default (the group holding
 * the active route auto-opens — see Sidebar).
 */
export const navSections: NavSection[] = [
  {
    key: 'setup',
    labelKey: 'nav.section.setup',
    defaultOpen: true,
    items: [
      {
        key: 'connect-site',
        labelKey: 'nav.connectSite',
        href: '/connect-site',
        icon: 'link-outline',
      },
      { key: 'onboarding', labelKey: 'nav.onboarding', href: '/onboarding', icon: 'rocket-outline' },
    ],
  },
  {
    key: 'store-ops',
    labelKey: 'nav.section.storeOps',
    defaultOpen: true,
    items: [
      { key: 'dashboard', labelKey: 'nav.dashboard', href: '/', icon: 'grid-outline' },
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
    key: 'support-ops',
    labelKey: 'nav.section.supportOps',
    items: [{ key: 'support', labelKey: 'nav.support', href: '/support', icon: 'headset-outline' }],
  },
  {
    key: 'platform',
    labelKey: 'nav.section.platform',
    items: [{ key: 'plans', labelKey: 'nav.plans', href: '/plans', icon: 'pricetags-outline' }],
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
