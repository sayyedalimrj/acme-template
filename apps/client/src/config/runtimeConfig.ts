/**
 * Runtime deployment config — loaded from `/config.json` at startup so API URL can change
 * without rebuilding the static export. Build-time `EXPO_PUBLIC_*` values are fallbacks only.
 */
export interface RuntimeConfig {
  apiBaseUrl: string;
  portal: 'merchant' | 'admin' | 'affiliate';
}

const BUILD_API = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const BUILD_PORTAL = process.env.EXPO_PUBLIC_PORTAL;
const BUILD_PORTAL_VALUE: RuntimeConfig['portal'] =
  BUILD_PORTAL === 'admin' || BUILD_PORTAL === 'affiliate' ? BUILD_PORTAL : 'merchant';

let loaded: RuntimeConfig | null = null;
let loadPromise: Promise<RuntimeConfig> | null = null;

function normalizeConfig(raw: Partial<RuntimeConfig> | null | undefined): RuntimeConfig {
  const apiBaseUrl = (raw?.apiBaseUrl ?? BUILD_API).replace(/\/$/, '');
  const portalRaw = raw?.portal ?? BUILD_PORTAL_VALUE;
  const portal: RuntimeConfig['portal'] =
    portalRaw === 'admin' || portalRaw === 'affiliate' ? portalRaw : 'merchant';
  return { apiBaseUrl, portal };
}

/** Load `/config.json` once (web) or use build-time defaults (native/tests). */
export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (loaded) return Promise.resolve(loaded);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (typeof fetch !== 'undefined') {
      try {
        const res = await fetch('/config.json', { cache: 'no-store' });
        if (res.ok) {
          const json = (await res.json()) as Partial<RuntimeConfig>;
          loaded = normalizeConfig(json);
          return loaded;
        }
      } catch {
        /* fall through to build defaults */
      }
    }
    loaded = normalizeConfig(null);
    return loaded;
  })();

  return loadPromise;
}

export function getRuntimeConfig(): RuntimeConfig {
  return loaded ?? normalizeConfig(null);
}

export function getApiBaseUrl(): string {
  return getRuntimeConfig().apiBaseUrl;
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export function getRuntimePortal(): RuntimeConfig['portal'] {
  return getRuntimeConfig().portal;
}

/** Test-only: reset cached config between tests. */
export function resetRuntimeConfigForTests(): void {
  loaded = null;
  loadPromise = null;
}
