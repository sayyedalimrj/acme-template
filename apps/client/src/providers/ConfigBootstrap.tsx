/**
 * Loads runtime config in the background; never blocks the login UI.
 */
import React, { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { resetAdaptersForTests } from '@/adapters';
import { Text } from '@/components/ui';
import { getConfigWarning, loadRuntimeConfig } from '@/config/runtimeConfig';

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
      <Text variant="caption" style={{ textAlign: 'center', color: '#8A5A00' }}>
        {message}
      </Text>
    </View>
  );
}

export function ConfigBootstrap({ children }: ConfigBootstrapProps): React.JSX.Element {
  const [warning, setWarning] = useState<string | undefined>(() => getConfigWarning());

  useEffect(() => {
    let active = true;
    void loadRuntimeConfig().then(() => {
      if (!active) return;
      resetAdaptersForTests();
      setWarning(getConfigWarning());
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      {warning ? <ConfigWarningBar message={warning} /> : null}
      {children}
    </>
  );
}
