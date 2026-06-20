/**
 * Regression guard for the export post-processor's no-blank-screen safety net.
 *
 * The deployed SPA renders into <div id="root">. If the JS bundle never mounts (a hashed bundle
 * 404 after a redeploy, a poisoned service-worker cache, a parse error, or a stale deploy) the
 * user is left on a pure-white empty page. `scripts/pwa-postbuild.mjs` injects an instant splash
 * + a watchdog recovery screen and stamps the service worker with a per-deploy cache version so
 * a stale worker can never keep serving a dead app shell. These tests run the real script against
 * a fixture and assert those guarantees survive future edits.
 */
import { describe, expect, it } from '@jest/globals';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const SCRIPT = resolve(__dirname, '..', '..', 'scripts', 'pwa-postbuild.mjs');

// Minimal stand-in for the index.html that `expo export -p web` emits.
const FIXTURE_INDEX = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Expo App</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="/_expo/static/js/web/entry-abc123.js" defer></script>
  </body>
</html>
`;

const FIXTURE_SW = `const CACHE = 'acme-client-__BUILD_ID__';\nself.addEventListener('install', () => self.skipWaiting());\n`;

function runPostbuild(buildId: string): { html: string; sw: string } {
  const dir = mkdtempSync(join(tmpdir(), 'pwa-postbuild-'));
  try {
    writeFileSync(join(dir, 'index.html'), FIXTURE_INDEX, 'utf8');
    writeFileSync(join(dir, 'sw.js'), FIXTURE_SW, 'utf8');
    execFileSync('node', [SCRIPT, dir], {
      env: { ...process.env, BUILD_ID: buildId, EXPO_PUBLIC_PORTAL: 'merchant' },
      stdio: 'ignore',
    });
    return {
      html: readFileSync(join(dir, 'index.html'), 'utf8'),
      sw: readFileSync(join(dir, 'sw.js'), 'utf8'),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('pwa-postbuild no-blank-screen safety net', () => {
  it('paints an instant boot splash inside #root', () => {
    const { html } = runPostbuild('testbuild1');
    expect(html).toContain('id="__boot_fallback"');
    expect(html).toContain('در حال بارگذاری…');
    // The splash lives inside the root container, not appended elsewhere.
    expect(html).toMatch(/<div id="root"><div id="__boot_fallback"/);
  });

  it('injects a watchdog recovery screen with a reload action', () => {
    const { html } = runPostbuild('testbuild2');
    expect(html).toContain('بارگذاری مجدد');
    expect(html).toContain('__boot_fallback_reload');
    // Recovery must clear caches and unregister workers (heals the stale-cache case).
    expect(html).toContain('caches.delete');
    expect(html).toContain('unregister');
    expect(html).toContain('setTimeout(showRecovery');
  });

  it('registers the service worker with cache bypass + update nudge', () => {
    const { html } = runPostbuild('testbuild3');
    expect(html).toContain("updateViaCache: 'none'");
    expect(html).toContain('reg.update()');
  });

  it('stamps the service worker with a per-deploy cache name', () => {
    const { sw } = runPostbuild('deploy42');
    expect(sw).toContain("const CACHE = 'acme-client-deploy42'");
    expect(sw).toContain('// build:deploy42');
    expect(sw).not.toContain('__BUILD_ID__');
  });

  it('produces a different service worker per deploy (so the browser updates it)', () => {
    const a = runPostbuild('buildAAA').sw;
    const b = runPostbuild('buildBBB').sw;
    expect(a).not.toEqual(b);
  });
});


// Per-portal production config.json generation: each portal build must emit a config.json whose
// `portal` matches the build and whose `apiBaseUrl` points at the production API. This guards the
// own-server multi-portal deployment (app/admin/partner -> distinct builds).
function runPostbuildConfig(portal: string): { portal: string; apiBaseUrl: string } {
  const dir = mkdtempSync(join(tmpdir(), 'pwa-postbuild-cfg-'));
  try {
    writeFileSync(join(dir, 'index.html'), FIXTURE_INDEX, 'utf8');
    writeFileSync(join(dir, 'sw.js'), FIXTURE_SW, 'utf8');
    execFileSync('node', [SCRIPT, dir], {
      env: {
        ...process.env,
        BUILD_ID: `cfg-${portal}`,
        EXPO_PUBLIC_PORTAL: portal,
        RUNTIME_CONFIG_ENV: 'production',
      },
      stdio: 'ignore',
    });
    return JSON.parse(readFileSync(join(dir, 'config.json'), 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('per-portal production config.json generation', () => {
  it.each(['merchant', 'admin', 'affiliate'])(
    'emits config.json with portal=%s and a production apiBaseUrl',
    (portal) => {
      const cfg = runPostbuildConfig(portal);
      expect(cfg.portal).toBe(portal);
      expect(typeof cfg.apiBaseUrl).toBe('string');
      expect(cfg.apiBaseUrl).toMatch(/^https:\/\//);
      expect(cfg.apiBaseUrl).not.toContain('localhost');
    },
  );
});
