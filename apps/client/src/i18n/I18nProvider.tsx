/**
 * Minimal i18n provider with an in-memory, switchable locale.
 *
 * Exposes a `t(key)` translator backed by an in-memory catalog plus `setLocale` so the UI can
 * switch between Persian and English at runtime. This is intentionally tiny; it will be
 * replaced by i18next + react-i18next (with real locale loading and RTL validation) in the
 * i18n hardening task. It uses no browser globals and is safe on all platforms.
 *
 * Persistence note: the chosen locale is kept in memory only. Persisting the user's language
 * requires a cross-platform secure/async storage layer (AsyncStorage / expo-secure-store) and
 * is intentionally left as a TODO. We do NOT use `localStorage` (web-only) here.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { appConfig } from '@/config/app.config';

import { catalog, en, type Locale, type StringKey } from './strings';

export interface I18nContextValue {
  locale: Locale;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveLocale(input: string): Locale {
  return input in catalog ? (input as Locale) : 'en';
}

export interface I18nProviderProps {
  children: ReactNode;
  /** Initial locale (defaults to app config). Switchable at runtime via setLocale. */
  locale?: string;
}

function formatTemplate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

export { formatTemplate };

export function I18nProvider({
  children,
  locale = appConfig.defaultLocale,
}: I18nProviderProps): React.JSX.Element {
  const [activeLocale, setActiveLocale] = useState<Locale>(() => resolveLocale(locale));

  const setLocale = useCallback((next: Locale) => {
    setActiveLocale(resolveLocale(next));
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dictionary = catalog[activeLocale] ?? en;
    return {
      locale: activeLocale,
      t: (key: StringKey, vars?: Record<string, string | number>) =>
        formatTemplate(dictionary[key] ?? en[key] ?? key, vars),
      setLocale,
    };
  }, [activeLocale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useT must be used within an I18nProvider');
  }
  return ctx;
}

export function useT(): I18nContextValue['t'] {
  return useI18n().t;
}

/** Access the active locale and a setter for runtime language switching. */
export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
