/**
 * In-memory mock user fixtures for the auth flow.
 *
 * These are fake demo identities used purely to decide whether an OTP entry routes to the
 * dashboard (known user) or to registration (new user), and to demo a password-login path for
 * already-registered accounts. The `password` here is a NON-SECRET demo credential for local
 * testing only — no real PII, no provider keys, nothing is persisted or sent anywhere.
 */
import { detectIdentifier, mobileDigitsOnly, type IdentifierChannel } from './authHelpers';

/**
 * Shared demo password for every mock account. NOT a secret — this is a local/testing-only
 * value so the password-login path is demonstrable without a backend.
 */
export const MOCK_PASSWORD = 'demo1234';

/** A known mock user (fake demo identity). */
export interface AuthMockUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  /** Non-secret demo password for the password-login path. */
  password: string;
}

/** Known mock users. Anyone matching these is treated as an existing account. */
export const AUTH_MOCK_USERS: readonly AuthMockUser[] = [
  {
    id: 'usr_mock_operator',
    name: 'اپراتور آزمایشی',
    email: 'operator@demo.local',
    mobile: '09123456789',
    password: MOCK_PASSWORD,
  },
  {
    id: 'usr_mock_sara',
    name: 'سارا تجری',
    email: 'sara@shop.example',
    mobile: '09120000000',
    password: MOCK_PASSWORD,
  },
];

/**
 * Find a known mock user by email or mobile. Email comparison is case-insensitive; mobile
 * comparison is normalized (digits only). Returns `null` for unknown/new users.
 */
export function findMockUser(identifier: string, channel?: IdentifierChannel): AuthMockUser | null {
  const trimmed = identifier.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const resolved = channel && channel !== 'unknown' ? channel : detectIdentifier(trimmed);

  if (resolved === 'email') {
    const email = trimmed.toLowerCase();
    return AUTH_MOCK_USERS.find((user) => user.email.toLowerCase() === email) ?? null;
  }

  if (resolved === 'mobile') {
    const mobile = mobileDigitsOnly(trimmed);
    const normalized =
      mobile.startsWith('98') && mobile.length === 12 ? `0${mobile.slice(2)}` : mobile;
    return (
      AUTH_MOCK_USERS.find((user) => {
        const userDigits = mobileDigitsOnly(user.mobile);
        return userDigits === normalized || userDigits === mobile;
      }) ?? null
    );
  }

  return null;
}

/** True when the identifier matches a known mock user. */
export function isKnownMockUser(identifier: string, channel?: IdentifierChannel): boolean {
  return findMockUser(identifier, channel) !== null;
}

/** Result of a mock password-login attempt. */
export type PasswordLoginResult =
  | { ok: true; user: AuthMockUser }
  | { ok: false; reason: 'unknown_user' | 'wrong_password' };

/**
 * Verify a mock password-login attempt. Returns the matched user on success, or a typed reason
 * on failure (unknown account vs. wrong password). MOCK-ONLY — no backend, nothing persisted.
 */
export function verifyMockPassword(
  identifier: string,
  password: string,
  channel?: IdentifierChannel,
): PasswordLoginResult {
  const user = findMockUser(identifier, channel);
  if (!user) {
    return { ok: false, reason: 'unknown_user' };
  }
  if (password !== user.password) {
    return { ok: false, reason: 'wrong_password' };
  }
  return { ok: true, user };
}
