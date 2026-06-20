#!/usr/bin/env bash
# Live deployment verification (run on the server after install).
#
# Usage:
#   ./scripts/verify-live.sh [--base-url http://192.168.101.181] [--api-url http://192.168.101.181]
#   ./scripts/verify-live.sh --base-url https://app.jet-web.ir --api-url https://api.jet-web.ir
set -euo pipefail

BASE_URL="${BASE_URL:-http://192.168.101.181}"
API_URL="${API_URL:-$BASE_URL}"
SMS_TEST_NUMBER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    --sms-test-number) SMS_TEST_NUMBER="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

pass() { echo "  ✓ $*"; }
fail() { echo "  ✗ $*" >&2; ERR=1; }

ERR=0
echo "=== verify-live.sh ==="
echo "base: $BASE_URL  api: $API_URL"

if systemctl is-active --quiet portal-api 2>/dev/null; then
  pass "portal-api systemd active"
else
  fail "portal-api not active (systemctl status portal-api)"
fi

if curl -sf "${API_URL%/}/health" | grep -q '"ok":true'; then
  pass "API /health"
else
  fail "API /health unreachable at ${API_URL}/health"
fi

if curl -sf "${API_URL%/}/auth/public-config" | grep -q smsDryRun; then
  pass "API /auth/public-config"
else
  fail "API /auth/public-config"
fi

if command -v psql >/dev/null && [[ -f services/api/.env ]]; then
  # shellcheck disable=SC1091
  source services/api/.env 2>/dev/null || true
  if [[ -n "${DATABASE_URL:-}" ]] && psql "$DATABASE_URL" -c 'SELECT 1' >/dev/null 2>&1; then
    pass "Postgres reachable"
  else
    fail "Postgres not reachable via DATABASE_URL"
  fi
fi

if [[ -f services/api/.env ]]; then
  # shellcheck disable=SC1091
  source services/api/.env
  if [[ "${SMS_DRY_RUN:-true}" == "false" ]]; then
    for var in IPPANEL_API_KEY IPPANEL_PATTERN_CODE IPPANEL_ORIGINATOR IPPANEL_OTP_VARIABLE; do
      if [[ -n "${!var:-}" ]]; then pass "SMS env $var set"; else fail "SMS env $var missing"; fi
    done
  else
    pass "SMS dry-run mode (skip provider key check)"
  fi
fi

if nginx -t >/dev/null 2>&1; then
  pass "nginx config valid"
else
  fail "nginx -t failed"
fi

for path in / /verify /sign-in /config.json; do
  code=$(curl -so /dev/null -w '%{http_code}' "${BASE_URL}${path}")
  if [[ "$code" == "200" ]]; then
    pass "frontend GET ${path} → 200"
  else
    fail "frontend GET ${path} → ${code}"
  fi
done

if curl -sf "${BASE_URL}/config.json" | grep -q apiBaseUrl; then
  pass "runtime config.json present"
  cfg_api=$(curl -sf "${BASE_URL}/config.json" | grep -o '"apiBaseUrl"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1)
  echo "    ${cfg_api}"
else
  fail "config.json missing or invalid"
fi

if [[ -n "$SMS_TEST_NUMBER" ]]; then
  resp=$(curl -sf -X POST "${API_URL%/}/auth/otp/request" \
    -H 'Content-Type: application/json' \
    -d "{\"mobile\":\"${SMS_TEST_NUMBER}\",\"portal\":\"merchant\"}" || true)
  if echo "$resp" | grep -q '"ok":true'; then
    pass "SMS OTP request to ${SMS_TEST_NUMBER}"
    echo "    $resp"
  else
    fail "SMS OTP request failed: $resp"
  fi
fi

if [[ "$ERR" -eq 0 ]]; then
  echo "=== ALL CHECKS PASSED ==="
else
  echo "=== SOME CHECKS FAILED ==="
  exit 1
fi
