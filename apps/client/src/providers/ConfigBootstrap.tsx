/**
 * Loads runtime `/config.json` at startup.
 *
 * Non-production (Vercel preview / local): never blocks the UI — children render immediately and
 * an optional warning bar appears for a mismatched/invalid config.json.
 *
 * Production (`EXPO_PUBLIC_RUNTIME_ENV=production`): the app MUST NOT silently fall back to mock
 * data, show the wrong portal, or blank-screen. It waits for `/config.json`, then renders a
 * blocking, visible Persian error if the API base URL is missing/invalid or the config.json
 * portal mismatches this build.
 *
 * This component is mounted ABOVE the theme/i18n providers, so its UI uses only primitive
 * `react-native` elements (no themed `@/components/ui`, no `useT`/`useTheme`).
 */
import React, { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { resetAdaptersForTests } from '@/adapters';
import {
  getConfigError,
  getConfigWarning,
  isProductionRuntime,
  loadRuntimeConfig,
  reloadRuntimeConfig,
} from '@/config/runtimeConfig';

export interface ConfigBootstrapProps {
  children: ReactNode;
}

function ConfigWarningBar({ message }: { message: string }): React.JSX.Element {
  return (
    <View
      style={{
        backgroundColor: '#FFF4E5',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5D090',
      }}
    >
      <Text style={{ fontSize: 12, textAlign: 'center', color: '#8A5A00' }}>{message}</Text>
    </View>
  );
}

/** Neutral, provider-independent splash shown only while a production build loads config.json. */
function ConfigSplash(): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEF1F6',
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 15, color: '#5B6577', textAlign: 'center' }}>
        در حال بارگذاری…
      </Text>
    </View>
  );
}

/** Blocking, provider-independent error screen (production misconfiguration). */
function ConfigErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): React.JSX.Element {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#EEF1F6',
        gap: 16,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2A44', textAlign: 'center' }}>
        پیکربندی نامعتبر
      </Text>
      <Text style={{ fontSize: 15, color: '#5B6577', textAlign: 'center', lineHeight: 22 }}>
        {message}
      </Text>
      <Pressable
        accessibilityRole="button"
        testID="config-error-retry"
        onPress={onRetry}
        style={{
          backgroundColor: '#456EFE',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>تلاش مجدد</Text>
      </Pressable>
    </View>
  );
}

export function ConfigBootstrap({ children }: ConfigBootstrapProps): React.JSX.Element {
  const production = isProductionRuntime();
  // Non-production renders immediately (mock-friendly demo); production waits for config.json.
  const [ready, setReady] = useState<boolean>(() => !production);
  const [warning, setWarning] = useState<string | undefined>(() => getConfigWarning());
  const [error, setError] = useState<string | undefined>(() => undefined);

  useEffect(() => {
    let active = true;
    const apply = (): void => {
      if (!active) return;
      resetAdaptersForTests();
      setWarning(getConfigWarning());
      setError(getConfigError());
      setReady(true);
    };
    void loadRuntimeConfig().then(apply);
    return () => {
      active = false;
    };
  }, []);

  const retry = (): void => {
    setReady(!production);
    setError(undefined);
    void reloadRuntimeConfig().then(() => {
      resetAdaptersForTests();
      setWarning(getConfigWarning());
      setError(getConfigError());
      setReady(true);
    });
  };

  if (production && !ready) {
    return <ConfigSplash />;
  }

  if (error) {
    return <ConfigErrorScreen message={error} onRetry={retry} />;
  }

  return (
    <>
      {warning ? <ConfigWarningBar message={warning} /> : null}
      {children}
    </>
  );
}
