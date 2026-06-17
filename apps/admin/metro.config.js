// Metro configuration for the Expo admin app (web bundler is Metro; Vite is intentionally not used).
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
