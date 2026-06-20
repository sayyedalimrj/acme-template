/**
 * ConfigBootstrap gating (PR #57 Task 4).
 *
 * Production: waits for /config.json, then shows a blocking Persian error screen on
 * missing/invalid config (never a blank screen, never a silent mock fallback).
 * Non-production: renders children immediately (mock-friendly demo).
 */
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  BUILD_PORTAL,
  applyRemoteConfigForTests,
  resetRuntimeConfigForTests,
  setProductionRuntimeForTests,
} from '@/config/runtimeConfig';

import { ConfigBootstrap } from '../ConfigBootstrap';

jest.mock('@/adapters', () => ({ resetAdaptersForTests: jest.fn() }));

afterEach(() => {
  setProductionRuntimeForTests(false);
  resetRuntimeConfigForTests();
});

const child = (
  <Text testID="app-child">app</Text>
);

describe('ConfigBootstrap', () => {
  it('production: blocks with a visible error when API config is missing', async () => {
    setProductionRuntimeForTests(true);
    applyRemoteConfigForTests({ apiBaseUrl: '', portal: BUILD_PORTAL });

    const { queryByTestId, getByTestId } = render(<ConfigBootstrap>{child}</ConfigBootstrap>);

    await waitFor(() => expect(getByTestId('config-error-retry')).toBeTruthy());
    expect(queryByTestId('app-child')).toBeNull(); // children are NOT rendered behind the error
  });

  it('production: renders the app when config is valid', async () => {
    setProductionRuntimeForTests(true);
    applyRemoteConfigForTests({ apiBaseUrl: 'https://api.jet-web.ir', portal: BUILD_PORTAL });

    const { getByTestId } = render(<ConfigBootstrap>{child}</ConfigBootstrap>);

    await waitFor(() => expect(getByTestId('app-child')).toBeTruthy());
  });

  it('non-production: renders the app immediately even with no API (mock demo)', () => {
    setProductionRuntimeForTests(false);
    applyRemoteConfigForTests({ apiBaseUrl: '', portal: BUILD_PORTAL });

    const { getByTestId } = render(<ConfigBootstrap>{child}</ConfigBootstrap>);
    expect(getByTestId('app-child')).toBeTruthy();
  });
});
