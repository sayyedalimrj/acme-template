// Jest setup (CommonJS; intentionally not type-checked).
//
// Mock @expo/vector-icons so icon-font async loading does not trigger `act(...)` warnings
// and tests stay deterministic. Icons render as inert text stand-ins. This keeps the design
// system's state components (EmptyState/ErrorState) testable without pulling in font assets.
jest.mock('expo-font', () => ({
  useFonts: () => [true],
  isLoaded: () => true,
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// Force "reduced motion" in tests so RN Animated never starts a native-driver animation (the
// test renderer has no native view, which otherwise throws "Unable to locate attached view in
// the native tree"). Components then render in their final state instantly — deterministic.
jest.mock('@/features/mobile/motion', () => {
  const actual = jest.requireActual('@/features/mobile/motion');
  return { ...actual, useReducedMotion: () => true };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }) =>
    React.createElement(Text, { accessibilityElementsHidden: true }, name ?? '');
  // Any icon set imported from the package resolves to the same stand-in component.
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});
