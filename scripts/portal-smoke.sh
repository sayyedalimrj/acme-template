#!/usr/bin/env bash
# E2E portal smoke: built API + three static exports, login pages + OTP flow.
#
# Usage (from repo root):
#   npm run smoke:portals --prefix services/api   # starts API in background if needed
#   ./scripts/portal-smoke.sh
#
# Requires: curl, node, built dist-* folders (npm run export:web:all --prefix apps/client)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="${API_URL:-http://127.0.0.1:8080}"
MERCHANT_PORT="${MERCHANT_PORT:-4173}"
ADMIN_PORT="${ADMIN_PORT:-4174}"
AFFILIATE_PORT="${AFFILIATE_PORT:-4175}"
TEST_MOBILE="${TEST_MOBILE:-09129998877}"

pass() { echo "  ✓ $*"; }
fail() { echo "  ✗ $*" >&2; ERR=1; }

ERR=0
echo "=== portal-smoke.sh ==="

cd "$ROOT/apps/client"
for portal in merchant admin affiliate; do
  if [[ ! -f "dist-${portal}/index.html" ]]; then
    fail "dist-${portal} missing — run: npm run export:web:all"
    exit 1
  fi
  cfg_portal=$(node -e "console.log(JSON.parse(require('fs').readFileSync('dist-${portal}/config.json')).portal)")
  if [[ "$cfg_portal" != "$portal" ]]; then
    fail "dist-${portal}/config.json portal=${cfg_portal} (expected ${portal})"
  else
    pass "dist-${portal}/config.json portal=${portal}"
  fi
done

serve_static() {
  local dir="$1" port="$2"
  npx --yes serve -s "$dir" -l "$port" >/dev/null 2>&1 &
  echo $!
}

PIDS=()
cleanup() { for pid in "${PIDS[@]:-}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

PIDS+=("$(serve_static dist-merchant "$MERCHANT_PORT")")
PIDS+=("$(serve_static dist-admin "$ADMIN_PORT")")
PIDS+=("$(serve_static dist-affiliate "$AFFILIATE_PORT")")
sleep 2

for spec in "merchant:$MERCHANT_PORT:فروشگاه" "admin:$ADMIN_PORT:پنل مدیریت" "affiliate:$AFFILIATE_PORT:پنل بازاریاب"; do
  IFS=: read -r portal port needle <<< "$spec"
  html=$(curl -sf "http://127.0.0.1:${port}/sign-in" || true)
  if echo "$html" | grep -q '<div id="root"'; then
    pass "${portal} login page HTML served"
  else
    fail "${portal} login page missing root div"
  fi
  cfg=$(curl -sf "http://127.0.0.1:${port}/config.json" || true)
  if echo "$cfg" | grep -q "\"portal\"[[:space:]]*:[[:space:]]*\"${portal}\""; then
    pass "${portal} runtime config portal id"
  else
    fail "${portal} runtime config wrong: $cfg"
  fi
done

if curl -sf "${API_URL}/health" | grep -q '"ok":true'; then
  pass "API health"
else
  fail "API not reachable at ${API_URL} — run: npm run smoke:start --prefix services/api"
fi

for portal in merchant admin affiliate; do
  resp=$(curl -sf -X POST "${API_URL}/auth/otp/request" \
    -H 'Content-Type: application/json' \
    -d "{\"mobile\":\"${TEST_MOBILE}\",\"portal\":\"${portal}\"}" || true)
  if echo "$resp" | grep -q '"ok":true'; then
    pass "OTP request portal=${portal}"
    dev_code=$(echo "$resp" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).devCode||'')}catch{}})")
    if [[ -n "$dev_code" ]]; then
      verify=$(curl -sf -X POST "${API_URL}/auth/otp/verify" \
        -H 'Content-Type: application/json' \
        -d "{\"mobile\":\"${TEST_MOBILE}\",\"code\":\"${dev_code}\",\"portal\":\"${portal}\"}" || true)
      if echo "$verify" | grep -q "\"portal\"[[:space:]]*:[[:space:]]*\"${portal}\""; then
        pass "OTP verify preserved portal=${portal}"
      else
        fail "OTP verify portal mismatch for ${portal}: $verify"
      fi
    fi
  else
    fail "OTP request failed for ${portal}: $resp"
  fi
done

if [[ "$ERR" -eq 0 ]]; then
  echo "=== PORTAL SMOKE PASSED ==="
else
  echo "=== PORTAL SMOKE FAILED ==="
  exit 1
fi
