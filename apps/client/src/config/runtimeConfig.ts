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
  /** Non-blocking notice (non-production): config.json missing/invalid/portal-mismatch. */
  configWarning?: string;
  /** Blocking error (production): missing/invalid API URL or wrong-portal config.json. */
  configError?: string;
}

const BUILD_API = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
const BUILD_PORTAL_RAW = process.env.EXPO_PUBLIC_PORTAL;
export const BUILD_PORTAL: RuntimePortal =
  BUILD_PORTAL_RAW === 'admin' || BUILD_PORTAL_RAW === 'affiliate' ? BUILD_PORTAL_RAW : 'merchant';

/**
 * Whether this is a PRODUCTION runtime build (own-server / production deploy). Set at build time
 * via `EXPO_PUBLIC_RUNTIME_ENV=production`. In production the app must NEVER silently fall back to
 * mock data and must NEVER show the wrong portal: a missing/invalid API URL or a portal-mismatched
 * config.json becomes a blocking, visible Persian error instead. Non-production (Vercel preview /
 * local) keeps the self-contained mock behavior.
 */
let productionRuntime =
  (process.env.EXPO_PUBLIC_RUNTIME_ENV ?? '').trim().toLowerCase() === 'production';

export function isProductionRuntime(): boolean {
  return productionRuntime;
}

/** Test-only: toggle production-runtime gating. */
export function setProductionRuntimeForTests(value: boolean): void {
  productionRuntime = value;
}

/** A non-empty http(s) URL with a host. Dependency-free (no URL polyfill needed on native). */
function isValidHttpUrl(value: string): boolean {
  return /^https?:\/\/[^\s/]+/i.test(value);
}

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
  let configError: string | undefined;

  // Classify any config.json portal problem (without ever applying a wrong portal).
  let portalProblem: 'invalid' | 'mismatch' | null = null;
  let declaredPortal: RuntimePortal | null = null;
  if (raw?.portal !== undefined && raw?.portal !== null && String(raw.portal).trim() !== '') {
    const parsed = canonicalizePortal(String(raw.portal));
    if (!parsed) {
      portalProblem = 'invalid';
    } else if (parsed !== BUILD_PORTAL) {
      portalProblem = 'mismatch';
      declaredPortal = parsed;
    } else {
      portal = parsed;
    }
  }

  if (productionRuntime) {
    // Production: fail visibly. Never mock, never wrong portal, never blank.
    if (!apiBaseUrl || !isValidHttpUrl(apiBaseUrl)) {
      configError =
        'پیکربندی سرور (config.json) یافت نشد یا نامعتبر است. لطفاً با پشتیبانی تماس بگیرید.';
    } else if (portalProblem === 'invalid') {
      configError = 'فایل config.json نامعتبر است؛ پیکربندی سرور را بررسی کنید.';
    } else if (portalProblem === 'mismatch') {
      configError = `این میزبان پیکربندی پورتال نادرستی دارد (انتظار «${BUILD_PORTAL}»). پیکربندی سرور را بررسی کنید.`;
    }
  } else {
    // Non-production: mock is a supported mode; portal problems are non-blocking warnings.
    // An empty apiBaseUrl is intentional (self-contained mock demo) — no warning for it.
    if (portalProblem === 'invalid') {
      configWarning = 'فایل config.json نامعتبر است؛ از پورتال این بیلد استفاده می‌شود.';
    } else if (portalProblem === 'mismatch') {
      configWarning = `config.json پورتال «${declaredPortal}» را اعلام کرد اما این بیلد «${BUILD_PORTAL}» است؛ پورتال بیلد اعمال شد.`;
    }
  }

  return { apiBaseUrl, portal, configWarning, configError };
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

/** Reload `/config.json` from scratch (used by the production error screen's retry). */
export function reloadRuntimeConfig(): Promise<RuntimeConfig> {
  loadPromise = null;
  return loadRuntimeConfig();
}

export function getRuntimeConfig(): RuntimeConfig {
  return loaded;
}

export function getConfigWarning(): string | undefined {
  return loaded.configWarning;
}

export function getConfigError(): string | undefined {
  return loaded.configError;
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
    configError: cfg.configError ?? base.configError,
  };
  loadPromise = Promise.resolve(loaded);
}

/** Simulate `/config.json` payload in tests (runs mismatch rules). */
export function applyRemoteConfigForTests(raw: Partial<RuntimeConfig> | null): RuntimeConfig {
  loaded = normalizeConfig(raw);
  loadPromise = Promise.resolve(loaded);
  return loaded;
}
