/**
 * Minimal i18n placeholder provider.
 *
 * Exposes a `t(key)` translator backed by an in-memory catalog so the UI avoids hard-coded
 * strings from day one. This is intentionally tiny; it will be replaced by i18next +
 * react-i18next (with real locale loading and RTL validation) in the i18n hardening task.
 * It uses no browser globals and is safe on all platforms.
 */
import React, { createContext, useContext, useMemo, type ReactNode } from 'react';

import { appConfig } from '@/config/app.config';

import { catalog, en, type Locale, type StringKey } from './strings';

export interface I18nContextValue {
  locale: Locale;
  t: (key: StringKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveLocale(input: string): Locale {
  return input in catalog ? (input as Locale) : 'en';
}

export interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
}

export function I18nProvider({
  children,
  locale = appConfig.defaultLocale,
}: I18nProviderProps): React.JSX.Element {
  const value = useMemo<I18nContextValue>(() => {
    const resolved = resolveLocale(locale);
    const dictionary = catalog[resolved] ?? en;
    return {
      locale: resolved,
      t: (key: StringKey) => dictionary[key] ?? en[key] ?? key,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue['t'] {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useT must be used within an I18nProvider');
  }
  return ctx.t;
}
