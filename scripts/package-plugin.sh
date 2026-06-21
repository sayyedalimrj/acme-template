#!/usr/bin/env bash
#
# package-plugin.sh — build a distributable .zip of the WordPress companion plugin.
#
# The generated archive is written to wordpress-plugin/build/ which is gitignored: the zip is a
# BUILD ARTIFACT and must NEVER be committed. Only the plugin source is tracked in git.
#
# It packages the runtime PHP + assets only (the main plugin file, includes/, assets/, languages/,
# README/SECURITY/uninstall). It intentionally EXCLUDES the TypeScript contract sources (src/),
# examples/, and tooling config — those are repo-only and not part of the installable plugin.
#
# Usage:  ./scripts/package-plugin.sh
# Output: wordpress-plugin/build/<slug>-<version>.zip
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="${REPO_ROOT}/wordpress-plugin"
MAIN_FILE="${PLUGIN_DIR}/wordpress-commerce-os-companion.php"
SLUG="wordpress-commerce-os-companion"
BUILD_DIR="${PLUGIN_DIR}/build"

if [[ ! -f "${MAIN_FILE}" ]]; then
  echo "ERROR: plugin main file not found: ${MAIN_FILE}" >&2
  exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
  echo "ERROR: 'zip' is not installed. Install it (e.g. 'apt-get install zip') and retry." >&2
  exit 1
fi

# Read the version from the plugin header (e.g. "Version:  1.0.0").
VERSION="$(grep -iE '^[[:space:]]*\*[[:space:]]*Version:' "${MAIN_FILE}" | head -n1 | sed -E 's/.*Version:[[:space:]]*//' | tr -d '[:space:]')"
VERSION="${VERSION:-0.0.0}"

STAGE="$(mktemp -d)"
trap 'rm -rf "${STAGE}"' EXIT
DEST="${STAGE}/${SLUG}"
mkdir -p "${DEST}"

# Copy only the installable plugin files into the staging directory under the plugin slug folder
# (WordPress expects the plugin folder name inside the zip).
cp "${MAIN_FILE}" "${DEST}/"
[[ -f "${PLUGIN_DIR}/uninstall.php" ]] && cp "${PLUGIN_DIR}/uninstall.php" "${DEST}/"
[[ -f "${PLUGIN_DIR}/README.md" ]] && cp "${PLUGIN_DIR}/README.md" "${DEST}/"
[[ -f "${PLUGIN_DIR}/SECURITY.md" ]] && cp "${PLUGIN_DIR}/SECURITY.md" "${DEST}/"
for sub in includes assets languages; do
  [[ -d "${PLUGIN_DIR}/${sub}" ]] && cp -R "${PLUGIN_DIR}/${sub}" "${DEST}/"
done

mkdir -p "${BUILD_DIR}"
OUT="${BUILD_DIR}/${SLUG}-${VERSION}.zip"
rm -f "${OUT}"
(
  cd "${STAGE}"
  zip -rq "${OUT}" "${SLUG}"
)

echo "Built plugin package: ${OUT}"
echo "NOTE: this is a build artifact (gitignored) — do not commit it."
