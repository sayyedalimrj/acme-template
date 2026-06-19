/**
 * Mock site connections. Frontend-safe metadata ONLY — no credentials, ever.
 *
 * Real connections (with WooCommerce keys / WP application passwords) are handled exclusively
 * by the future backend/proxy. These mocks model multi-site context and connection status.
 */
import type { SiteConnection } from '@/domain/types';

export const sites: SiteConnection[] = [
  {
    id: 'site_demo',
    name: 'فروشگاه بادبان',
    url: 'https://northwind-demo.example.test',
    status: 'connected',
    wooVersion: '9.1.2',
    wpVersion: '6.6',
    currency: 'USD',
    timezone: 'America/Los_Angeles',
    lastSyncedAt: '2026-06-15T08:00:00Z',
  },
  {
    id: 'site_atelier',
    name: 'آتلیه خانه',
    url: 'https://atelier-demo.example.test',
    status: 'connected',
    wooVersion: '9.0.0',
    wpVersion: '6.5',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    lastSyncedAt: '2026-06-14T22:30:00Z',
  },
];

export const DEFAULT_ACTIVE_SITE_ID = 'site_demo';
