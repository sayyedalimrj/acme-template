/**
 * Runtime deployment config — loaded from `/config.json` at startup.
 *
 * **Portal isolation:** each static export is built with a fixed `EXPO_PUBLIC_PORTAL`.
 * That build-time portal is the anchor: runtime `config.json` may override `apiBaseUrl` but
 * must not switch this deployment to another portal. A mismatched config.json portal is ignored
 * with a visible warning.
 */
export type RuntimePortal = 'merchant' | 'admin' | 'affiliate';

export interface RuntimeConfig {
  apiBaseUrl: string;
  portal: RuntimePortal;
  /** Set when config.json is missing, invalid, or portal mismatches the build. */
  configWarning?: string;
}

const BUILD_API = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const BUILD_PORTAL_RAW = process.env.EXPO_PUBLIC_PORTAL;
export const BUILD_PORTAL: RuntimePortal =
  BUILD_PORTAL_RAW === 'admin' || BUILD_PORTAL_RAW === 'affiliate' ? BUILD_PORTAL_RAW : 'merchant';

/** Alias for documentation/tests. */
export const getBuildTimePortal = (): RuntimePortal => BUILD_PORTAL;

export function canonicalizePortal(raw: string | undefined | null): RuntimePortal | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'partner') return 'affiliate';
  if (v === 'merchant' || v === 'admin' || v === 'affiliate') return v;
  return null;
}

function normalizeConfig(raw: Partial<RuntimeConfig> | null | undefined): RuntimeConfig {
  const apiBaseUrl = (raw?.apiBaseUrl ?? BUILD_API).replace(/\/$/, '');
  let portal: RuntimePortal = BUILD_PORTAL;
  let configWarning: string | undefined;

  if (raw?.portal !== undefined && raw?.portal !== null && String(raw.portal).trim() !== '') {
    const parsed = canonicalizePortal(String(raw.portal));
    if (!parsed) {
      configWarning = 'فایل config.json نامعتبر است؛ از پورتال این بیلد استفاده می‌شود.';
    } else if (parsed !== BUILD_PORTAL) {
      configWarning = `config.json پورتال «${parsed}» را اعلام کرد اما این بیلد «${BUILD_PORTAL}» است؛ پورتال بیلد اعمال شد.`;
    } else {
      portal = parsed;
    }
  }

  if (!apiBaseUrl && !configWarning) {
    configWarning = 'آدرس API در config.json تنظیم نشده؛ حالت آزمایشی (mock) فعال است.';
  }

  return { apiBaseUrl, portal, configWarning };
}

// Synchronous defaults so first paint uses the correct build portal immediately.
let loaded: RuntimeConfig = normalizeConfig(null);
let loadPromise: Promise<RuntimeConfig> | null = null;

const CONFIG_TIMEOUT_MS = 3000;

function fetchConfigJson(): Promise<Partial<RuntimeConfig> | null> {
  if (typeof fetch === 'undefined') return Promise.resolve(null);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG_TIMEOUT_MS);
  return fetch('/config.json', { cache: 'no-store', signal: controller.signal })
    .then((res) => (res.ok ? (res.json() as Promise<Partial<RuntimeConfig>>) : null))
    .catch(() => null)
    .finally(() => clearTimeout(timer));
}

/** Load `/config.json` (non-blocking for UI — call in background). */
export function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (loadPromise) return loadPromise;

  loadPromise = fetchConfigJson().then((json) => {
    loaded = normalizeConfig(json ?? null);
    return loaded;
  });

  return loadPromise;
}

export function getRuntimeConfig(): RuntimeConfig {
  return loaded;
}

export function getConfigWarning(): string | undefined {
  return loaded.configWarning;
}

export function getApiBaseUrl(): string {
  return loaded.apiBaseUrl;
}

export function isApiConfigured(): boolean {
  return getApiBaseUrl().length > 0;
}

export function getRuntimePortal(): RuntimePortal {
  return loaded.portal;
}

/** Test-only: reset cached config between tests. */
export function resetRuntimeConfigForTests(): void {
  loaded = normalizeConfig(null);
  loadPromise = null;
}

/** Apply config synchronously in tests (may set portal directly). */
export function setRuntimeConfigForTests(cfg: Partial<RuntimeConfig>): void {
  const base = normalizeConfig(null);
  loaded = {
    apiBaseUrl: (cfg.apiBaseUrl ?? base.apiBaseUrl).replace(/\/$/, ''),
    portal: cfg.portal ?? base.portal,
    configWarning: cfg.configWarning ?? base.configWarning,
  };
  loadPromise = Promise.resolve(loaded);
}

/** Simulate `/config.json` payload in tests (runs mismatch rules). */
export function applyRemoteConfigForTests(raw: Partial<RuntimeConfig> | null): RuntimeConfig {
  loaded = normalizeConfig(raw);
  loadPromise = Promise.resolve(loaded);
  return loaded;
}
