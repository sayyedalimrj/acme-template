/**
 * Server-side admin access (allow-list role reconciliation) + first-login profile completeness.
 *
 * Proves 09186441801 reaches platform_admin via the allow-list mechanism on the admin portal,
 * with no regression to merchant/affiliate logins, and that profile completeness needs name+email.
 */
jest.mock('../env', () => ({
  env: { AFFILIATE_OPEN_SIGNUP: true },
  isProduction: false,
  adminAllowlist: ['09186441801', '09125233608'],
  supportAllowlist: ['09120000000'],
}));

jest.mock('../db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  pool: { connect: jest.fn() },
}));

import { isProfileComplete, reconcileAdminRole, updateUserProfile } from '../services/userService';
import { queryOne } from '../db';

const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe('reconcileAdminRole (server-side admin allow-list)', () => {
  it('promotes an allow-listed mobile (09186441801) to platform_admin on admin login', () => {
    expect(reconcileAdminRole({ mobile: '09186441801', role: 'merchant_owner' }, 'admin')).toBe(
      'platform_admin',
    );
  });

  it('keeps an existing platform_admin as-is on admin login', () => {
    expect(reconcileAdminRole({ mobile: '09186441801', role: 'platform_admin' }, 'admin')).toBe(
      'platform_admin',
    );
  });

  it('does NOT change the role on non-admin portals (no merchant/affiliate regression)', () => {
    expect(reconcileAdminRole({ mobile: '09186441801', role: 'merchant_owner' }, 'merchant')).toBe(
      'merchant_owner',
    );
    expect(reconcileAdminRole({ mobile: '09186441801', role: 'affiliate' }, 'affiliate')).toBe(
      'affiliate',
    );
  });

  it('does NOT promote a mobile that is not on any allow-list', () => {
    expect(reconcileAdminRole({ mobile: '09120000001', role: 'merchant_owner' }, 'admin')).toBe(
      'merchant_owner',
    );
  });

  it('promotes a support-allow-list mobile to support_admin on admin login', () => {
    expect(reconcileAdminRole({ mobile: '09120000000', role: 'merchant_owner' }, 'admin')).toBe(
      'support_admin',
    );
  });
});

describe('isProfileComplete', () => {
  it('is false when name and/or email are missing or blank', () => {
    expect(isProfileComplete({ name: null, email: null })).toBe(false);
    expect(isProfileComplete({ name: 'Ali', email: null })).toBe(false);
    expect(isProfileComplete({ name: null, email: 'a@b.co' })).toBe(false);
    expect(isProfileComplete({ name: '   ', email: 'a@b.co' })).toBe(false);
  });

  it('is true only when both name and email are present', () => {
    expect(isProfileComplete({ name: 'Ali Karimi', email: 'a@b.co' })).toBe(true);
  });
});

describe('updateUserProfile', () => {
  beforeEach(() => jest.clearAllMocks());

  it('combines first + last name into a single name and persists email', async () => {
    mockedQueryOne.mockResolvedValueOnce({
      id: 'u1',
      mobile: '09186441801',
      name: 'Ali Karimi',
      email: 'a@b.co',
      role: 'platform_admin',
      status: 'active',
    } as never);

    const user = await updateUserProfile('u1', {
      firstName: 'Ali',
      lastName: 'Karimi',
      email: 'a@b.co',
    });

    expect(user.name).toBe('Ali Karimi');
    expect(mockedQueryOne).toHaveBeenCalledWith(expect.stringContaining('UPDATE app_user'), [
      'u1',
      'Ali Karimi',
      'a@b.co',
    ]);
  });
});
