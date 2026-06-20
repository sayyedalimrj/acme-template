#!/usr/bin/env bash
# Safe, repeatable production update for the NEW portal server.
#
# Run this on the NEW portal server AFTER a PR is merged to master. It is the ONE documented
# normal-update command. It is intentionally conservative:
#   • backs up FIRST (.env, Postgres dump, existing dists),
#   • fast-forwards master (never a force/merge),
#   • reinstalls deps, runs migrations, rebuilds backend,
#   • rebuilds all three portals with CLEAN, isolated per-portal cache (no bundle mismatch),
#   • restarts portal-api, tests + reloads ONLY the internal nginx,
#   • verifies, and prints rollback instructions.
#
# It NEVER:
#   • runs --force-env or regenerates/prints any secret,
#   • overwrites services/api/.env,
#   • touches the OLD NPM / Cloudflare server (domains, origin certs, proxy hosts, ports).
# Those only change for domain / target-IP / SSL / proxy-host / internal-port changes — never a
# normal code update.
#
# Usage:  sudo ./scripts/update_portal.sh
#         sudo INSTALL_ROOT=/var/www/portal BRANCH=master ./scripts/update_portal.sh
set -euo pipefail

INSTALL_ROOT="${INSTALL_ROOT:-/var/www/portal}"
SERVICE_USER="${SERVICE_USER:-deploy}"
BRANCH="${BRANCH:-master}"
API_PORT="${API_PORT:-8080}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/portal}"
ENV_FILE="${INSTALL_ROOT}/services/api/.env"
TS="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${TS}"

log() { echo "[update] $*"; }
die() { echo "[update] ERROR: $*" >&2; exit 1; }

# --- Guards ----------------------------------------------------------------
[[ "$(id -u)" -eq 0 ]] || die "Run as root (sudo) on the NEW portal server."
[[ -d "${INSTALL_ROOT}/.git" ]] || \
  die "${INSTALL_ROOT} is not a git checkout. This script updates the new portal server's GitHub checkout only."
# Refuse to run if .env is missing — that means this box was never installed; an update must not
# bootstrap secrets.
[[ -f "$ENV_FILE" ]] || \
  die "${ENV_FILE} is missing. Refusing to update a box that was never installed. Run scripts/install_portal.sh first."

cd "$INSTALL_ROOT"

# --- 1) Backup BEFORE any change ------------------------------------------
log "Backing up to ${BACKUP_DIR} …"
mkdir -p "$BACKUP_DIR"
cp "$ENV_FILE" "${BACKUP_DIR}/api.env.bak"
chmod 600 "${BACKUP_DIR}/api.env.bak"

# Postgres dump. Read DATABASE_URL without echoing it anywhere.
DB_URL="$(grep -E '^[[:space:]]*DATABASE_URL=' "$ENV_FILE" | tail -1 | sed -E 's/^[[:space:]]*DATABASE_URL=//')"
if command -v pg_dump >/dev/null 2>&1 && [[ -n "$DB_URL" ]]; then
  if pg_dump "$DB_URL" > "${BACKUP_DIR}/portal-db.sql" 2>/dev/null; then
    log "  database dumped → portal-db.sql"
  else
    log "  WARN: pg_dump failed (continuing) — check DB connectivity before relying on this backup."
  fi
fi

# Existing frontend dists (instant rollback of a bad build).
for portal in merchant admin affiliate; do
  d="${INSTALL_ROOT}/apps/client/dist-${portal}"
  [[ -d "$d" ]] && cp -a "$d" "${BACKUP_DIR}/dist-${portal}.bak"
done

PREV_SHA="$(git rev-parse HEAD)"
echo "$PREV_SHA" > "${BACKUP_DIR}/git-HEAD.txt"
log "  current commit ${PREV_SHA} recorded for rollback"

# --- 2) Fast-forward master (no merge, no force) --------------------------
log "Fetching latest ${BRANCH} …"
git fetch origin "$BRANCH"
git checkout "$BRANCH" >/dev/null 2>&1 || git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH" || \
  die "Fast-forward failed (local changes or divergence). Resolve manually; nothing was rebuilt or restarted."
NEW_SHA="$(git rev-parse HEAD)"
log "  ${PREV_SHA:0:12} → ${NEW_SHA:0:12}"

# --- 3) Backend: deps, migrate, build -------------------------------------
log "Backend: npm ci + migrate + build …"
( cd services/api && npm ci && npm run migrate && npm run build )
test -f services/api/dist/index.js || die "Backend build missing dist/index.js — aborting before restart."

# --- 4) Frontend: clean, isolated, per-portal production builds -----------
log "Frontend: npm ci + clean per-portal production builds …"
( cd apps/client && npm ci )
for portal in merchant admin affiliate; do
  ( cd apps/client && RUNTIME_CONFIG_ENV=production BUILD_ID="${portal}-${NEW_SHA:0:12}-${TS}" \
      npm run "export:web:${portal}:production:clean" )
done

# Keep ownership correct for the service user (so systemd can read the new files).
chown -R "${SERVICE_USER}:${SERVICE_USER}" "$INSTALL_ROOT" 2>/dev/null || true

# --- 5) Restart API; test + reload ONLY internal nginx --------------------
log "Restarting portal-api …"
systemctl restart portal-api
sleep 2
systemctl is-active --quiet portal-api || \
  die "portal-api failed to start. See 'journalctl -u portal-api -n 100'. Roll back using the steps below."

log "Testing internal nginx config …"
if nginx -t; then
  systemctl reload nginx
  log "  internal nginx reloaded"
else
  die "nginx -t failed — NOT reloading. The previous config keeps serving. Fix it, then: systemctl reload nginx"
fi

# --- 6) Verify -------------------------------------------------------------
log "Verifying …"
if [[ -x "${INSTALL_ROOT}/scripts/verify_portal_builds.sh" ]]; then
  "${INSTALL_ROOT}/scripts/verify_portal_builds.sh" || log "WARN: portal build verification reported issues — review above."
fi
if curl -fsS "http://127.0.0.1:${API_PORT}/health" >/dev/null 2>&1; then
  log "  API /health OK (127.0.0.1:${API_PORT})"
else
  log "WARN: API /health not reachable on 127.0.0.1:${API_PORT} — check 'journalctl -u portal-api'."
fi

cat <<ROLLBACK

============================================================
[update] DONE: ${PREV_SHA:0:12} → ${NEW_SHA:0:12}
Backup: ${BACKUP_DIR}

ROLLBACK (if something is wrong):
  cd ${INSTALL_ROOT}
  git reset --hard ${PREV_SHA}
  ( cd services/api && npm ci && npm run build )
  for p in merchant admin affiliate; do
    rm -rf apps/client/dist-\$p && cp -a ${BACKUP_DIR}/dist-\$p.bak apps/client/dist-\$p 2>/dev/null || true
  done
  systemctl restart portal-api && nginx -t && systemctl reload nginx
  # DB restore (DESTRUCTIVE — only if a migration broke data):
  #   psql "\$DATABASE_URL" < ${BACKUP_DIR}/portal-db.sql

This update touched ONLY the new portal server (app + internal nginx).
It did NOT touch the old NPM/Cloudflare server, services/api/.env, or any secret.
============================================================
ROLLBACK
