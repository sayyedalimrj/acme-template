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
         app backdrop so 'viewport-fit=cover' never leaves a bare white strip. */
      html, body, #root { height: 100%; }
      body { margin: 0; background-color: #EEF1F6; overflow: hidden; }
      @media (prefers-color-scheme: dark) { body { background-color: #08090B; } }
    </style>
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
          navigator.serviceWorker.register('/sw.js').catch(function () {});
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

writeFileSync(indexPath, html, 'utf8');
console.log(`[pwa-postbuild] patched ${outDir}/index.html for PWA install (portal: ${PORTAL}).`);

// 4) Copy portal-specific runtime config (never a shared merchant config for all builds).
const configEnv = process.env.RUNTIME_CONFIG_ENV === 'local-preview' ? 'local-preview' : 'production';
const configSrc = resolve(here, '..', 'config', `${PORTAL}.${configEnv}.json`);
const configDest = resolve(here, '..', outDir, 'config.json');
if (existsSync(configSrc)) {
  copyFileSync(configSrc, configDest);
  console.log(`[pwa-postbuild] copied config/${PORTAL}.${configEnv}.json → ${outDir}/config.json`);
} else {
  const apiBase = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');
  writeFileSync(
    configDest,
    `${JSON.stringify({ portal: PORTAL, apiBaseUrl: apiBase }, null, 2)}\n`,
    'utf8',
  );
  console.warn(`[pwa-postbuild] config template missing — wrote build-time fallback for ${PORTAL}.`);
}
