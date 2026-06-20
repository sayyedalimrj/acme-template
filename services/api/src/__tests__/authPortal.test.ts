/** Auth portal isolation + OTP context tests (db + SMS mocked). */
jest.mock('../db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  pool: { connect: jest.fn() },
}));

jest.mock('../providers/ippanel', () => ({
  sendOtpSms: jest.fn(),
}));

jest.mock('../env', () => ({
  env: {
    OTP_HASH_SECRET: 'test-otp-secret-0123456789abcdef',
    OTP_LENGTH: 4,
    OTP_TTL_SECONDS: 120,
    OTP_RESEND_COOLDOWN_SECONDS: 60,
    OTP_REQUESTS_PER_HOUR: 20,
    OTP_MAX_ATTEMPTS: 5,
    SMS_DRY_RUN: true,
    AFFILIATE_OPEN_SIGNUP: true,
  },
  isProduction: false,
  adminAllowlist: ['09125233608'],
  supportAllowlist: [],
}));

import { query, queryOne } from '../db';
import { sendOtpSms } from '../providers/ippanel';
import { allowedPortalsForRole, canonicalizePortal, roleCanUsePortal } from '../auth/rbac';
import { requestOtp, verifyOtp } from '../services/otpService';
import { findOrCreateUser } from '../services/userService';

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockedSendOtpSms = sendOtpSms as jest.MockedFunction<typeof sendOtpSms>;

describe('canonicalizePortal', () => {
  it('maps partner → affiliate and rejects unknown values', () => {
    expect(canonicalizePortal('partner')).toBe('affiliate');
    expect(canonicalizePortal('merchant')).toBe('merchant');
    expect(canonicalizePortal('ADMIN')).toBe('admin');
    expect(canonicalizePortal('unknown')).toBeNull();
  });
});

describe('allowedPortalsForRole', () => {
  it('returns home portal for each role; platform_admin gets all three', () => {
    expect(allowedPortalsForRole('merchant_owner')).toEqual(['merchant']);
    expect(allowedPortalsForRole('affiliate')).toEqual(['affiliate']);
    expect(allowedPortalsForRole('support_admin')).toEqual(['admin']);
    expect(allowedPortalsForRole('platform_admin')).toEqual(['merchant', 'admin', 'affiliate']);
  });
});

describe('requestOtp portal context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedQueryOne.mockResolvedValue({ count: '0' } as never);
    mockedSendOtpSms.mockResolvedValue({ delivered: false, provider: 'dry_run' });
    mockedQuery.mockResolvedValue([] as never);
  });

  it('stores the portal on the OTP row', async () => {
    await requestOtp('09123456789', 'admin', '127.0.0.1');
    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO otp_code'),
      expect.arrayContaining(['09123456789', expect.any(String), 'admin']),
    );
  });

  it('does not insert OTP row when SMS provider fails (no cooldown consumed)', async () => {
    mockedSendOtpSms.mockRejectedValueOnce(new Error('provider down'));
    await expect(requestOtp('09123456789', 'merchant')).rejects.toThrow();
    expect(mockedQuery).not.toHaveBeenCalled();
  });
});

describe('verifyOtp portal mismatch', () => {
  it('rejects when verify portal differs from stored OTP portal', async () => {
    mockedQueryOne.mockResolvedValueOnce({
      id: '1',
      code_hash: 'abc',
      portal: 'merchant',
      attempts: 0,
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    } as never);

    await expect(verifyOtp('09123456789', '1234', 'admin')).rejects.toMatchObject({
      code: 'otp_portal_mismatch',
    });
  });
});

describe('findOrCreateUser admin bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates platform_admin when mobile is on ADMIN_MOBILE_ALLOWLIST via admin portal', async () => {
    mockedQueryOne.mockResolvedValueOnce(null as never);

    const client = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
        if (sql.includes('INSERT INTO app_user')) {
          return {
            rows: [
              {
                id: 'u1',
                mobile: '09125233608',
                name: null,
                email: null,
                role: 'platform_admin',
                status: 'active',
              },
            ],
          };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    (require('../db').pool.connect as jest.Mock).mockResolvedValueOnce(client);

    const user = await findOrCreateUser('09125233608', 'admin');
    expect(user.role).toBe('platform_admin');
    expect(roleCanUsePortal(user.role, 'admin')).toBe(true);
  });

  it('rejects admin allowlist mobile on merchant portal (creates merchant_owner instead)', async () => {
    mockedQueryOne.mockResolvedValueOnce(null as never);

    const client = {
      query: jest.fn().mockImplementation(async (sql: string) => {
        if (sql === 'BEGIN' || sql === 'COMMIT') return { rows: [] };
        if (sql.includes('INSERT INTO app_user')) {
          return {
            rows: [
              {
                id: 'u2',
                mobile: '09125233608',
                name: null,
                email: null,
                role: 'merchant_owner',
                status: 'active',
              },
            ],
          };
        }
        if (sql.includes('INSERT INTO tenant')) {
          return { rows: [{ id: 't1' }] };
        }
        if (sql.includes('INSERT INTO merchant')) {
          return { rows: [{ id: 'm1' }] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    (require('../db').pool.connect as jest.Mock).mockResolvedValueOnce(client);

    const user = await findOrCreateUser('09125233608', 'merchant');
    expect(user.role).toBe('merchant_owner');
    expect(roleCanUsePortal(user.role, 'admin')).toBe(false);
  });

  it('rejects existing merchant logging into admin portal', async () => {
    mockedQueryOne.mockResolvedValueOnce({
      id: 'm1',
      mobile: '09123456789',
      name: 'Ali',
      email: null,
      role: 'merchant_owner',
      status: 'active',
    } as never);

    await expect(findOrCreateUser('09123456789', 'admin')).rejects.toMatchObject({ status: 403 });
  });
});
