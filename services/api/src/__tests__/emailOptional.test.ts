/**
 * Email is OPTIONAL for profile completion (P0): a profile is complete once the user has a name,
 * with or without an email. `db` is mocked so importing the service has no side effects.
 */
jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
  queryOne: jest.fn().mockResolvedValue(null),
  pool: { connect: jest.fn() },
}));

import { isProfileComplete } from '../services/userService';

describe('profile completion — email optional', () => {
  it('is complete with a name and NO email', () => {
    expect(isProfileComplete({ name: 'علی کریمی', email: null })).toBe(true);
    expect(isProfileComplete({ name: 'علی کریمی', email: '' })).toBe(true);
  });

  it('is complete with a name AND an email', () => {
    expect(isProfileComplete({ name: 'علی کریمی', email: 'ali@example.com' })).toBe(true);
  });

  it('is incomplete without a name (regardless of email)', () => {
    expect(isProfileComplete({ name: '', email: 'ali@example.com' })).toBe(false);
    expect(isProfileComplete({ name: '   ', email: null })).toBe(false);
  });
});
