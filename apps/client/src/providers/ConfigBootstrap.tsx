/**
 * Loads `/config.json` before rendering the app tree.
 */
import React, { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { LoadingState, Text } from '@/components/ui';
import { loadRuntimeConfig } from '@/config/runtimeConfig';
import { resetAdaptersForTests } from '@/adapters';

export interface ConfigBootstrapProps {
  children: ReactNode;
}

export function ConfigBootstrap({ children }: ConfigBootstrapProps): React.JSX.Element {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadRuntimeConfig()
      .then(() => {
        if (active) {
          // Adapter cache may have been created before config loaded in dev HMR.
          resetAdaptersForTests();
          setReady(true);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Config load failed');
          setReady(true);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingState label="در حال بارگذاری…" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text variant="body" tone="muted">
          خطا در بارگذاری تنظیمات: {error}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
