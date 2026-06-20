import {
  portalForRole,
  roleCanUsePortal,
  roleHasPermission,
  type Role,
} from '../auth/rbac';
import { redactDeep, redactSensitiveText } from '../services/security/redaction';
import { toMinorUnits, fromMinorUnits } from '../services/money';

describe('RBAC matrix', () => {
  it('maps roles to portals', () => {
    expect(portalForRole('platform_admin')).toBe('admin');
    expect(portalForRole('support_admin')).toBe('admin');
    expect(portalForRole('merchant_owner')).toBe('merchant');
    expect(portalForRole('merchant_viewer')).toBe('merchant');
    expect(portalForRole('affiliate')).toBe('affiliate');
    expect(portalForRole('system')).toBeNull();
  });

  it('platform_admin can use any portal; others only their own', () => {
    expect(roleCanUsePortal('platform_admin', 'merchant')).toBe(true);
    expect(roleCanUsePortal('platform_admin', 'affiliate')).toBe(true);
    expect(roleCanUsePortal('merchant_owner', 'admin')).toBe(false);
    expect(roleCanUsePortal('affiliate', 'merchant')).toBe(false);
    expect(roleCanUsePortal('support_admin', 'admin')).toBe(true);
    expect(roleCanUsePortal('support_admin', 'merchant')).toBe(false);
  });

  it('support_admin is read-only (no admin.manage)', () => {
    expect(roleHasPermission('support_admin', 'admin.read')).toBe(true);
    expect(roleHasPermission('support_admin', 'admin.manage')).toBe(false);
    expect(roleHasPermission('platform_admin', 'admin.manage')).toBe(true);
  });

  it('merchant_viewer cannot manage; owner/manager can', () => {
    const viewer: Role = 'merchant_viewer';
    expect(roleHasPermission(viewer, 'merchant.read')).toBe(true);
    expect(roleHasPermission(viewer, 'merchant.manage_products')).toBe(false);
    expect(roleHasPermission('merchant_owner', 'merchant.manage_products')).toBe(true);
    expect(roleHasPermission('merchant_manager', 'merchant.manage_settings')).toBe(true);
  });

  it('affiliate cannot read merchant/admin data', () => {
    expect(roleHasPermission('affiliate', 'merchant.read')).toBe(false);
    expect(roleHasPermission('affiliate', 'admin.read')).toBe(false);
    expect(roleHasPermission('affiliate', 'affiliate.read')).toBe(true);
  });
});

describe('redaction', () => {
  it('redacts secret-like keys and values', () => {
    const out = redactDeep({ consumerSecret: 'cs_123', nested: { token: 'abc', name: 'ali' } }) as any;
    expect(out.consumerSecret).toBe('[REDACTED]');
    expect(out.nested.token).toBe('[REDACTED]');
    expect(out.nested.name).toBe('ali');
  });
  it('redacts woo keys and bearer tokens in free text', () => {
    expect(redactSensitiveText('key ck_abcdef123456 here')).toContain('[REDACTED]');
    expect(redactSensitiveText('Authorization: Bearer abc.def.ghi')).toContain('[REDACTED]');
  });
});

describe('money minor units', () => {
  it('converts decimal strings to integer minor units by currency', () => {
    expect(toMinorUnits('1850.50', 'USD')).toBe(185050);
    expect(toMinorUnits('1850', 'IRT')).toBe(1850); // 0-decimal
    expect(toMinorUnits('0', 'IRT')).toBe(0);
    expect(fromMinorUnits(185050, 'USD')).toBeCloseTo(1850.5);
  });
});
