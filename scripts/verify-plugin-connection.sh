#!/usr/bin/env bash
# Repeatable plugin connection verification (requires running API + DATABASE_URL).
# Usage: BASE=https://api.jet-web.ir PLUGIN_SECRET=... SITE_ID=... TENANT_ID=... ./scripts/verify-plugin-connection.sh
set -euo pipefail

BASE="${BASE:-https://api.jet-web.ir/plugin}"
SITE_ID="${SITE_ID:?SITE_ID required}"
TENANT_ID="${TENANT_ID:?TENANT_ID required}"
SECRET="${PLUGIN_SECRET:?PLUGIN_SECRET required}"

timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
nonce="verify-$(date +%s)-$RANDOM"
plugin_version="1.1.0"
body='{"pluginVersion":"'"$plugin_version"'","wooVersion":"9.0.0","wpVersion":"6.6"}'
body_hash="$(printf '%s' "$body" | sha256sum | awk '{print $1}')"
base_str="${SITE_ID}
${TENANT_ID}
${timestamp}
${nonce}
${plugin_version}
${body_hash}"
signature="$(printf '%s' "$base_str" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"

echo "→ POST $BASE/health"
curl -sf -X POST "$BASE/health" \
  -H "Content-Type: application/json" \
  -H "x-wcos-site-id: $SITE_ID" \
  -H "x-wcos-tenant-id: $TENANT_ID" \
  -H "x-wcos-timestamp: $timestamp" \
  -H "x-wcos-nonce: $nonce" \
  -H "x-wcos-plugin-version: $plugin_version" \
  -H "x-wcos-signature: $signature" \
  -d "$body"
echo ""
echo "OK: signed plugin health succeeded"
