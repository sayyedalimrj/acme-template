/**
 * Placeholder string catalog.
 *
 * Task 1 ships a minimal i18n layer so screens avoid hard-coded user-facing strings.
 * Full i18next wiring, additional locales, and RTL locale validation arrive in the
 * dedicated i18n hardening task. Keys are namespaced by area for easy migration.
 */

export const en = {
  'app.name': 'WooCommerce Client Dashboard',
  'nav.dashboard': 'Dashboard',
  'nav.orders': 'Orders',
  'nav.products': 'Products',
  'nav.customers': 'Customers',
  'nav.connectSite': 'Connect Site',
  'nav.settings': 'Settings',
  'nav.sectionMain': 'Manage',
  'nav.comingSoon': 'Coming soon',
  'topbar.menu': 'Menu',
  'topbar.account': 'Account',
  'common.viewAll': 'View all',
  'common.retry': 'Retry',
  'common.loading': 'Loading…',
  'common.demoData': 'Demo data',
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Overview of your store performance',
  'dashboard.metric.sales': 'Sales',
  'dashboard.metric.orders': 'Orders',
  'dashboard.metric.products': 'Products',
  'dashboard.metric.customers': 'Customers',
  'dashboard.recentOrders': 'Recent orders',
  'dashboard.topProducts': 'Top products',
  'dashboard.activity': 'Recent activity',
  'dashboard.error': 'Could not load dashboard data.',
  'dashboard.empty': 'No data to show yet.',
  'dashboard.col.order': 'Order',
  'dashboard.col.customer': 'Customer',
  'dashboard.col.status': 'Status',
  'dashboard.col.total': 'Total',
  'dashboard.col.date': 'Date',
  'dashboard.col.product': 'Product',
  'dashboard.col.sku': 'SKU',
  'dashboard.col.sold': 'Sold',
  'dashboard.col.revenue': 'Revenue',
} as const;

export type StringKey = keyof typeof en;

export const catalog = { en } as const;
export type Locale = keyof typeof catalog;
