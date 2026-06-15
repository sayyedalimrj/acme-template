// Flat ESLint config for the Expo app package.
// Uses the official Expo config and disables rules that conflict with Prettier.
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
    rules: {
      // Enforce our cross-platform rules at lint time: no browser globals or
      // DOM-only access in shared app code (see .kiro/steering/tech.md).
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
