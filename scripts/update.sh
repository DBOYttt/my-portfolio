#!/usr/bin/env bash
# update.sh — Pull latest code and perform a rolling redeploy of the portfolio.
# DB and Nginx are not restarted; only app and career-ops are rebuilt and redeployed.
# If prisma/schema.prisma changed, db push is run automatically.
#
# Usage: scripts/update.sh [--no-build]
#   --no-build   Skip image rebuild (code pull only, no Docker operations)
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()     { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }
step()    { echo -e "\n${CYAN}── $* ──────────────────────────────────────${RESET}"; }

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/update.sh [--no-build]"
  echo ""
  echo "Pulls the latest code from origin/main and redeploys the portfolio."
  echo "DB and Nginx containers are NOT restarted — only app and career-ops."
  echo "Automatically runs 'prisma db push' if the schema has changed."
  echo ""
  echo "Options:"
  echo "  --no-build   Skip Docker image rebuild (code pull only)"
  exit 0
fi

NO_BUILD=false
if [[ "${1:-}" == "--no-build" ]]; then
  NO_BUILD=true
fi

cd "$REPO_DIR"

if [[ ! -f ".env" ]]; then
  die ".env not found. Run scripts/install.sh first."
fi

if ! command -v docker &>/dev/null; then
  die "docker not found."
fi

if ! docker info &>/dev/null; then
  die "Docker daemon is not running."
fi

# ── Check git state ───────────────────────────────────────────────────────────
step "Checking for updates"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  warn "Not on main branch (currently: $BRANCH). Proceeding anyway."
fi

git fetch origin main 2>/dev/null

BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
if [[ "$BEHIND" -eq 0 ]]; then
  success "Already up to date."
  if [[ "$NO_BUILD" == "true" ]]; then
    exit 0
  fi
  echo -n "No new commits. Rebuild and restart anyway? [y/N] "
  read -r CONFIRM
  if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    info "Nothing to do."
    exit 0
  fi
else
  info "New commits to apply:"
  git log HEAD..origin/main --oneline
  echo ""
  echo -n "Apply and redeploy? [Y/n] "
  read -r CONFIRM
  if [[ "$CONFIRM" == "n" || "$CONFIRM" == "N" ]]; then
    info "Aborted."
    exit 0
  fi
fi

# ── Record schema hash before pull ───────────────────────────────────────────
SCHEMA_BEFORE=$(sha256sum prisma/schema.prisma 2>/dev/null | awk '{print $1}' || echo "")

# ── Pull ──────────────────────────────────────────────────────────────────────
step "Pulling code"
git pull --ff-only origin main
git submodule update --init career-ops
success "Code updated."

SCHEMA_AFTER=$(sha256sum prisma/schema.prisma 2>/dev/null | awk '{print $1}' || echo "")

# ── Build ─────────────────────────────────────────────────────────────────────
if [[ "$NO_BUILD" == "false" ]]; then
  step "Rebuilding images"
  docker compose build app career-ops
  success "Images rebuilt."
fi

# ── Apply schema changes ──────────────────────────────────────────────────────
if [[ "$SCHEMA_BEFORE" != "$SCHEMA_AFTER" && -n "$SCHEMA_BEFORE" ]]; then
  step "Schema changed — applying db push"
  warn "prisma/schema.prisma changed. Running db push..."
  docker compose run --rm app npx prisma db push
  success "Schema applied."
fi

# ── Rolling restart (app + career-ops only) ───────────────────────────────────
if [[ "$NO_BUILD" == "false" ]]; then
  step "Rolling restart"
  docker compose up -d --no-deps app career-ops
  info "DB and Nginx were not restarted."

  TIMEOUT=90
  ELAPSED=0
  info "Waiting for app to become healthy..."
  while true; do
    STATUS=$(docker compose ps --format json 2>/dev/null \
      | python3 -c "import sys,json; data=[json.loads(l) for l in sys.stdin if l.strip()]; app=[s for s in data if 'app' in s.get('Name','')]; print(app[0].get('Health','') if app else 'missing')" 2>/dev/null || echo "checking")
    if [[ "$STATUS" == "healthy" ]]; then
      success "App is healthy."
      break
    fi
    if [[ $ELAPSED -ge $TIMEOUT ]]; then
      warn "App did not reach healthy in ${TIMEOUT}s (status: $STATUS)"
      echo "Check: docker compose logs app --tail 50"
      break
    fi
    echo -ne "\r  ${ELAPSED}s — status: $STATUS   "
    sleep 3
    ELAPSED=$((ELAPSED + 3))
  done
  echo ""
fi

# ── Final status ──────────────────────────────────────────────────────────────
step "Status"
docker compose ps
