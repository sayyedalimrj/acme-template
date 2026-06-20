#!/usr/bin/env bash
# Idempotent portal installer for Ubuntu 24.04.
#
# Usage:
#   sudo ./scripts/install_portal.sh --mode local-preview --domain jet-web.ir --server-ip 192.168.101.181
#   sudo ./scripts/install_portal.sh --mode production-behind-npm --domain jet-web.ir
#
# Flags:
#   --mode local-preview|production-behind-npm
#   --domain <base domain, e.g. jet-web.ir>
#   --server-ip <internal IP for local preview, default 192.168.101.181>
#   --sms-provider ippanel-edge
#   --dry-run-sms true|false
#   --force-env          overwrite existing services/api/.env
#   --resume             skip steps recorded in .install-state
#   --install-root       default /var/www/portal
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/var/www/portal}"
REPO_SRC="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="${INSTALL_ROOT}/.install-state"
MODE="local-preview"
DOMAIN="jet-web.ir"
SERVER_IP="192.168.101.181"
SMS_PROVIDER="ippanel-edge"
DRY_RUN_SMS="true"
FORCE_ENV="false"
RESUME="false"

log() { echo "[install] $*"; }
die() { echo "[install] ERROR: $*" >&2; exit 1; }

step_done() { grep -qx "$1" "$STATE_FILE" 2>/dev/null; }
mark_step() { mkdir -p "$(dirname "$STATE_FILE")"; echo "$1" >> "$STATE_FILE"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; shift 2 ;;
    --server-ip) SERVER_IP="$2"; shift 2 ;;
    --sms-provider) SMS_PROVIDER="$2"; shift 2 ;;
    --dry-run-sms) DRY_RUN_SMS="$2"; shift 2 ;;
    --force-env) FORCE_ENV="true"; shift ;;
    --resume) RESUME="true"; shift ;;
    --install-root) INSTALL_ROOT="$2"; shift 2 ;;
    *) die "Unknown flag: $1" ;;
  esac
done

[[ "$(id -u)" -eq 0 ]] || die "Run as root (sudo)."

if [[ "$RESUME" == "false" && "$FORCE_ENV" == "true" ]]; then
  : > "$STATE_FILE" 2>/dev/null || true
fi

if ! step_done packages; then
  log "Installing packages (no dist-upgrade)…"
  apt-get update -y
  apt-get install -y curl git nginx postgresql postgresql-contrib
  if ! command -v node >/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
  mark_step packages
fi

if ! step_done sync; then
  log "Syncing repo to ${INSTALL_ROOT}…"
  mkdir -p "$INSTALL_ROOT"
  rsync -a --delete \
    --exclude node_modules --exclude dist --exclude dist-* --exclude .git \
    "$REPO_SRC/" "$INSTALL_ROOT/"
  mark_step sync
fi

ENV_FILE="${INSTALL_ROOT}/services/api/.env"
if [[ ! -f "$ENV_FILE" || "$FORCE_ENV" == "true" ]]; then
  log "Writing ${ENV_FILE}…"
  JWT_SECRET="$(openssl rand -hex 32)"
  OTP_HASH_SECRET="$(openssl rand -hex 32)"
  VAULT_KEY="$(openssl rand -hex 32)"
  DB_PASS="$(openssl rand -hex 16)"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='portal'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER portal WITH PASSWORD '${DB_PASS}';"
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='portal'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE portal OWNER portal;"

  if [[ "$MODE" == "local-preview" ]]; then
    CORS="http://${SERVER_IP},http://app.${DOMAIN},http://admin.${DOMAIN},http://partner.${DOMAIN}"
    PUBLIC_API="http://${SERVER_IP}"
  else
    CORS="https://app.${DOMAIN},https://admin.${DOMAIN},https://partner.${DOMAIN}"
    PUBLIC_API="https://api.${DOMAIN}"
  fi

  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://portal:${DB_PASS}@localhost:5432/portal
JWT_SECRET=${JWT_SECRET}
OTP_HASH_SECRET=${OTP_HASH_SECRET}
CREDENTIAL_ENCRYPTION_KEY=${VAULT_KEY}
CORS_ORIGINS=${CORS}
PUBLIC_API_BASE_URL=${PUBLIC_API}
SMS_DRY_RUN=${DRY_RUN_SMS}
IPPANEL_PROVIDER=edge
IPPANEL_BASE_URL=https://edge.ippanel.com/v1
IPPANEL_PATTERN_CODE=jcxqs3bwxo3rfkk
IPPANEL_ORIGINATOR=+983000505
IPPANEL_OTP_VARIABLE=verification-code
IPPANEL_API_KEY=
TRUST_PROXY=true
  ADMIN_MOBILE_ALLOWLIST=09125233608
EOF
  chmod 600 "$ENV_FILE"
  mark_step env
else
  log "Keeping existing ${ENV_FILE} (use --force-env to regenerate)."
fi

if ! step_done backend; then
  log "Building backend…"
  cd "${INSTALL_ROOT}/services/api"
  npm ci
  npm run build
  npm run migrate
  test -f dist/index.js || die "Backend build missing dist/index.js — check tsconfig"
  mark_step backend
fi

if ! step_done frontend; then
  log "Building frontends…"
  cd "${INSTALL_ROOT}/apps/client"
  npm ci
  for portal in merchant admin affiliate; do
    # Own-server builds are PRODUCTION runtime: the app must never silently fall back to mock
    # data and must show a visible error (not a blank screen) if config.json is missing/invalid.
    EXPO_PUBLIC_PORTAL="$portal" EXPO_PUBLIC_RUNTIME_ENV=production npm run "export:web:${portal}"
  done
  mark_step frontend
fi

if ! step_done config; then
  log "Deploying runtime config.json per portal…"
  if [[ "$MODE" == "local-preview" ]]; then
    ENV_SUFFIX="local-preview"
  else
    ENV_SUFFIX="production"
  fi
  for portal in merchant admin affiliate; do
    src="${INSTALL_ROOT}/apps/client/config/${portal}.${ENV_SUFFIX}.json"
    dest="${INSTALL_ROOT}/apps/client/dist-${portal}/config.json"
    cp "$src" "$dest"
    sed -i "s|api.jet-web.ir|api.${DOMAIN}|g" "$dest" || true
    sed -i "s|192.168.101.181|${SERVER_IP}|g" "$dest" || true
    log "  ${portal} → config.json (portal=$(grep -o '"portal"[[:space:]]*:[[:space:]]*"[^"]*"' "$dest" | head -1))"
  done
  mark_step config
fi

if ! step_done systemd; then
  log "Installing systemd unit…"
  cp "${INSTALL_ROOT}/services/api/deploy/portal-api.service" /etc/systemd/system/
  sed -i "s|/var/www/portal|${INSTALL_ROOT}|g" /etc/systemd/system/portal-api.service
  systemctl daemon-reload
  systemctl enable portal-api
  systemctl restart portal-api
  mark_step systemd
fi

if ! step_done nginx; then
  log "Installing nginx configs…"
  mkdir -p /etc/nginx/snippets
  cp "${INSTALL_ROOT}/services/api/deploy/nginx/portal-api-proxy.conf" /etc/nginx/snippets/
  cp "${INSTALL_ROOT}/services/api/deploy/nginx/portal-spa.conf" /etc/nginx/snippets/
  if [[ "$MODE" == "local-preview" ]]; then
    cp "${INSTALL_ROOT}/services/api/deploy/nginx/jet-web.local-preview.conf" \
      /etc/nginx/sites-available/portal-local
    sed -i "s|192.168.101.181|${SERVER_IP}|g" /etc/nginx/sites-available/portal-local
    ln -sf /etc/nginx/sites-available/portal-local /etc/nginx/sites-enabled/portal-local
  else
    cp "${INSTALL_ROOT}/services/api/deploy/nginx/jet-web.production.conf" \
      /etc/nginx/sites-available/portal-production
    sed -i "s|jet-web.ir|${DOMAIN}|g" /etc/nginx/sites-available/portal-production
    sed -i "s|/var/www/portal|${INSTALL_ROOT}|g" /etc/nginx/sites-available/portal-production
    ln -sf /etc/nginx/sites-available/portal-production /etc/nginx/sites-enabled/portal-production
  fi
  nginx -t
  systemctl reload nginx
  mark_step nginx
fi

log "Done. Verify with: ${INSTALL_ROOT}/scripts/verify-live.sh"
log "Set IPPANEL_API_KEY in ${ENV_FILE} when enabling real SMS."
