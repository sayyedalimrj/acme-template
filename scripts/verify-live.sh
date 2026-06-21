#!/usr/bin/env bash
# Live deployment verification (run on the server after install).
#
# Usage:
#   ./scripts/verify-live.sh --base-url http://192.168.101.181
#   ./scripts/verify-live.sh --base-url https://app.jet-web.ir --api-url https://api.jet-web.ir
#   ./scripts/verify-live.sh --merchant-url https://app.jet-web.ir --admin-url https://admin.jet-web.ir \
#       --affiliate-url https://partner.jet-web.ir --api-url https://api.jet-web.ir
set -euo pipefail

BASE_URL="${BASE_URL:-http://192.168.101.181}"
API_URL="${API_URL:-$BASE_URL}"
MERCHANT_URL="${MERCHANT_URL:-$BASE_URL}"
ADMIN_URL="${ADMIN_URL:-}"
AFFILIATE_URL="${AFFILIATE_URL:-}"
SMS_TEST_NUMBER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; MERCHANT_URL="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    --merchant-url) MERCHANT_URL="$2"; shift 2 ;;
    --admin-url) ADMIN_URL="$2"; shift 2 ;;
    --affiliate-url) AFFILIATE_URL="$2"; shift 2 ;;
    --sms-test-number) SMS_TEST_NUMBER="$2"; shift 2 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

pass() { echo "  ✓ $*"; }
fail() { echo "  ✗ $*" >&2; ERR=1; }

ERR=0
echo "=== verify-live.sh ==="
echo "merchant: $MERCHANT_URL  api: $API_URL"
[[ -n "$ADMIN_URL" ]] && echo "admin: $ADMIN_URL"
[[ -n "$AFFILIATE_URL" ]] && echo "affiliate: $AFFILIATE_URL"

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

check_frontend() {
  local label="$1" url="$2" expected_portal="${3:-}"
  for path in / /verify /sign-in /config.json; do
    code=$(curl -so /dev/null -w '%{http_code}' "${url}${path}")
    if [[ "$code" == "200" ]]; then
      pass "${label} GET ${path} → 200"
    else
      fail "${label} GET ${path} → ${code}"
    fi
  done
  if curl -sf "${url}/config.json" | grep -q apiBaseUrl; then
    pass "${label} runtime config.json present"
    if [[ -n "$expected_portal" ]]; then
      if curl -sf "${url}/config.json" | grep -q "\"portal\"[[:space:]]*:[[:space:]]*\"${expected_portal}\""; then
        pass "${label} config portal=${expected_portal}"
      else
        fail "${label} config portal mismatch (expected ${expected_portal})"
      fi
    fi
  else
    fail "${label} config.json missing or invalid"
  fi
}

check_frontend merchant "$MERCHANT_URL" merchant
if [[ -n "$ADMIN_URL" ]]; then
  check_frontend admin "$ADMIN_URL" admin
fi
if [[ -n "$AFFILIATE_URL" ]]; then
  check_frontend affiliate "$AFFILIATE_URL" affiliate
fi

if [[ -z "$ADMIN_URL" && -z "$AFFILIATE_URL" ]]; then
  echo "  ℹ IP-only preview validates merchant only. Map admin/partner hostnames for full portal QA."
fi

# --- SNI-safe local origin checks -----------------------------------------
# On the portal server itself you often want to test the LOCAL origin while still presenting the
# real hostname. `curl -H "Host: api.jet-web.ir" https://127.0.0.1` is NOT enough for HTTPS: TLS
# SNI (the hostname inside the handshake) is sent BEFORE any HTTP Host header, so the server may
# pick the wrong cert/vhost. Use `--resolve <host>:443:127.0.0.1` so curl does SNI for the real
# hostname but connects to localhost. `-k` skips cert verification for self-signed origins.
if [[ "${SNI_LOCAL:-false}" == "true" ]]; then
  echo "  SNI-safe local origin checks (--resolve):"
  for host in api.jet-web.ir app.jet-web.ir admin.jet-web.ir partner.jet-web.ir; do
    path="/"; [[ "$host" == api.* ]] && path="/health"
    code=$(curl -k -so /dev/null -w '%{http_code}' --resolve "${host}:443:127.0.0.1" "https://${host}${path}" || echo "000")
    if [[ "$code" =~ ^2|3 ]]; then pass "SNI ${host}${path} → ${code}"; else fail "SNI ${host}${path} → ${code}"; fi
  done
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
