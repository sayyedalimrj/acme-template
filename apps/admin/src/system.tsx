/**
 * Admin app "system" — a deliberately small, self-contained foundation for the internal
 * admin app: theme tokens, locale/i18n (en + fa, RTL-aware), locale-bound formatters, and a
 * tiny async hook. Kept minimal on purpose (no react-query/zustand) — the admin app
 * duplicates only what it needs and imports nothing from `apps/client`.
 *
 * Future: extract shared `packages/ui` / `packages/types` / `packages/formatters` so the
 * merchant and admin apps stop duplicating primitives (see README).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { labels, type LabelKey, type Locale } from './labels';

// --- Theme tokens (light, internal-tool palette; mirrors the Ecme-inspired client rhythm) ---
export const tokens = {
  color: {
    background: '#f5f6f8',
    surface: '#ffffff',
    surfaceAlt: '#f6f7f9',
    chrome: '#ffffff',
    border: '#e5e7eb',
    borderStrong: '#d4d4d4',
    text: '#171717',
    textMuted: '#737373',
    textPlaceholder: '#a3a3a3',
    primary: '#2a85ff',
    primarySoft: '#eaf2ff',
    onPrimary: '#ffffff',
    success: '#10b981',
    successSoft: '#e6f7f0',
    warning: '#f59e0b',
    warningSoft: '#fef3df',
    danger: '#ff6a55',
    dangerSoft: '#ffe9e6',
    info: '#2a85ff',
    infoSoft: '#eaf2ff',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  font: { caption: 12, label: 13, body: 15, subheading: 16, title: 22, display: 28 },
  borderWidth: { hairline: 1, thick: 2 },
} as const;

export type Tokens = typeof tokens;
export type RowDirection = 'row' | 'row-reverse';

interface SystemContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  // Default to Persian (matches the merchant app); admins can toggle to English.
  const [locale, setLocale] = useState<Locale>('fa');
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

function useSystem(): SystemContextValue {
  const ctx = useContext(SystemContext);
  if (!ctx) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return ctx;
}

export function useLocale(): { locale: Locale; dir: 'rtl' | 'ltr'; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useSystem();
  return { locale, dir: locale === 'fa' ? 'rtl' : 'ltr', setLocale };
}

/** Translate a label key for the active locale. */
export function useT(): (key: LabelKey) => string {
  const { locale } = useSystem();
  return useCallback((key: LabelKey) => labels[locale][key] ?? labels.en[key] ?? key, [locale]);
}

export function useTheme(): { tokens: Tokens; rowDirection: RowDirection; dir: 'rtl' | 'ltr' } {
  const { dir } = useLocale();
  return { tokens, rowDirection: dir === 'rtl' ? 'row-reverse' : 'row', dir };
}

// --- Locale-bound formatters (mock display only; no FX, no billing) ---
function intlLocale(locale: Locale): string {
  return locale === 'fa' ? 'fa-IR' : 'en-US';
}

export function useFmt(): {
  money: (amount: string, currency: string) => string;
  num: (value: number) => string;
  date: (iso: string) => string;
} {
  const { locale } = useSystem();
  return useMemo(() => {
    const intl = intlLocale(locale);
    return {
      money: (amount: string, currency: string) => {
        const value = Number.parseFloat(amount);
        const safe = Number.isFinite(value) ? value : 0;
        if (locale === 'fa') {
          return `${new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(Math.round(safe))} تومان`;
        }
        try {
          return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(safe);
        } catch {
          return `${currency} ${safe.toFixed(2)}`;
        }
      },
      num: (value: number) => new Intl.NumberFormat(intl).format(value),
      date: (iso: string) => {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return new Intl.DateTimeFormat(intl, { dateStyle: 'medium' }).format(d);
      },
    };
  }, [locale]);
}

// --- Tiny async hook (replaces react-query for this small mock app) ---
export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useAsync<T>(fn: () => Promise<T>, deps: readonly unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    run()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [run, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, reload };
}
