/**
 * Mock data for the mobile dashboard (frontend-only, no backend).
 *
 * Static, customer-friendly fixtures that drive the home / more / support / notifications
 * screens. No real PII, no credentials, no provider keys, no external calls. All labels are
 * i18n keys so Persian/English stay in parity. Counts are illustrative only.
 */
import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { ActivityTint } from './components/MiniActivityRow';
import type { StringKey } from '@/i18n/strings';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** One of the four primary home quick actions. */
export interface QuickAction {
  key: string;
  labelKey: StringKey;
  icon: IoniconName;
  href: string;
  count?: number;
}

export const QUICK_ACTIONS: readonly QuickAction[] = [
  {
    key: 'products',
    labelKey: 'home.quick.products',
    icon: 'pricetags-outline',
    href: '/products',
  },
  {
    key: 'orders',
    labelKey: 'home.quick.orders',
    icon: 'receipt-outline',
    href: '/orders',
    count: 6,
  },
  {
    key: 'customers',
    labelKey: 'home.quick.customers',
    icon: 'people-outline',
    href: '/customers',
  },
  { key: 'payments', labelKey: 'home.quick.payments', icon: 'card-outline', href: '/payments' },
];

/** A tool entry inside the More features grid. */
export interface FeatureEntry {
  key: string;
  labelKey: StringKey;
  icon: IoniconName;
  href: string;
  badge?: number;
}

/** A titled section of the More features screen. */
export interface FeatureSection {
  key: string;
  titleKey: StringKey;
  items: FeatureEntry[];
}

export const FEATURE_SECTIONS: readonly FeatureSection[] = [
  {
    key: 'manage',
    titleKey: 'more.section.manage',
    items: [
      {
        key: 'products',
        labelKey: 'home.quick.products',
        icon: 'pricetags-outline',
        href: '/products',
      },
      { key: 'orders', labelKey: 'home.quick.orders', icon: 'receipt-outline', href: '/orders' },
      {
        key: 'customers',
        labelKey: 'home.quick.customers',
        icon: 'people-outline',
        href: '/customers',
      },
      { key: 'payments', labelKey: 'home.quick.payments', icon: 'card-outline', href: '/payments' },
    ],
  },
  {
    key: 'growth',
    titleKey: 'more.section.growth',
    items: [
      { key: 'reports', labelKey: 'more.reports', icon: 'bar-chart-outline', href: '/reports' },
      {
        key: 'campaigns',
        labelKey: 'more.campaigns',
        icon: 'megaphone-outline',
        href: '/automations',
      },
      { key: 'sms', labelKey: 'more.sms', icon: 'chatbox-outline', href: '/automations' },
    ],
  },
  {
    // Smart/AI services get their own clearly-labeled section so the "grow sales" group stays
    // simple and uncluttered (one purpose per card).
    key: 'smart',
    titleKey: 'more.section.smart',
    items: [
      { key: 'smartTips', labelKey: 'more.smartTips', icon: 'sparkles-outline', href: '/advisor' },
      { key: 'media', labelKey: 'more.media', icon: 'color-palette-outline', href: '/media-studio' },
      {
        key: 'behavior',
        labelKey: 'more.behavior',
        icon: 'people-circle-outline',
        href: '/intelligence',
      },
    ],
  },
  {
    key: 'site',
    titleKey: 'more.section.site',
    items: [
      { key: 'siteStatus', labelKey: 'more.siteStatus', icon: 'pulse-outline', href: '/settings' },
      {
        key: 'connectSite',
        labelKey: 'more.connectSite',
        icon: 'add-circle-outline',
        href: '/connect-site',
      },
      {
        key: 'siteSettings',
        labelKey: 'more.siteSettings',
        icon: 'settings-outline',
        href: '/settings',
      },
      {
        key: 'subscription',
        labelKey: 'more.subscription',
        icon: 'pricetag-outline',
        href: '/plans',
      },
      {
        key: 'social',
        labelKey: 'more.socialChannels',
        icon: 'share-social-outline',
        href: '/social-channels',
      },
    ],
  },
  {
    key: 'support',
    titleKey: 'more.section.support',
    items: [
      { key: 'chat', labelKey: 'more.chat', icon: 'chatbubbles-outline', href: '/support' },
      { key: 'newRequest', labelKey: 'more.newRequest', icon: 'create-outline', href: '/support' },
      { key: 'guide', labelKey: 'more.guide', icon: 'help-buoy-outline', href: '/support' },
    ],
  },
];

/** A short home activity item. */
export interface ActivityItem {
  id: string;
  icon: IoniconName;
  tint: ActivityTint;
  titleKey: StringKey;
  captionKey: StringKey;
}

export const RECENT_ACTIVITY: readonly ActivityItem[] = [
  {
    id: 'act_order',
    icon: 'receipt-outline',
    tint: 'primary',
    titleKey: 'home.activity.newOrder',
    captionKey: 'home.activity.newOrderCaption',
  },
  {
    id: 'act_payment',
    icon: 'card-outline',
    tint: 'success',
    titleKey: 'home.activity.paymentSuccess',
    captionKey: 'home.activity.paymentSuccessCaption',
  },
  {
    id: 'act_stock',
    icon: 'cube-outline',
    tint: 'attention',
    titleKey: 'home.activity.lowStock',
    captionKey: 'home.activity.lowStockCaption',
  },
];

/** A notification, grouped by topic. */
export interface NotificationItem {
  id: string;
  icon: IoniconName;
  tint: ActivityTint;
  titleKey: StringKey;
  captionKey: StringKey;
  unread?: boolean;
}

export interface NotificationGroup {
  key: string;
  titleKey: StringKey;
  items: NotificationItem[];
}

export const NOTIFICATION_GROUPS: readonly NotificationGroup[] = [
  {
    key: 'orders',
    titleKey: 'notif.group.orders',
    items: [
      {
        id: 'n_order_1',
        icon: 'receipt-outline',
        tint: 'primary',
        titleKey: 'home.activity.newOrder',
        captionKey: 'home.activity.newOrderCaption',
        unread: true,
      },
    ],
  },
  {
    key: 'payments',
    titleKey: 'notif.group.payments',
    items: [
      {
        id: 'n_pay_1',
        icon: 'card-outline',
        tint: 'success',
        titleKey: 'home.activity.paymentSuccess',
        captionKey: 'home.activity.paymentSuccessCaption',
        unread: true,
      },
    ],
  },
  {
    key: 'site',
    titleKey: 'notif.group.site',
    items: [
      {
        id: 'n_site_1',
        icon: 'pulse-outline',
        tint: 'attention',
        titleKey: 'notif.site.review',
        captionKey: 'notif.site.reviewCaption',
      },
    ],
  },
  {
    key: 'support',
    titleKey: 'notif.group.support',
    items: [
      {
        id: 'n_support_1',
        icon: 'chatbubble-ellipses-outline',
        tint: 'primary',
        titleKey: 'home.activity.supportMessage',
        captionKey: 'csupport.previewCaption',
        unread: true,
      },
    ],
  },
];

/** A recent support conversation preview. */
export interface SupportPreview {
  id: string;
  titleKey: StringKey;
  captionKey: StringKey;
  unread?: boolean;
}

export const SUPPORT_PREVIEW: readonly SupportPreview[] = [
  {
    id: 'sp_1',
    titleKey: 'csupport.previewTitle',
    captionKey: 'csupport.previewCaption',
    unread: true,
  },
];

// ---------------------------------------------------------------------------
// Home "at a glance" overview chart (mock, deterministic)
// ---------------------------------------------------------------------------

/** Which metric the overview chart shows. */
export type OverviewMetric = 'sales' | 'orders' | 'customers';
/** Time range for the overview chart. */
export type OverviewRange = 'week' | 'month' | 'year';

export const OVERVIEW_METRICS: readonly { value: OverviewMetric; labelKey: StringKey }[] = [
  { value: 'sales', labelKey: 'home.overview.sales' },
  { value: 'orders', labelKey: 'home.overview.orders' },
  { value: 'customers', labelKey: 'home.overview.customers' },
];

export const OVERVIEW_RANGES: readonly { value: OverviewRange; labelKey: StringKey }[] = [
  { value: 'week', labelKey: 'home.overview.week' },
  { value: 'month', labelKey: 'home.overview.month' },
  { value: 'year', labelKey: 'home.overview.year' },
];

const RANGE_LENGTH: Record<OverviewRange, number> = { week: 7, month: 4, year: 12 };

/** Stable small integer seed derived from a site id, so each store has its own shape/scale. */
function siteSeedFromId(siteId?: string): number {
  if (!siteId) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < siteId.length; i += 1) {
    hash = (hash * 31 + siteId.charCodeAt(i)) % 997;
  }
  return hash;
}

/** Deterministic pseudo-value so the chart is stable across renders (no backend). */
function seededValue(
  metric: OverviewMetric,
  range: OverviewRange,
  index: number,
  siteSeed: number,
): number {
  const metricSeed = metric === 'sales' ? 7 : metric === 'orders' ? 3 : 5;
  const rangeSeed = range === 'week' ? 11 : range === 'month' ? 17 : 23;
  // Smooth-ish deterministic wave in [0.35, 1]; the site seed shifts the phase per store.
  const wave = (Math.sin((index + 1) * metricSeed * 0.5 + rangeSeed + siteSeed * 0.37) + 1) / 2;
  const factor = 0.4 + wave * 0.6;
  const base = metric === 'sales' ? 4_200_000 : metric === 'orders' ? 38 : 22;
  const scale = range === 'week' ? 1 : range === 'month' ? 4 : 12;
  // Per-store magnitude multiplier (0.7–1.3) so totals visibly differ between stores.
  const storeFactor = 0.7 + ((siteSeed % 13) / 12) * 0.6;
  return Math.round(base * scale * factor * storeFactor);
}

export interface OverviewSeries {
  /** Per-bucket values (length depends on the range). */
  values: number[];
  /** Sum across the period. */
  total: number;
  /** Change vs. the previous period (whole-number percent; can be negative). */
  trendPercent: number;
}

/** Build a deterministic mock series for a metric + range, optionally per-store via `siteId`. */
export function buildOverviewSeries(
  metric: OverviewMetric,
  range: OverviewRange,
  siteId?: string,
): OverviewSeries {
  const siteSeed = siteSeedFromId(siteId);
  const length = RANGE_LENGTH[range];
  const values = Array.from({ length }, (_, i) => seededValue(metric, range, i, siteSeed));
  const total = values.reduce((sum, v) => sum + v, 0);
  const half = Math.max(1, Math.floor(length / 2));
  const firstAvg = values.slice(0, half).reduce((s, v) => s + v, 0) / half;
  const lastAvg = values.slice(-half).reduce((s, v) => s + v, 0) / half;
  const trendPercent =
    firstAvg > 0 ? Math.round(((lastAvg - firstAvg) / firstAvg) * 100) : 0;
  return { values, total, trendPercent };
}

/** Per-store counts for the home quick actions (orders/customers), so they switch with the site. */
export interface QuickActionCounts {
  orders: number;
}

export function quickActionCountsForSite(siteId?: string): QuickActionCounts {
  const seed = siteSeedFromId(siteId);
  // 2–14 open orders, deterministic per store.
  return { orders: 2 + (seed % 13) };
}

/** Localized renewal label key per known mock site id (customer-friendly date). */
export const SITE_RENEWAL_KEYS: Record<string, StringKey> = {
  site_demo: 'home.hero.renewalA',
  site_atelier: 'home.hero.renewalB',
};

/** Unread counters surfaced in the header (illustrative). */
export const UNREAD = {
  notifications: 3,
  support: 1,
} as const;
