// Jest configuration for the Expo app.
// Uses the official `jest-expo` preset (Babel transform, RN/Expo module handling, native
// test environment). Object options here are merged with the preset; the `@/` alias mirrors
// the tsconfig path mapping so tests import the same way app code does.
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**', '!src/**/*.d.ts'],
};
