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

jest.mock('@expo-google-fonts/vazirmatn', () => ({
  Vazirmatn_400Regular: 'Vazirmatn_400Regular',
  Vazirmatn_500Medium: 'Vazirmatn_500Medium',
  Vazirmatn_600SemiBold: 'Vazirmatn_600SemiBold',
  Vazirmatn_700Bold: 'Vazirmatn_700Bold',
}));

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
