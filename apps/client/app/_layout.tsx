/**
 * Root route layout.
 *
 * Mounts the global provider tree and the Expo Router navigator. Headers are hidden because
 * the app provides its own chrome via the AppShell. This file is the single composition
 * root for the whole app.
 */
import { Stack } from 'expo-router';
import React from 'react';

import { AppProviders } from '@/providers/AppProviders';
import { ThemedStatusBar } from '@/theme';

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
