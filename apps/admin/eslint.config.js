// Flat ESLint config for the internal admin Expo app (mirrors apps/client).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*', 'web-build/*'],
  },
  {
    files: ['jest.setup.js'],
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
  },
  {
    rules: {
      // Same cross-platform guardrails as the merchant app: no browser globals / DOM access.
      'no-restricted-globals': [
        'error',
        {
          name: 'window',
          message: 'Use React Native APIs (Dimensions/Platform); no browser globals.',
        },
        { name: 'document', message: 'No DOM access in cross-platform code.' },
        {
          name: 'localStorage',
          message: 'Use AsyncStorage/expo-secure-store; never localStorage.',
        },
      ],
    },
  },
]);
