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
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(here, '..', 'dist', 'index.html');

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
    <meta name="application-name" content="فروشگاه" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="فروشگاه" />
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

// 1) Persian-first, RTL document shell + customer-friendly tab title.
html = html.replace('<html lang="en">', '<html lang="fa" dir="rtl">');
html = html.replace(
  /<title>[\s\S]*?<\/title>/,
  '<title>داشبورد فروشگاه</title>',
);

// 2) iOS-friendly viewport (cover the notch/safe-area; lock zoom for app-like feel).
html = html.replace(
  /<meta name="viewport"[^>]*\/>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover" />',
);

// 3) Inject the PWA head tags just before </head>.
html = html.replace('</head>', `${HEAD}</head>`);

writeFileSync(indexPath, html, 'utf8');
console.log('[pwa-postbuild] patched dist/index.html for PWA install.');
