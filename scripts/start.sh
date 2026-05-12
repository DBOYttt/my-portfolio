#!/usr/bin/env bash
# start.sh — Start all portfolio Docker services and wait for healthy status.
#
# Usage: scripts/start.sh [--build]
#   --build   Rebuild images before starting
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()     { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }
step()    { echo -e "\n${CYAN}── $* ──────────────────────────────────────${RESET}"; }

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/start.sh [--build]"
  echo ""
  echo "Starts all portfolio services (app, db, nginx, career-ops) via Docker Compose."
  echo "Waits up to 90 seconds for the app service to report healthy."
  echo ""
  echo "Options:"
  echo "  --build   Rebuild Docker images before starting"
  exit 0
fi

BUILD_FLAG=""
if [[ "${1:-}" == "--build" ]]; then
  BUILD_FLAG="--build"
fi

cd "$REPO_DIR"

# ── Checks ────────────────────────────────────────────────────────────────────
if [[ ! -f ".env" ]]; then
  die ".env not found. Run scripts/install.sh first."
fi

if ! command -v docker &>/dev/null; then
  die "docker not found. Run scripts/install.sh to install prerequisites."
fi

if ! docker info &>/dev/null; then
  die "Docker daemon is not running. Start it with: sudo systemctl start docker"
fi

# ── Start ─────────────────────────────────────────────────────────────────────
step "Starting services"
if [[ -n "$BUILD_FLAG" ]]; then
  info "Building images first..."
  docker compose build
fi

docker compose up -d

# ── Wait for app health ───────────────────────────────────────────────────────
step "Waiting for app to become healthy"
TIMEOUT=90
ELAPSED=0
while true; do
  STATUS=$(docker compose ps --format json 2>/dev/null \
    | python3 -c "import sys,json; data=[json.loads(l) for l in sys.stdin if l.strip()]; app=[s for s in data if 'app' in s.get('Name','')]; print(app[0].get('Health','') if app else 'missing')" 2>/dev/null || echo "checking")

  if [[ "$STATUS" == "healthy" ]]; then
    success "App is healthy"
    break
  fi

  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    warn "App did not reach healthy state after ${TIMEOUT}s (current: $STATUS)"
    echo "Check logs with: docker compose logs app --tail 50"
    break
  fi

  echo -ne "\r  waiting... ${ELAPSED}s (status: ${STATUS})   "
  sleep 3
  ELAPSED=$((ELAPSED + 3))
done
echo ""

# ── Status table ──────────────────────────────────────────────────────────────
step "Service status"
docker compose ps
echo ""

# Quick HTTP check
HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [[ "$HTTP" == "200" ]]; then
  success "Homepage responding: HTTP $HTTP"
else
  warn "Homepage check: HTTP $HTTP (services may still be starting)"
fi
