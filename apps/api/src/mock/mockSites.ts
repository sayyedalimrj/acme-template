/**
 * Mock sites (backend skeleton).
 *
 * Secret-free site fixtures spanning several connection states. URLs are example domains;
 * no credentials, tokens, or secrets appear anywhere. The furthest state is `connected_mock`
 * — nothing here represents a real, credentialed connection.
 */
import type { Site } from '../domain/site';

export const mockSites: Site[] = [
  {
    id: 'site_demo_1',
    tenantId: 'tenant_demo_1',
    displayName: 'Demo Storefront',
    url: 'https://demo-store.example',
    platform: 'woocommerce',
    environment: 'production',
    status: 'connected_mock',
    capabilities: ['read_products', 'read_orders', 'read_customers', 'read_reports'],
    health: {
      state: 'healthy',
      checkedAt: '2026-06-16T08:00:00.000Z',
      message: 'Mock connection healthy.',
    },
    createdAt: '2026-01-12T09:10:00.000Z',
    connectedAt: '2026-01-13T11:20:00.000Z',
    lastSyncAt: '2026-06-16T08:00:00.000Z',
  },
  {
    id: 'site_demo_2',
    tenantId: 'tenant_demo_1',
    displayName: 'Demo Staging',
    url: 'https://staging.demo-store.example',
    platform: 'woocommerce',
    environment: 'staging',
    status: 'pending_secure_connection',
    capabilities: ['read_products'],
    health: { state: 'unknown' },
    createdAt: '2026-05-02T12:00:00.000Z',
  },
  {
    id: 'site_demo_3',
    tenantId: 'tenant_demo_2',
    displayName: 'Sandbox Shop',
    url: 'https://sandbox-shop.example',
    platform: 'wordpress',
    environment: 'production',
    status: 'connection_error',
    capabilities: [],
    health: {
      state: 'unreachable',
      checkedAt: '2026-06-10T07:30:00.000Z',
      message: 'Mock health check could not reach the site.',
    },
    createdAt: '2026-03-04T14:35:00.000Z',
  },
  {
    id: 'site_demo_4',
    tenantId: 'tenant_demo_2',
    displayName: 'New Draft Site',
    url: 'https://draft.example',
    platform: 'unknown',
    environment: 'unknown',
    status: 'draft',
    capabilities: [],
    health: { state: 'unknown' },
    createdAt: '2026-06-15T16:45:00.000Z',
  },
];
