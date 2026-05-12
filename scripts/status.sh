#!/usr/bin/env bash
# status.sh — Health check all portfolio services.
# Shows Docker container states, HTTP endpoint checks, DB readiness, and volume disk usage.
#
# Usage: scripts/status.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
fail()    { echo -e "${RED}✗ $*${RESET}"; }
step()    { echo -e "\n${CYAN}── $* ──────────────────────────────────────${RESET}"; }

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/status.sh"
  echo ""
  echo "Checks health of all portfolio services:"
  echo "  - Docker container states"
  echo "  - HTTP endpoint responses (/, /admin, /api/contact)"
  echo "  - PostgreSQL readiness"
  echo "  - career-ops service health"
  echo "  - Named volume disk usage"
  echo ""
  echo "If a service is unhealthy, its last 50 log lines are printed."
  exit 0
fi

cd "$REPO_DIR"

if ! command -v docker &>/dev/null; then
  fail "docker not found."
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  fail "Docker daemon is not running."
  exit 1
fi

OVERALL_OK=true

# ── Container states ──────────────────────────────────────────────────────────
step "Container states"
docker compose ps
echo ""

# Collect container health statuses
check_container_health() {
  local name="$1"
  local status
  status=$(docker compose ps --format json 2>/dev/null \
    | python3 -c "
import sys, json
for line in sys.stdin:
  line = line.strip()
  if not line: continue
  try:
    s = json.loads(line)
    if '$name' in s.get('Name', ''):
      print(s.get('Health', s.get('State', 'unknown')))
      break
  except: pass
" 2>/dev/null || echo "unknown")
  echo "$status"
}

for SVC in app db nginx career-ops; do
  H=$(check_container_health "$SVC")
  if [[ "$H" == "healthy" || "$H" == "running" ]]; then
    success "$SVC: $H"
  elif [[ "$H" == "unknown" || "$H" == "" ]]; then
    warn "$SVC: not running"
    OVERALL_OK=false
  else
    fail "$SVC: $H"
    OVERALL_OK=false
    echo ""
    warn "Last 50 log lines for $SVC:"
    docker compose logs "$SVC" --tail 50 2>/dev/null || true
  fi
done

# ── HTTP endpoint checks ──────────────────────────────────────────────────────
step "HTTP endpoint checks"

check_http() {
  local url="$1"
  local expected="$2"
  local label="$3"
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  if [[ "$actual" == "$expected" ]]; then
    success "$label: HTTP $actual"
  else
    fail "$label: expected HTTP $expected, got HTTP $actual"
    OVERALL_OK=false
  fi
}

check_http "http://localhost/"          "200" "Homepage       GET /"
check_http "http://localhost/admin"     "307" "Admin redirect  GET /admin"
check_http "http://localhost/api/contact" "405" "API guard       GET /api/contact"

# Robots check
ROBOTS=$(curl -s --max-time 5 http://localhost/robots.txt 2>/dev/null || true)
if echo "$ROBOTS" | grep -q "Disallow: /admin"; then
  success "robots.txt: /admin is disallowed"
else
  fail "robots.txt: /admin disallow not found"
  OVERALL_OK=false
fi

# ── DB readiness ──────────────────────────────────────────────────────────────
step "Database"
# Read POSTGRES_USER from .env, default to 'portfolio'
PG_USER="portfolio"
if [[ -f ".env" ]]; then
  PG_USER=$(grep -E "^POSTGRES_USER=" .env 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "portfolio")
  [[ -z "$PG_USER" ]] && PG_USER="portfolio"
fi

if docker compose exec -T db pg_isready -U "$PG_USER" &>/dev/null 2>&1; then
  success "PostgreSQL is ready (user: $PG_USER)"
else
  fail "PostgreSQL is not accepting connections"
  OVERALL_OK=false
fi

# ── career-ops health ─────────────────────────────────────────────────────────
step "career-ops service"
CAREER_HEALTH=$(docker compose exec -T career-ops curl -s --max-time 3 http://localhost:4200/health 2>/dev/null || echo "unreachable")
if echo "$CAREER_HEALTH" | grep -qi "ok\|healthy\|running"; then
  success "career-ops health: $CAREER_HEALTH"
else
  warn "career-ops health endpoint: $CAREER_HEALTH"
fi

# ── Volume disk usage ─────────────────────────────────────────────────────────
step "Volume disk usage"
docker system df -v 2>/dev/null | grep -E "(postgres_data|cv_output|VOLUME)" || echo "  (no volumes found)"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ "$OVERALL_OK" == "true" ]]; then
  success "All checks passed."
else
  fail "One or more checks failed. See details above."
  exit 1
fi
