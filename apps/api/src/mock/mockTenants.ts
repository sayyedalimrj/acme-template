/**
 * Mock tenants + users (backend skeleton).
 *
 * Small, secret-free fixtures for examples/tests. No real PII, no credentials, no secrets.
 * Emails are intentionally omitted (placeholders only would still be PII-shaped).
 */
import type { ApiUser } from '../domain/user';
import type { Tenant } from '../domain/tenant';

export const mockTenants: Tenant[] = [
  {
    id: 'tenant_demo_1',
    name: 'Demo Commerce Co.',
    status: 'active',
    plan: 'growth',
    createdAt: '2026-01-12T09:00:00.000Z',
    region: 'IR',
  },
  {
    id: 'tenant_demo_2',
    name: 'Sandbox Retail',
    status: 'active',
    plan: 'starter',
    createdAt: '2026-03-04T14:30:00.000Z',
    region: 'IR',
  },
];

export const mockApiUsers: ApiUser[] = [
  {
    id: 'user_owner_1',
    tenantId: 'tenant_demo_1',
    displayName: 'Demo Owner',
    role: 'owner',
    status: 'active',
    createdAt: '2026-01-12T09:05:00.000Z',
  },
  {
    id: 'user_staff_1',
    tenantId: 'tenant_demo_1',
    displayName: 'Demo Staff',
    role: 'staff',
    status: 'active',
    createdAt: '2026-02-01T10:00:00.000Z',
  },
];
