// Jest setup (CommonJS; intentionally not type-checked).
// Mock @expo/vector-icons so icon-font async loading does not trigger act(...) warnings.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name }) =>
    React.createElement(Text, { accessibilityElementsHidden: true }, name ?? '');
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});
