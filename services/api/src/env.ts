/**
 * Typed, validated environment.
 *
 * Loads `.env` (dev) and validates every variable with zod so the server fails fast with a
 * clear message if something required is missing. No secret VALUES live in the repo — only this
 * contract. In production the values come from your secret manager.
 */
import 'dotenv/config';
import { z } from 'zod';

/** Coerce common truthy strings to a boolean (zod's coerce.boolean treats any non-empty as true). */
const boolish = (def: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : v === 'true' || v === '1' || v === 'yes'));

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGINS: z.string().default(''),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  OTP_HASH_SECRET: z.string().min(16, 'OTP_HASH_SECRET must be at least 16 chars'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  // 4 matches the app's OTP UI out of the box. If you raise it, also update the app's OTP boxes.
  OTP_LENGTH: z.coerce.number().int().min(4).max(8).default(4),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(60),
  OTP_REQUESTS_PER_HOUR: z.coerce.number().int().positive().default(10),

  SMS_DRY_RUN: boolish(false),
  IPPANEL_API_KEY: z.string().optional().default(''),
  IPPANEL_BASE_URL: z.string().default('https://api.ippanel.com/v1'),
  IPPANEL_PATTERN_CODE: z.string().optional().default(''),
  IPPANEL_ORIGINATOR: z.string().optional().default(''),
  IPPANEL_OTP_VARIABLE: z.string().default('code'),
  IPPANEL_AUTH_SCHEME: z.enum(['accesskey', 'apikey']).default('accesskey'),

  ADMIN_MOBILE_ALLOWLIST: z.string().default(''),
  AFFILIATE_OPEN_SIGNUP: boolish(true),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  // eslint-disable-next-line no-console
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;

/** Parsed list of allowed CORS origins. */
export const corsOrigins: string[] = env.CORS_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/** Parsed allow-list of admin mobiles (normalized to digits only). */
export const adminAllowlist: string[] = env.ADMIN_MOBILE_ALLOWLIST.split(',')
  .map((s) => s.replace(/\D/g, ''))
  .filter(Boolean);

export const isProduction = env.NODE_ENV === 'production';
