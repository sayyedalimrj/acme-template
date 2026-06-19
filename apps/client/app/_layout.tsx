/**
 * Root route layout.
 *
 * Mounts the global provider tree and the Expo Router navigator. Headers are hidden because
 * the app provides its own chrome via the AppShell. This file is the single composition
 * root for the whole app.
 */
import { Stack } from 'expo-router';
import React from 'react';
import { I18nManager } from 'react-native';

import { AppProviders } from '@/providers/AppProviders';
import { ThemedStatusBar } from '@/theme';

// Keep the ambient platform direction deterministically LTR on every platform.
//
// The app renders Persian RTL *itself* via direction-aware flex rows (`row-reverse`) and
// explicit `textAlign` driven by the in-app theme direction. For that manual system to be the
// single source of truth, the underlying platform must NOT also flip the layout: on a device
// whose locale is RTL, `I18nManager.isRTL` would be true and every `row-reverse` would be
// double-flipped back to LTR (the same class of bug the web `dir` attribute caused). Forcing
// LTR here makes native match the web build and `expo start --web`. This runs once at module
// load, before the first render. It is a no-op on the web (RNW's I18nManager is already LTR).
if (I18nManager.isRTL || I18nManager.doLeftAndRightSwapInRTL) {
  try {
    I18nManager.allowRTL(false);
    I18nManager.forceRTL(false);
    I18nManager.swapLeftAndRightInRTL(false);
  } catch {
    // Some platforms (and the web stub) may not implement every setter; safe to ignore.
  }
}

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <ThemedStatusBar />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
