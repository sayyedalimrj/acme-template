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
SERVICE_USER="${SERVICE_USER:-deploy}"
# Internal API port. Kept in sync with the .env PORT and the systemd unit.
API_PORT="${API_PORT:-8080}"

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

if [[ "$FORCE_ENV" == "true" ]]; then
  echo "" >&2
  echo "============================================================" >&2
  echo "  ⚠  --force-env: services/api/.env will be REGENERATED." >&2
  echo "     Existing secrets are PRESERVED where present (JWT, DB" >&2
  echo "     password, IPPanel API key + PATTERN code), but review" >&2
  echo "     the result before enabling live SMS. Ctrl-C to abort." >&2
  echo "============================================================" >&2
  echo "" >&2
  sleep 5
fi

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

# Capture existing secrets/settings so a --force-env regeneration PRESERVES them rather than
# silently resetting the SMS pattern code, IPPanel API key, JWT, or the DB password — every one
# of which has caused a real production incident on this stack.
read_env_var() { grep -E "^[[:space:]]*$1=" "$ENV_FILE" 2>/dev/null | tail -1 | sed -E "s/^[[:space:]]*$1=//"; }
PREV_DB_URL=""; PREV_JWT=""; PREV_OTP_HASH=""; PREV_VAULT=""
PREV_IPPANEL_API_KEY=""; PREV_IPPANEL_PATTERN=""; PREV_IPPANEL_ORIGINATOR=""
PREV_IPPANEL_OTP_VAR=""; PREV_IPPANEL_BASE=""; PREV_IPPANEL_PROVIDER=""
PREV_SMS_DRY_RUN=""; PREV_ADMIN_ALLOWLIST=""
if [[ -f "$ENV_FILE" ]]; then
  PREV_DB_URL="$(read_env_var DATABASE_URL)"
  PREV_JWT="$(read_env_var JWT_SECRET)"
  PREV_OTP_HASH="$(read_env_var OTP_HASH_SECRET)"
  PREV_VAULT="$(read_env_var CREDENTIAL_ENCRYPTION_KEY)"
  PREV_IPPANEL_API_KEY="$(read_env_var IPPANEL_API_KEY)"
  PREV_IPPANEL_PATTERN="$(read_env_var IPPANEL_PATTERN_CODE)"
  PREV_IPPANEL_ORIGINATOR="$(read_env_var IPPANEL_ORIGINATOR)"
  PREV_IPPANEL_OTP_VAR="$(read_env_var IPPANEL_OTP_VARIABLE)"
  PREV_IPPANEL_BASE="$(read_env_var IPPANEL_BASE_URL)"
  PREV_IPPANEL_PROVIDER="$(read_env_var IPPANEL_PROVIDER)"
  PREV_SMS_DRY_RUN="$(read_env_var SMS_DRY_RUN)"
  PREV_ADMIN_ALLOWLIST="$(read_env_var ADMIN_MOBILE_ALLOWLIST)"
fi

if [[ ! -f "$ENV_FILE" || "$FORCE_ENV" == "true" ]]; then
  log "Writing ${ENV_FILE}…"
  # Reuse existing secrets when present (updates never rotate them); generate only what's missing.
  JWT_SECRET="${PREV_JWT:-$(openssl rand -hex 32)}"
  OTP_HASH_SECRET="${PREV_OTP_HASH:-$(openssl rand -hex 32)}"
  VAULT_KEY="${PREV_VAULT:-$(openssl rand -hex 32)}"

  # DB: reuse the role/password from a prior DATABASE_URL to avoid password drift (a regenerated
  # password that no longer matches the live Postgres role is a known boot failure).
  if [[ -n "$PREV_DB_URL" ]]; then
    DATABASE_URL="$PREV_DB_URL"
    DB_PASS="$(printf '%s' "$PREV_DB_URL" | sed -E 's#^postgres://[^:]+:([^@]+)@.*#\1#')"
    log "  reusing existing DATABASE_URL (no DB password drift)"
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='portal'" | grep -q 1 || \
      sudo -u postgres psql -c "CREATE USER portal WITH PASSWORD '${DB_PASS}';"
  else
    DB_PASS="$(openssl rand -hex 16)"
    DATABASE_URL="postgres://portal:${DB_PASS}@localhost:5432/portal"
    if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='portal'" | grep -q 1; then
      # Role exists but no prior URL was found: align the password so the two can't drift apart.
      sudo -u postgres psql -c "ALTER USER portal WITH PASSWORD '${DB_PASS}';"
    else
      sudo -u postgres psql -c "CREATE USER portal WITH PASSWORD '${DB_PASS}';"
    fi
  fi
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='portal'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE portal OWNER portal;"

  # SMS / IPPanel: preserve the provider key + PATTERN code from the previous .env. Defaults are
  # used ONLY on a first install; an update must never reset a working pattern code.
  IPPANEL_API_KEY_VAL="${PREV_IPPANEL_API_KEY:-}"
  IPPANEL_PATTERN_VAL="${PREV_IPPANEL_PATTERN:-ebvqrqy10gm3o04}"
  IPPANEL_ORIGINATOR_VAL="${PREV_IPPANEL_ORIGINATOR:-+983000505}"
  IPPANEL_OTP_VAR_VAL="${PREV_IPPANEL_OTP_VAR:-verification-code}"
  IPPANEL_BASE_VAL="${PREV_IPPANEL_BASE:-https://edge.ippanel.com/v1}"
  IPPANEL_PROVIDER_VAL="${PREV_IPPANEL_PROVIDER:-edge}"
  SMS_DRY_RUN_VAL="${PREV_SMS_DRY_RUN:-$DRY_RUN_SMS}"
  # Admin allow-list is preserved if set; first install seeds the platform owner numbers.
  ADMIN_ALLOWLIST_VAL="${PREV_ADMIN_ALLOWLIST:-09186441801,09125233608}"

  if [[ "$MODE" == "local-preview" ]]; then
    CORS="http://${SERVER_IP},http://app.${DOMAIN},http://admin.${DOMAIN},http://partner.${DOMAIN}"
    PUBLIC_API="http://${SERVER_IP}"
  else
    CORS="https://app.${DOMAIN},https://admin.${DOMAIN},https://partner.${DOMAIN}"
    PUBLIC_API="https://api.${DOMAIN}"
  fi

  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=${API_PORT}
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
OTP_HASH_SECRET=${OTP_HASH_SECRET}
CREDENTIAL_ENCRYPTION_KEY=${VAULT_KEY}
CORS_ORIGINS=${CORS}
PUBLIC_API_BASE_URL=${PUBLIC_API}
SMS_DRY_RUN=${SMS_DRY_RUN_VAL}
IPPANEL_PROVIDER=${IPPANEL_PROVIDER_VAL}
IPPANEL_BASE_URL=${IPPANEL_BASE_VAL}
IPPANEL_PATTERN_CODE=${IPPANEL_PATTERN_VAL}
IPPANEL_ORIGINATOR=${IPPANEL_ORIGINATOR_VAL}
IPPANEL_OTP_VARIABLE=${IPPANEL_OTP_VAR_VAL}
IPPANEL_API_KEY=${IPPANEL_API_KEY_VAL}
TRUST_PROXY=true
ADMIN_MOBILE_ALLOWLIST=${ADMIN_ALLOWLIST_VAL}
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
  log "Building frontends (clean, isolated per-portal Metro cache)…"
  cd "${INSTALL_ROOT}/apps/client"
  npm ci
  # Own-server builds are PRODUCTION runtime: the app must never silently fall back to mock data
  # and must show a visible error (not a blank screen) if config.json is missing/invalid. The
  # *:production:clean scripts clear the bundler cache and stamp a unique BUILD_ID per portal so
  # admin/affiliate can never inherit the merchant bundle (the cached-bundle mismatch incident).
  if [[ "$MODE" == "local-preview" ]]; then RT_ENV="local-preview"; else RT_ENV="production"; fi
  for portal in merchant admin affiliate; do
    RUNTIME_CONFIG_ENV="$RT_ENV" BUILD_ID="${portal}-$(date +%s)-$$" \
      npm run "export:web:${portal}:production:clean"
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

if ! step_done service_user; then
  log "Ensuring service user '${SERVICE_USER}' exists (prevents systemd status=217/USER)…"
  if ! id -u "$SERVICE_USER" >/dev/null 2>&1; then
    useradd --system --create-home --shell /usr/sbin/nologin "$SERVICE_USER" 2>/dev/null \
      || useradd --system --shell /bin/false "$SERVICE_USER" \
      || die "Could not create service user '${SERVICE_USER}'."
    log "  created system user ${SERVICE_USER}"
  else
    log "  ${SERVICE_USER} already exists — left untouched"
  fi
  # The unit runs as ${SERVICE_USER}; give it ownership of the app tree (read + run only).
  chown -R "${SERVICE_USER}:${SERVICE_USER}" "$INSTALL_ROOT"
  if [[ -f "$ENV_FILE" ]]; then
    chown "${SERVICE_USER}:${SERVICE_USER}" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
  fi
  mark_step service_user
fi

if ! step_done port_check; then
  log "Preflight: API port ${API_PORT} availability…"
  if command -v ss >/dev/null 2>&1 && ss -ltn 2>/dev/null | grep -qE "[:.]${API_PORT}[[:space:]]"; then
    if systemctl is-active --quiet portal-api 2>/dev/null; then
      log "  port ${API_PORT} held by the running portal-api — OK (it will be restarted)"
    else
      holder="$(ss -ltnp 2>/dev/null | grep -E "[:.]${API_PORT}[[:space:]]" | grep -oE 'users:\(\("[^"]+' | head -1 | sed -E 's/.*"//')"
      die "API port ${API_PORT} is already in use by '${holder:-another process}'. NOT killing it automatically (it may be the old Nginx preview/NPM listener — the known 8080 conflict). Free the port or re-run with API_PORT=<free port>. See docs/DEPLOYMENT.md."
    fi
  else
    log "  port ${API_PORT} is free"
  fi
  mark_step port_check
fi

if ! step_done systemd; then
  log "Installing systemd unit…"
  cp "${INSTALL_ROOT}/services/api/deploy/portal-api.service" /etc/systemd/system/
  sed -i "s|/var/www/portal|${INSTALL_ROOT}|g" /etc/systemd/system/portal-api.service
  # Keep the unit's run-as user in sync with the user we actually created above.
  sed -i "s|^User=.*|User=${SERVICE_USER}|" /etc/systemd/system/portal-api.service
  sed -i "s|^Group=.*|Group=${SERVICE_USER}|" /etc/systemd/system/portal-api.service
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
