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
import { AUTH_MOCK_USERS, findMockUser, isKnownMockUser } from '../authMockUsers';

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
    expect(isValidMobile('123')).toBe(false);
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
    expect(findMockUser('09123456789')?.name).toBe('Demo Operator');
  });

  it('treats unknown identifiers as new users (registration)', () => {
    expect(isKnownMockUser('new.person@store.example')).toBe(false);
    expect(isKnownMockUser('09100000001', 'mobile')).toBe(false);
    expect(findMockUser('')).toBeNull();
  });
});

describe('no secrets in the auth mock', () => {
  it('mock users carry only id/name/email/mobile (no credentials)', () => {
    const serialized = JSON.stringify(AUTH_MOCK_USERS).toLowerCase();
    expect(serialized).not.toMatch(/password|secret|token|apikey|consumer/);
    for (const user of AUTH_MOCK_USERS) {
      expect(Object.keys(user).sort()).toEqual(['email', 'id', 'mobile', 'name']);
    }
  });
});
