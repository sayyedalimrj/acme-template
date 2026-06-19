/**
 * Test environment defaults. Set BEFORE any module (env.ts validates at import time). These are
 * non-secret test values — never real credentials.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://test:test@localhost:5432/test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-0123456789abcdef';
process.env.OTP_HASH_SECRET = process.env.OTP_HASH_SECRET ?? 'test-otp-secret-0123456789abcdef';
process.env.CREDENTIAL_ENCRYPTION_KEY =
  process.env.CREDENTIAL_ENCRYPTION_KEY ??
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 32-byte hex
process.env.ADMIN_MOBILE_ALLOWLIST = process.env.ADMIN_MOBILE_ALLOWLIST ?? '09120000000';
process.env.SMS_DRY_RUN = 'true';
