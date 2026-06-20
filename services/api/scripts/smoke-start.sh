#!/usr/bin/env bash
# Production smoke test — uses the same start command as systemd (`npm start`).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_ENV="${NODE_ENV:-test}"
export DATABASE_URL="${DATABASE_URL:-postgres://test:test@localhost:5432/test}"
export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-0123456789abcdef}"
export OTP_HASH_SECRET="${OTP_HASH_SECRET:-test-otp-secret-0123456789abcdef}"
export CREDENTIAL_ENCRYPTION_KEY="${CREDENTIAL_ENCRYPTION_KEY:-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:8081}"
export SMS_DRY_RUN="${SMS_DRY_RUN:-true}"

npm run build
test -f dist/index.js || { echo "dist/index.js missing after build"; exit 1; }

PORT="${SMOKE_PORT:-18080}"
export PORT
node dist/index.js &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT

for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
    echo "[smoke] health OK on port ${PORT}"
    curl -sf "http://127.0.0.1:${PORT}/auth/public-config" | grep -q smsDryRun
    echo "[smoke] public-config OK"
    exit 0
  fi
  sleep 0.5
done

echo "[smoke] server did not become ready"
exit 1
