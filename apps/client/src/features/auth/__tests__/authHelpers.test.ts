import { describe, expect, it } from '@jest/globals';

import {
  MOCK_OTP_CODE,
  OTP_LENGTH,
  detectIdentifier,
  isOtpComplete,
  isValidEmail,
  isValidIdentifier,
  isValidMobile,
  maskIdentifier,
  normalizeMobile,
  sendOtpMock,
  toAsciiDigits,
} from '../authHelpers';
import {
  AUTH_MOCK_USERS,
  MOCK_PASSWORD,
  findMockUser,
  isKnownMockUser,
  verifyMockPassword,
} from '../authMockUsers';

describe('identifier detection', () => {
  it('detects valid emails', () => {
    expect(detectIdentifier('you@company.com')).toBe('email');
    expect(isValidEmail('you@company.com')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('detects valid mobile numbers (digit/plus/leading-zero tolerant)', () => {
    expect(detectIdentifier('09123456789')).toBe('mobile');
    expect(detectIdentifier('+98 912 345 6789')).toBe('mobile');
    expect(detectIdentifier('0912-345-6789')).toBe('mobile');
    expect(isValidMobile('09123456789')).toBe(true);
    expect(isValidMobile('9123456789')).toBe(true);
    expect(isValidMobile('+98 912 345 6789')).toBe(true);
    expect(isValidMobile('123')).toBe(false);
    expect(isValidMobile('+98 912 345 678')).toBe(false);
  });

  it('normalizes Persian/Arabic digits and separators', () => {
    expect(toAsciiDigits('۰۹۱۲')).toBe('0912');
    expect(normalizeMobile('۰۹۱۲ ۳۴۵ ۶۷۸۹')).toBe('09123456789');
    expect(detectIdentifier('۰۹۱۲۳۴۵۶۷۸۹')).toBe('mobile');
  });

  it('returns unknown for invalid input', () => {
    expect(detectIdentifier('')).toBe('unknown');
    expect(detectIdentifier('hello world')).toBe('unknown');
    expect(detectIdentifier('@@@')).toBe('unknown');
    expect(isValidIdentifier('hello world')).toBe(false);
    expect(isValidIdentifier('you@company.com')).toBe(true);
  });
});

describe('masking', () => {
  it('masks emails to first char + domain', () => {
    expect(maskIdentifier('operator@demo.local', 'email')).toBe('o•••@demo.local');
  });

  it('masks mobiles to the last three digits', () => {
    expect(maskIdentifier('09123456789', 'mobile')).toBe(`${'•'.repeat(8)}789`);
  });
});

describe('mock OTP', () => {
  it('returns the deterministic demo code and never sends anything', () => {
    expect(MOCK_OTP_CODE).toBe('1234');
    expect(OTP_LENGTH).toBe(4);
    const result = sendOtpMock('09123456789', 'mobile');
    expect(result.code).toBe('1234');
    expect(result.channel).toBe('mobile');
  });

  it('validates OTP completeness', () => {
    expect(isOtpComplete(['1', '2', '3', '4'])).toBe(true);
    expect(isOtpComplete(['1', '2', '3', ''])).toBe(false);
    expect(isOtpComplete(['1', '2', '3'])).toBe(false);
    expect(isOtpComplete(['1', '2', '3', 'a'])).toBe(false);
  });
});

describe('mock user routing', () => {
  it('routes known identifiers to an existing account', () => {
    expect(isKnownMockUser('operator@demo.local', 'email')).toBe(true);
    expect(isKnownMockUser('OPERATOR@DEMO.LOCAL')).toBe(true);
    expect(isKnownMockUser('09123456789', 'mobile')).toBe(true);
    expect(isKnownMockUser('+98 912 345 6789', 'mobile')).toBe(true);
    expect(findMockUser('09123456789')?.name).toBe('اپراتور آزمایشی');
    expect(findMockUser('+98 912 345 6789')?.name).toBe('اپراتور آزمایشی');
  });

  it('treats unknown identifiers as new users (registration)', () => {
    expect(isKnownMockUser('new.person@store.example')).toBe(false);
    expect(isKnownMockUser('09100000001', 'mobile')).toBe(false);
    expect(findMockUser('')).toBeNull();
  });
});

describe('password login (mock)', () => {
  it('signs in a known user with the demo password', () => {
    const result = verifyMockPassword('operator@demo.local', MOCK_PASSWORD, 'email');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.name).toBe('اپراتور آزمایشی');
    }
  });

  it('rejects a wrong password for a known user', () => {
    const result = verifyMockPassword('09123456789', 'nope', 'mobile');
    expect(result).toEqual({ ok: false, reason: 'wrong_password' });
  });

  it('reports unknown accounts so they can register with a code', () => {
    const result = verifyMockPassword('new.person@store.example', MOCK_PASSWORD);
    expect(result).toEqual({ ok: false, reason: 'unknown_user' });
  });
});

describe('no real secrets in the auth mock', () => {
  it('mock users carry only a shared demo password and no real provider credentials', () => {
    // A non-secret demo password is intentional (password-login demo). Guard against REAL
    // provider credentials leaking into the frontend mock.
    const serialized = JSON.stringify(AUTH_MOCK_USERS).toLowerCase();
    expect(serialized).not.toMatch(/secret|token|apikey|consumer/);
    for (const user of AUTH_MOCK_USERS) {
      expect(Object.keys(user).sort()).toEqual(['email', 'id', 'mobile', 'name', 'password']);
      expect(user.password).toBe(MOCK_PASSWORD);
    }
  });
});
