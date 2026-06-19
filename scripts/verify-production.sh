#!/usr/bin/env bash
# Reproducible clean-machine verification for production hardening.
# Usage: ./scripts/verify-production.sh 2>&1 | tee docs/VERIFY.log
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://api.example.com}"

echo "=== verify-production.sh ==="
echo "date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "node: $(node -v)"
echo "npm: $(npm -v)"
echo

echo ">>> Backend: npm ci"
(cd "$ROOT/services/api" && npm ci)

echo ">>> Backend: typecheck"
(cd "$ROOT/services/api" && npm run typecheck)

echo ">>> Backend: test"
(cd "$ROOT/services/api" && npm test)

echo ">>> Backend: build"
(cd "$ROOT/services/api" && npm run build)

if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URL:-}" ]]; then
  echo ">>> Backend: migrate (DATABASE_URL set)"
  (cd "$ROOT/services/api" && npm run migrate)
else
  echo ">>> Backend: migrate SKIPPED (set DATABASE_URL + Postgres to run migrations)"
fi

echo
echo ">>> Frontend: npm ci"
(cd "$ROOT/apps/client" && npm ci)

echo ">>> Frontend: typecheck"
(cd "$ROOT/apps/client" && npm run typecheck)

echo ">>> Frontend: lint"
(cd "$ROOT/apps/client" && npm run lint)

echo ">>> Frontend: test:ci"
(cd "$ROOT/apps/client" && npm run test:ci)

echo ">>> Frontend: export:web:all"
(cd "$ROOT/apps/client" && npm run export:web:all)

echo
echo "=== ALL GATES PASSED ==="
