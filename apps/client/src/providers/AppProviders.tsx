/**
 * AppProviders: the root provider tree.
 *
 * Composition order (outer → inner):
 *  SafeAreaProvider → QueryClientProvider → I18nProvider → ThemeProvider → SessionProvider.
 *
 * I18n sits ABOVE Theme so the layout direction can follow the active language automatically
 * (Persian → RTL, English → LTR) via `DirectionSync`, with no manual direction toggle.
 *
 * This is mounted once by the root route layout. Each provider is cross-platform and free
 * of browser globals.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { directionForLocale } from '@/i18n/direction';
import { I18nProvider, useLocale } from '@/i18n/I18nProvider';
import { SessionProvider } from '@/session/SessionProvider';
import { ThemeProvider, useTheme } from '@/theme';

export interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Keeps layout direction in lock-step with the active locale: Persian is RTL, English is LTR.
 * Rendered as a child of both I18nProvider and ThemeProvider so it can read the locale and set
 * the direction. Renders nothing.
 */
function DirectionSync(): null {
  const { locale } = useLocale();
  const { direction, setDirection } = useTheme();
  const target = directionForLocale(locale);

  useEffect(() => {
    if (direction !== target) {
      setDirection(target);
    }
  }, [target, direction, setDirection]);

  return null;
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
        <I18nProvider>
          <ThemeProvider>
            <DirectionSync />
            <SessionProvider>{children}</SessionProvider>
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
