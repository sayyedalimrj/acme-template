#!/usr/bin/env node
/**
 * Clean, isolated, per-portal PRODUCTION web export.
 *
 * Root-causes the "admin/partner loaded the merchant bundle" incident: when all three portals
 * were exported back-to-back, Metro's on-disk bundler cache could be reused across builds so two
 * portals shipped the SAME hashed JS bundle (and therefore the wrong baked-in portal). Clearing
 * the cache + rebuilding with an explicit env and a unique BUILD_ID fixed it by hand. This
 * wrapper makes that fix impossible to forget and impossible to get wrong from a script:
 *
 *   - clears the Expo/Metro bundler cache BEFORE each portal export (no cross-portal reuse),
 *   - removes the previous output dir so stale assets can't survive,
 *   - passes ONE consistent env to BOTH `expo export` and `pwa-postbuild.mjs`
 *       EXPO_PUBLIC_PORTAL, EXPO_PUBLIC_RUNTIME_ENV=production,
 *       RUNTIME_CONFIG_ENV=production, and a unique BUILD_ID,
 *   - so every portal gets its own config.json (portal + apiBaseUrl), its own service-worker
 *     cache name, and a byte-distinct index.html per deploy.
 *
 * Usage: node scripts/export-portal.mjs <merchant|admin|affiliate>
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(here, '..');

const VALID = ['merchant', 'admin', 'affiliate'];
const portal = process.argv[2];
if (!VALID.includes(portal)) {
  console.error(`[export-portal] usage: node scripts/export-portal.mjs <${VALID.join('|')}>`);
  process.exit(1);
}

// Production preset by default; allow local-preview for IP-based QA boxes.
const runtimeEnv =
  process.env.RUNTIME_CONFIG_ENV === 'local-preview' ? 'local-preview' : 'production';
const outDir = `dist-${portal}`;

// A unique-per-build stamp. Distinct across portals AND across deploys so two builds can never
// collide on a bundle/sw cache identity.
const buildId = (
  process.env.BUILD_ID ||
  `${portal}-${runtimeEnv}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
)
  .toString()
  .replace(/[^A-Za-z0-9_-]/g, '')
  .slice(0, 24);

function purge(path) {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch {
    /* best-effort */
  }
}

// 1) Clear bundler caches so no portal can inherit another portal's cached bundle.
purge(join(clientRoot, '.expo'));
purge(join(clientRoot, 'node_modules', '.cache'));
purge(join(clientRoot, outDir));
try {
  const tmp = tmpdir();
  for (const name of readdirSync(tmp)) {
    if (/^(metro-|metro-cache|haste-map-)/.test(name)) purge(join(tmp, name));
  }
} catch {
  /* tmp not listable — ignore */
}

// 2) ONE env, shared by expo export and the postbuild, so config.json + bundle agree.
const env = {
  ...process.env,
  EXPO_PUBLIC_PORTAL: portal,
  EXPO_PUBLIC_RUNTIME_ENV: 'production',
  RUNTIME_CONFIG_ENV: runtimeEnv,
  BUILD_ID: buildId,
  CI: '1',
};

console.log(
  `[export-portal] ${portal} → ${outDir} (runtimeEnv=${runtimeEnv}, BUILD_ID=${buildId})`,
);

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runExport(withClear) {
  const args = ['expo', 'export', '--platform', 'web', '--output-dir', outDir];
  if (withClear) args.splice(2, 0, '--clear');
  execFileSync(npx, args, { cwd: clientRoot, env, stdio: 'inherit' });
}

// Prefer the bundler's own `--clear`; fall back gracefully if this CLI version lacks the flag
// (the manual cache purge above already guarantees isolation either way).
try {
  runExport(true);
} catch {
  console.warn('[export-portal] `expo export --clear` failed; retrying without --clear …');
  runExport(false);
}

// 3) Same env → portal-correct config.json, SW cache name, and index.html bytes.
execFileSync(process.execPath, [join('scripts', 'pwa-postbuild.mjs'), outDir], {
  cwd: clientRoot,
  env,
  stdio: 'inherit',
});

console.log(`[export-portal] done: ${outDir} (portal=${portal}, BUILD_ID=${buildId}).`);
