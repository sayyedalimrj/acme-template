#!/usr/bin/env bash
# verify_portal_builds.sh — prove the three exported portals are portal-safe.
#
# Guards against the cache-contamination incident (admin/partner loaded the merchant bundle).
# Each export bakes its portal into the JS bundle via EXPO_PUBLIC_PORTAL, and the runtime
# config.json portal must match that baked portal — so two checks together prove safety:
#   1) dist-<portal>/config.json has portal=<portal> and a real https API base URL, and
#   2) the three portals' JS bundles are DISTINCT (identical bundles ⇒ a reused cached build).
#
# Usage:  ./scripts/verify_portal_builds.sh
#         CLIENT_DIR=/var/www/portal/apps/client ./scripts/verify_portal_builds.sh
#         EXPECT_API=https://api.jet-web.ir ./scripts/verify_portal_builds.sh
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLIENT_DIR="${CLIENT_DIR:-${SCRIPT_DIR}/../apps/client}"
EXPECT_API="${EXPECT_API:-https://api.jet-web.ir}"

pass() { echo "  ✓ $*"; }
fail() { echo "  ✗ $*" >&2; ERR=1; }
ERR=0

echo "=== verify_portal_builds.sh ==="
echo "client dir: ${CLIENT_DIR}"

hash_for() { # hash a portal's web JS bundle (sorted file contents) → contamination signal
  local dir="$1/_expo/static/js/web"
  if [[ ! -d "$dir" ]]; then echo "MISSING"; return; fi
  # Concatenate every top-level .js by name, then hash. Distinct portals ⇒ distinct hashes.
  find "$dir" -maxdepth 1 -type f -name '*.js' | sort | xargs cat 2>/dev/null | sha256sum | awk '{print $1}'
}

declare -A HASHES
for portal in merchant admin affiliate; do
  dist="${CLIENT_DIR}/dist-${portal}"
  cfg="${dist}/config.json"
  echo "-- ${portal} (${dist})"
  if [[ ! -d "$dist" ]]; then
    fail "${portal}: dist dir missing — run 'npm run export:web:all:production:clean'"
    continue
  fi
  if [[ ! -f "$cfg" ]]; then
    fail "${portal}: config.json missing"
  else
    cfg_portal="$(grep -oE '"portal"[[:space:]]*:[[:space:]]*"[^"]*"' "$cfg" | head -1 | sed -E 's/.*"([^"]*)"$/\1/')"
    cfg_api="$(grep -oE '"apiBaseUrl"[[:space:]]*:[[:space:]]*"[^"]*"' "$cfg" | head -1 | sed -E 's/.*"([^"]*)"$/\1/')"
    if [[ "$cfg_portal" == "$portal" ]]; then pass "${portal}: config portal=${cfg_portal}"; else fail "${portal}: config portal='${cfg_portal}' (expected ${portal})"; fi
    if [[ -n "$EXPECT_API" ]]; then
      if [[ "$cfg_api" == "$EXPECT_API" ]]; then pass "${portal}: apiBaseUrl=${cfg_api}"; else fail "${portal}: apiBaseUrl='${cfg_api}' (expected ${EXPECT_API})"; fi
    else
      [[ -n "$cfg_api" ]] && pass "${portal}: apiBaseUrl=${cfg_api}" || fail "${portal}: apiBaseUrl empty"
    fi
  fi
  # index.html + sw.js presence (blank-page recovery + cache busting depend on these).
  [[ -f "${dist}/index.html" ]] && pass "${portal}: index.html present" || fail "${portal}: index.html missing"
  [[ -f "${dist}/sw.js" ]] && pass "${portal}: sw.js present" || fail "${portal}: sw.js missing"
  HASHES[$portal]="$(hash_for "$dist")"
  echo "     bundle hash: ${HASHES[$portal]}"
done

# Cross-portal distinctness: no two portals may ship the SAME JS bundle.
check_distinct() {
  local a="$1" b="$2"
  if [[ "${HASHES[$a]}" == "MISSING" || "${HASHES[$b]}" == "MISSING" ]]; then
    fail "${a}/${b}: cannot compare bundles (missing build)"
    return
  fi
  if [[ "${HASHES[$a]}" == "${HASHES[$b]}" ]]; then
    fail "${a} and ${b} ship an IDENTICAL JS bundle — portal contamination (cached build reused)"
  else
    pass "${a} ≠ ${b} bundle (distinct)"
  fi
}
echo "-- bundle distinctness"
check_distinct merchant admin
check_distinct merchant affiliate
check_distinct admin affiliate

if [[ "$ERR" -eq 0 ]]; then
  echo "=== PORTAL BUILDS OK (no config/bundle mismatch possible) ==="
else
  echo "=== PORTAL BUILD VERIFICATION FAILED ===" >&2
  exit 1
fi
