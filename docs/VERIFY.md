# Production verification log

Reproducible clean-machine gates for customer deployment. Re-run with:

```bash
./scripts/verify-production.sh 2>&1 | tee docs/VERIFY.log
```

CI equivalent: `.github/workflows/ci.yml` (runs the same commands on GitHub Actions with Postgres 16).

**Environment:** Node `v22.14.0`, npm `10.9.7`.  
**Verified:** 2026-06-19T14:54:01Z (UTC).

---

## Backend (`services/api`)

```bash
cd services/api && npm ci && npm run typecheck && npm test && npm run build
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run migrate
```

### `npm run typecheck`

```
> @acme/api@0.1.0 typecheck
> tsc --noEmit

(exit 0)
```

### `npm test`

```
Test Suites: 6 passed, 6 total
Tests:       33 passed, 33 total
Snapshots:   0 total
Time:        ~3s
```

Suites: `crypto`, `rbac`, `accessControl`, `routesAccess`, `commission`, `ssrf`.

### `npm run build`

```
> @acme/api@0.1.0 build
> tsc -p tsconfig.json

(exit 0)
```

### `npm run migrate`

```
[migrate] up to date (nothing to apply).
[migrate] done.
```

---

## Frontend (`apps/client`)

```bash
cd apps/client && npm ci && npm run typecheck && npm run lint && npm run test:ci
EXPO_PUBLIC_API_BASE_URL=https://api.example.com npm run export:web:all
```

### `npm run typecheck`

```
> @acme/client@0.1.0 typecheck
> tsc --noEmit

(exit 0)
```

### `npm run lint`

```
> @acme/client@0.1.0 lint
> eslint .

(exit 0)
```

### `npm run test:ci`

```
Test Suites: 55 passed, 55 total
Tests:       249 passed, 249 total
Snapshots:   0 total
Time:        ~31s
```

### `npm run export:web:all`

```
Exported: dist-merchant
[pwa-postbuild] patched dist-merchant/index.html for PWA install (portal: merchant).
Exported: dist-admin
[pwa-postbuild] patched dist-admin/index.html for PWA install (portal: admin).
Exported: dist-affiliate
[pwa-postbuild] patched dist-affiliate/index.html for PWA install (portal: affiliate).
(exit 0)
```

Each `index.html` uses `<html lang="fa" dir="ltr">` (intentional RTL layout fix).

---

## Hardening checks included in this verification

| Check | Status |
| ----- | ------ |
| Production fails fast if `CORS_ORIGINS` empty (`env.ts`) | Implemented |
| SSRF guard on store URLs + manual redirect validation (`util/ssrf.ts`) | Implemented + tested |
| Full paginated WooCommerce initial sync (all pages, 100/page) | Implemented |
| `services/api` only deployable backend in `DEPLOYMENT.md` | Documented |
| GitHub Actions CI | `.github/workflows/ci.yml` |
