/**
 * In-memory mock user fixtures for the auth flow.
 *
 * These are fake demo identities used purely to decide whether an OTP entry routes to the
 * dashboard (known user) or to registration (new user). No secrets, no passwords, no provider
 * keys, no real PII — just demo names + example identifiers. Nothing is persisted.
 */
import { detectIdentifier, normalizeMobile, type IdentifierChannel } from './authHelpers';

/** A known mock user (fake demo identity). */
export interface AuthMockUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

/** Known mock users. Anyone matching these is treated as an existing account. */
export const AUTH_MOCK_USERS: readonly AuthMockUser[] = [
  {
    id: 'usr_mock_operator',
    name: 'Demo Operator',
    email: 'operator@demo.local',
    mobile: '09123456789',
  },
  {
    id: 'usr_mock_sara',
    name: 'Sara Tajeri',
    email: 'sara@shop.example',
    mobile: '09120000000',
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
    const mobile = normalizeMobile(trimmed);
    return AUTH_MOCK_USERS.find((user) => normalizeMobile(user.mobile) === mobile) ?? null;
  }

  return null;
}

/** True when the identifier matches a known mock user. */
export function isKnownMockUser(identifier: string, channel?: IdentifierChannel): boolean {
  return findMockUser(identifier, channel) !== null;
}
