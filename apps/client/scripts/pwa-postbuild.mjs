#!/usr/bin/env node
/**
 * PWA post-build patch.
 *
 * With `expo export --platform web` (output: "single"), Expo emits a fixed index.html template
 * and does NOT apply `app/+html.tsx`. This script patches the exported `dist/index.html` to
 * wire the installable PWA: the web manifest, theme color, install icons, an iOS-friendly
 * viewport, a customer-friendly title/lang, and the service-worker registration.
 *
 * It is idempotent (guarded by a marker) and a no-op if dist/index.html is missing.
 */
import { copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
// Output dir can be overridden (per-portal builds use dist-admin / dist-affiliate / …).
const outDir = process.argv[2] || 'dist';
const indexPath = resolve(here, '..', outDir, 'index.html');

// Per-portal branding so each subdomain build gets its own tab title / install name.
const PORTAL = process.env.EXPO_PUBLIC_PORTAL === 'admin'
  ? 'admin'
  : process.env.EXPO_PUBLIC_PORTAL === 'affiliate'
    ? 'affiliate'
    : 'merchant';
const PORTAL_BRANDING = {
  merchant: { title: 'داشبورد فروشگاه', appName: 'فروشگاه' },
  admin: { title: 'پنل مدیریت', appName: 'مدیریت' },
  affiliate: { title: 'پنل بازاریاب', appName: 'بازاریاب' },
};
const branding = PORTAL_BRANDING[PORTAL];

// A unique build stamp so every deploy ships a byte-changed index.html + sw.js. This is what
// lets the browser notice a NEW service worker (a fixed-content sw.js is never re-installed, so
// a stale worker could otherwise keep serving an old app shell whose hashed JS bundle no longer
// exists — a classic blank-screen-after-redeploy bug).
const BUILD_ID = (
  process.env.BUILD_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  String(Date.now())
)
  .toString()
  .slice(0, 12)
  .replace(/[^A-Za-z0-9_-]/g, '');

if (!existsSync(indexPath)) {
  console.warn(`[pwa-postbuild] ${indexPath} not found — skipping.`);
  process.exit(0);
}

let html = readFileSync(indexPath, 'utf8');
const MARKER = 'data-pwa-injected';

if (html.includes(MARKER)) {
  console.log('[pwa-postbuild] already patched — skipping.');
  process.exit(0);
}

const HEAD = `
    <!-- ${MARKER} -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#456EFE" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="application-name" content="${branding.appName}" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${branding.appName}" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <style>
      /* Fill the viewport and paint the safe-area regions (notch / home indicator) with the
         app backdrop so 'viewport-fit=cover' never leaves a bare white strip.

         Single source of truth for viewport HEIGHT: 100dvh tracks the *visible* (dynamic)
         viewport as mobile Safari / PWA toolbars show & hide, so the fixed bottom tab bar sits
         exactly at the visible bottom and never leaves a large blank/gray gap below it. The
         100% line is the fallback for engines without dvh. The bottom safe-area inset (home
         indicator) is applied ONCE — inside the tab bar component — never here as well. */
      html, body, #root { height: 100%; height: 100dvh; }
      html { background-color: #EEF1F6; }
      body { margin: 0; background-color: #EEF1F6; overflow: hidden; }
      @media (prefers-color-scheme: dark) { html, body { background-color: #08090B; } }
    </style>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          // updateViaCache:'none' ensures the browser re-fetches sw.js on every load so a new
          // deploy's worker (its bytes change via BUILD_ID) is picked up immediately; update()
          // nudges it, and skipWaiting()/clients.claim() in sw.js make it take over at once.
          navigator.serviceWorker
            .register('/sw.js', { updateViaCache: 'none' })
            .then(function (reg) {
              try { reg.update(); } catch (e) {}
            })
            .catch(function () {});
        });
      }
    </script>
  `;

// 1) Persian-first document shell + customer-friendly tab title.
//
// IMPORTANT: the document direction is intentionally kept LTR even though the UI is Persian.
// The app implements RTL *itself* (in JS) via direction-aware flex rows (`row-reverse`) and
// explicit `textAlign`, with a deterministic LTR ambient on every platform (web + native).
// If we also set `dir="rtl"` here, the browser flips the inline axis a SECOND time, so every
// `row-reverse` becomes visually LTR again (a double-flip) — that is what made the deployed
// build look mirrored/broken (header, bottom nav, filter chips, product rows, and the hero
// carousel/swipe). Keeping the document LTR makes prod match dev (`expo start --web`) and the
// native apps, where the ambient direction is already LTR. `lang="fa"` stays for correct
// language semantics, fonts, and number/date shaping.
html = html.replace('<html lang="en">', '<html lang="fa" dir="ltr">');
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${branding.title}</title>`);

// 2) iOS-friendly viewport (cover the notch/safe-area; lock zoom for app-like feel).
html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

// 3) Inject the PWA head tags just before </head>.
html = html.replace('</head>', `${HEAD}</head>`);

// 3b) No-blank-screen safety net.
//
// The exported SPA renders into <div id="root">. If the JS bundle never mounts — a hashed
// bundle 404 after a redeploy, a poisoned service-worker cache, a parse/eval error, or a stale
// deploy — the user is left staring at a pure-white empty page with no message and no way out
// (the in-app ErrorBoundary/ConfigBootstrap can't help because React never started). This
// converts that failure into something visible and recoverable:
//   • an instant Persian "loading" splash painted inside #root (no white flash on first paint),
//   • a watchdog that, if the app has NOT mounted after a grace period, replaces the splash with
//     a Persian recovery screen whose button clears caches + unregisters service workers and
//     reloads — which heals exactly the stale-cache / dead-bundle case.
// React's createRoot replaces #root's children on its first render, so the splash disappears the
// instant the real app mounts and the watchdog then becomes a no-op.
const BOOT_MARKER = '__boot_fallback';
const BOOT_SPLASH = `<div id="${BOOT_MARKER}" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background-color:#EEF1F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"><div style="color:#5B6577;font-size:15px;text-align:center">در حال بارگذاری…</div></div>`;
html = html.replace('<div id="root"></div>', `<div id="root">${BOOT_SPLASH}</div>`);

const BOOT_WATCHDOG = `
    <script>
      (function () {
        var TIMEOUT_MS = 12000;
        function appMounted() {
          // createRoot() removes our splash node on first render; its absence == app booted.
          return !document.getElementById('${BOOT_MARKER}');
        }
        function recover() {
          try {
            if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
              navigator.serviceWorker.getRegistrations().then(function (rs) {
                rs.forEach(function (r) { r.unregister(); });
              });
            }
            if (window.caches && caches.keys) {
              caches.keys().then(function (ks) {
                return Promise.all(ks.map(function (k) { return caches.delete(k); }));
              }).finally(function () { location.reload(); });
              return;
            }
          } catch (e) {}
          location.reload();
        }
        function showRecovery() {
          if (appMounted()) return;
          var root = document.getElementById('root');
          if (!root) return;
          root.innerHTML =
            '<div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;background-color:#EEF1F6;font-family:-apple-system,BlinkMacSystemFont,\\'Segoe UI\\',Roboto,sans-serif">' +
              '<div style="font-size:20px;font-weight:700;color:#1F2A44;text-align:center">بارگذاری برنامه ناموفق بود</div>' +
              '<div style="font-size:15px;color:#5B6577;text-align:center;line-height:22px;max-width:340px">نسخه‌ی ذخیره‌شده‌ی برنامه قدیمی است یا ارتباط برقرار نشد. لطفاً دوباره بارگذاری کنید.</div>' +
              '<button id="${BOOT_MARKER}_reload" style="background-color:#456EFE;color:#fff;font-size:15px;font-weight:700;border:none;border-radius:12px;padding:12px 24px;cursor:pointer">بارگذاری مجدد</button>' +
            '</div>';
          var btn = document.getElementById('${BOOT_MARKER}_reload');
          if (btn) btn.addEventListener('click', recover);
        }
        setTimeout(showRecovery, TIMEOUT_MS);
      })();
    </script>
  `;
html = html.replace('</body>', `${BOOT_WATCHDOG}</body>`);

writeFileSync(indexPath, html, 'utf8');
console.log(`[pwa-postbuild] patched ${outDir}/index.html for PWA install (portal: ${PORTAL}).`);

// 3c) Stamp the service worker with this deploy's BUILD_ID.
//
// `expo export` copies public/sw.js verbatim into the output. Its cache name carries a
// `__BUILD_ID__` placeholder; substituting a per-deploy value (a) changes sw.js's bytes so the
// browser installs the new worker instead of clinging to an old one, and (b) bumps the cache
// name so the worker's `activate` step deletes the previous deploy's cache — preventing a stale
// app shell that points at hashed bundles which no longer exist.
const swPath = resolve(here, '..', outDir, 'sw.js');
if (existsSync(swPath)) {
  const swSrc = readFileSync(swPath, 'utf8');
  if (swSrc.includes('__BUILD_ID__')) {
    writeFileSync(
      swPath,
      `// build:${BUILD_ID}\n${swSrc.replace(/__BUILD_ID__/g, BUILD_ID)}`,
      'utf8',
    );
    console.log(`[pwa-postbuild] stamped ${outDir}/sw.js cache version (build: ${BUILD_ID}).`);
  }
} else {
  console.warn(`[pwa-postbuild] ${outDir}/sw.js not found — skipping SW version stamp.`);
}

// 4) Emit the portal-specific runtime config (`/config.json`).
//
// IMPORTANT: a preset template (e.g. config/<portal>.production.json) is used ONLY when the
// deployer OPTS IN via `RUNTIME_CONFIG_ENV=local-preview|production` — those templates point at
// a self-hosted backend (api.jet-web.ir / an internal IP) that is unreachable from a public
// cloud host like Vercel. The default build (no RUNTIME_CONFIG_ENV) instead derives the API URL
// from `EXPO_PUBLIC_API_BASE_URL`. When that is also empty the app stays on self-contained mock
// data, so the public Vercel demo (login + dashboard) works without any backend.
const configDest = resolve(here, '..', outDir, 'config.json');
const presetEnv =
  process.env.RUNTIME_CONFIG_ENV === 'local-preview' ||
  process.env.RUNTIME_CONFIG_ENV === 'production'
    ? process.env.RUNTIME_CONFIG_ENV
    : null;

let wrotePreset = false;
if (presetEnv) {
  const configSrc = resolve(here, '..', 'config', `${PORTAL}.${presetEnv}.json`);
  if (existsSync(configSrc)) {
    copyFileSync(configSrc, configDest);
    wrotePreset = true;
    console.log(`[pwa-postbuild] copied config/${PORTAL}.${presetEnv}.json → ${outDir}/config.json`);
  } else {
    console.warn(`[pwa-postbuild] RUNTIME_CONFIG_ENV=${presetEnv} but config/${PORTAL}.${presetEnv}.json is missing.`);
  }
}

if (!wrotePreset) {
  const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
  writeFileSync(
    configDest,
    `${JSON.stringify({ portal: PORTAL, apiBaseUrl: apiBase }, null, 2)}\n`,
    'utf8',
  );
  console.log(
    `[pwa-postbuild] wrote ${outDir}/config.json (portal: ${PORTAL}, apiBaseUrl: ${apiBase || '(empty → mock data)'}).`,
  );
}
