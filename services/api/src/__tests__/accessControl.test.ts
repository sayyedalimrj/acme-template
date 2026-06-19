/** Tenant/site isolation tests (db mocked). */
jest.mock('../db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  pool: { connect: jest.fn() },
}));

import { queryOne } from '../db';
import { assertSiteAccess, assertTenantAccess } from '../services/accessControl';
import type { TokenClaims } from '../services/tokenService';

const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

const merchantA: TokenClaims = { sub: 'userA', role: 'merchant_owner', portal: 'merchant', tenantId: 'tenantA' };
const merchantB: TokenClaims = { sub: 'userB', role: 'merchant_owner', portal: 'merchant', tenantId: 'tenantB' };
const admin: TokenClaims = { sub: 'admin', role: 'platform_admin', portal: 'admin', tenantId: null };

describe('assertTenantAccess', () => {
  it('allows admins for any tenant without a membership lookup', async () => {
    await expect(assertTenantAccess(admin, 'any-tenant')).resolves.toBeUndefined();
    expect(mockedQueryOne).not.toHaveBeenCalled();
  });

  it('allows a member of the tenant', async () => {
    mockedQueryOne.mockResolvedValueOnce({ exists: true } as never);
    await expect(assertTenantAccess(merchantA, 'tenantA')).resolves.toBeUndefined();
  });

  it('denies a non-member (cross-tenant) with 403', async () => {
    mockedQueryOne.mockResolvedValueOnce(null as never);
    await expect(assertTenantAccess(merchantB, 'tenantA')).rejects.toMatchObject({ status: 403 });
  });
});

describe('assertSiteAccess', () => {
  it('404s for an unknown site', async () => {
    mockedQueryOne.mockResolvedValueOnce(null as never);
    await expect(assertSiteAccess(merchantA, 'ghost')).rejects.toMatchObject({ status: 404 });
  });

  it('denies access to another tenant\'s site (403)', async () => {
    // first call: resolve the site (owned by tenantA)
    mockedQueryOne.mockResolvedValueOnce({ id: 'site1', tenant_id: 'tenantA', url: '', status: 'connected', connection_mode: 'woo_rest' } as never);
    // second call: membership check for merchantB on tenantA → none
    mockedQueryOne.mockResolvedValueOnce(null as never);
    await expect(assertSiteAccess(merchantB, 'site1')).rejects.toMatchObject({ status: 403 });
  });

  it('allows the owning tenant member', async () => {
    mockedQueryOne.mockResolvedValueOnce({ id: 'site1', tenant_id: 'tenantA', url: '', status: 'connected', connection_mode: 'woo_rest' } as never);
    mockedQueryOne.mockResolvedValueOnce({ exists: true } as never);
    await expect(assertSiteAccess(merchantA, 'site1')).resolves.toMatchObject({ id: 'site1' });
  });
});
