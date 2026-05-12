#!/usr/bin/env bash
# stop.sh — Stop all portfolio Docker services.
#
# Usage: scripts/stop.sh [--volumes]
#   --volumes   Also remove named volumes (postgres_data, cv_output) — DESTRUCTIVE
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()     { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/stop.sh [--volumes]"
  echo ""
  echo "Stops all portfolio Docker services."
  echo ""
  echo "Options:"
  echo "  --volumes   Also remove named volumes (postgres_data, cv_output)."
  echo "              DESTRUCTIVE — all database data will be permanently deleted."
  echo "              Requires typing YES to confirm."
  exit 0
fi

VOLUMES_FLAG=""
if [[ "${1:-}" == "--volumes" ]]; then
  warn "WARNING: --volumes will permanently delete all database data and uploaded files."
  echo -n "Type YES to confirm: "
  read -r CONFIRM
  if [[ "$CONFIRM" != "YES" ]]; then
    info "Aborted."
    exit 0
  fi
  VOLUMES_FLAG="--volumes"
fi

cd "$REPO_DIR"

if ! command -v docker &>/dev/null; then
  die "docker not found."
fi

if ! docker info &>/dev/null; then
  die "Docker daemon is not running."
fi

info "Stopping services..."
docker compose down $VOLUMES_FLAG

echo ""
success "All portfolio services stopped."
if [[ -n "$VOLUMES_FLAG" ]]; then
  warn "Volumes (postgres_data, cv_output) have been removed."
fi
