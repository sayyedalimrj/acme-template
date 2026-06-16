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
  'nav.soon': 'Soon',
  'topbar.menu': 'Menu',
  'topbar.account': 'Account',
  'topbar.signOut': 'Sign out',
  'common.viewAll': 'View all',
  'common.retry': 'Retry',
  'common.loading': 'Loading…',
  'common.demoData': 'Demo data',
  'common.cancel': 'Cancel',
  // Authentication
  'auth.title': 'Sign in',
  'auth.subtitle': 'Sign in to manage your connected stores.',
  'auth.nameLabel': 'Your name',
  'auth.namePlaceholder': 'e.g. Alex Operator',
  'auth.emailLabel': 'Email',
  'auth.emailPlaceholder': 'you@company.com',
  'auth.signInCta': 'Sign in to continue',
  'auth.signingIn': 'Signing in…',
  'auth.mockNote':
    'Demo sign-in — no password is required and nothing is stored. Real authentication will be added later.',
  // Active site indicator
  'site.activeLabel': 'Active site',
  'site.none': 'No site connected',
  'site.connectCta': 'Connect a site',
  'site.manage': 'Manage sites',
  // Connect Site
  'connectSite.title': 'Connect Site',
  'connectSite.subtitle': 'Connect and switch between the WordPress/WooCommerce stores you manage.',
  'connectSite.connectedHeading': 'Connected stores',
  'connectSite.empty': 'No stores connected yet. Add your first store below.',
  'connectSite.error': 'Could not load connected stores.',
  'connectSite.active': 'Active',
  'connectSite.setActive': 'Set active',
  'connectSite.disconnect': 'Disconnect',
  'connectSite.addHeading': 'Connect a new store',
  'connectSite.nameLabel': 'Store name',
  'connectSite.namePlaceholder': 'e.g. Northwind Goods',
  'connectSite.urlLabel': 'Store URL',
  'connectSite.urlPlaceholder': 'https://store.example.com',
  'connectSite.connectCta': 'Connect store',
  'connectSite.connecting': 'Connecting…',
  'connectSite.securityNote':
    'Security: this MVP stores only the store name and URL. WooCommerce keys/secrets and WordPress application passwords are never entered or stored in the app — real connections will be handled by a secure backend/proxy.',
  'connectSite.nameRequired': 'Store name is required.',
  'connectSite.urlRequired': 'A valid store URL (http/https) is required.',
  // Placeholder screens
  'placeholder.title': 'Coming soon',
  'placeholder.body':
    'This module is part of the roadmap and will be built in an upcoming release.',
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
