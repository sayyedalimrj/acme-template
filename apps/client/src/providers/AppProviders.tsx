/**
 * AppProviders: the root provider tree.
 *
 * Composition order (outer → inner):
 *  SafeAreaProvider → QueryClientProvider → ThemeProvider → I18nProvider → SessionProvider.
 *
 * This is mounted once by the root route layout. Each provider is cross-platform and free
 * of browser globals.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '@/i18n/I18nProvider';
import { SessionProvider } from '@/session/SessionProvider';
import { ThemeProvider } from '@/theme';

export interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  // One QueryClient per app instance (stable across re-renders).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <I18nProvider>
            <SessionProvider>{children}</SessionProvider>
          </I18nProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
