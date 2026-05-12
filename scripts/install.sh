#!/usr/bin/env bash
# install.sh — First-time installation of the portfolio platform.
#
# Covers:
#   1. Preflight checks (OS, sudo, Docker daemon)
#   2. Install prerequisites (Docker CE, Node.js 20 LTS, git) via apt
#   3. Clone repository (or update if already cloned)
#   4. Interactive .env wizard (auto-generates secrets)
#   5. career-ops submodule setup
#   6. Docker build + DB migrate + seed + start all services
#   7. Cron job installation for 7 AI agents
#   8. Smoke test (HTTP checks)
#
# Usage: bash scripts/install.sh [--dir <path>]
#   --dir <path>   Install path (default: ~/projects/my-portfolio)
#
# Target platforms: Debian 10+, Ubuntu 22.04+ (apt-based)
# Tested on: Ubuntu 24.04.4 LTS

set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()     { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}════ $* ════${RESET}"; }
prompt()  { echo -e "${YELLOW}$*${RESET}"; }

REPO_URL="git@github.com:DBOYttt/my-portfolio.git"
DEFAULT_INSTALL_DIR="$HOME/projects/my-portfolio"

# ── Help ──────────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo ""
  echo -e "${BOLD}Portfolio Platform — First-Time Installer${RESET}"
  echo ""
  echo "Usage: bash scripts/install.sh [--dir <path>]"
  echo ""
  echo "Steps:"
  echo "  1. Preflight   — OS check, sudo, Docker daemon"
  echo "  2. Prereqs     — Install git, Docker CE, Node.js 20 via apt (skipped if present)"
  echo "  3. Clone       — Clone repo (or git pull if already cloned)"
  echo "  4. Environment — Interactive .env wizard with auto-generated secrets"
  echo "  5. career-ops  — Submodule init, npm install, Playwright Chromium"
  echo "  6. Deploy      — docker compose build + db push + seed + up"
  echo "  7. Cron        — Install 7 AI agent cron entries"
  echo "  8. Smoke test  — Curl checks for /, /admin, robots.txt"
  echo ""
  echo "Options:"
  echo "  --dir <path>   Target install directory (default: ~/projects/my-portfolio)"
  echo ""
  echo "After install:"
  echo "  scripts/start.sh    — start services"
  echo "  scripts/stop.sh     — stop services"
  echo "  scripts/status.sh   — check health"
  echo "  scripts/update.sh   — pull + redeploy"
  exit 0
fi

# ── Parse args ────────────────────────────────────────────────────────────────
INSTALL_DIR="$DEFAULT_INSTALL_DIR"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    *) die "Unknown option: $1. Run --help for usage." ;;
  esac
done

# ── Detect if running from inside a cloned repo ───────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SELF_REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

IN_REPO=false
if [[ -f "$SELF_REPO/package.json" ]] && grep -q '"name"' "$SELF_REPO/package.json" 2>/dev/null; then
  IN_REPO=true
  INSTALL_DIR="$SELF_REPO"
fi

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║   Portfolio Platform — First-Time Install  ║${RESET}"
echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════╝${RESET}"
echo ""
echo "This script will:"
echo "  • Install Docker CE, Node.js 20 LTS, and git (skipped if present)"
echo "  • Clone or update the portfolio repository to: $INSTALL_DIR"
echo "  • Guide you through configuring .env"
echo "  • Build Docker images and deploy all services"
echo "  • Install AI agent cron jobs"
echo "  • Run smoke tests"
echo ""
echo "Estimated time: 5–15 minutes (image build is the longest step)"
echo ""
echo -n "Continue? [Y/n] "
read -r CONFIRM
if [[ "$CONFIRM" == "n" || "$CONFIRM" == "N" ]]; then
  info "Aborted."
  exit 0
fi

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 1 — Preflight"
# ═══════════════════════════════════════════════════════════════════════════════

# OS check — must be Debian/Ubuntu family
if [[ -f /etc/os-release ]]; then
  # shellcheck source=/dev/null
  source /etc/os-release
  if [[ "$ID" != "debian" && "$ID" != "ubuntu" && "${ID_LIKE:-}" != *"debian"* ]]; then
    die "Unsupported OS: $PRETTY_NAME. This script requires Debian or Ubuntu."
  fi
  success "OS: $PRETTY_NAME"
else
  die "/etc/os-release not found. Cannot detect OS."
fi

# Sudo check — install.sh needs sudo for apt
if ! sudo -n true 2>/dev/null; then
  warn "This script requires sudo for installing packages."
  echo "You may be prompted for your password."
  sudo true || die "sudo failed. Cannot install prerequisites."
fi
success "sudo: OK"

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 2 — Install prerequisites"
# ═══════════════════════════════════════════════════════════════════════════════

# git
if command -v git &>/dev/null; then
  success "git: $(git --version)"
else
  info "Installing git..."
  sudo apt-get update -qq && sudo apt-get install -y git
  success "git installed: $(git --version)"
fi

# Docker
if command -v docker &>/dev/null; then
  success "Docker: $(docker --version | head -1)"
else
  info "Installing Docker CE..."
  sudo apt-get update -qq
  sudo apt-get install -y ca-certificates curl gnupg lsb-release

  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg \
    | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -qq
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  success "Docker installed: $(docker --version | head -1)"
fi

# Add user to docker group if needed
if ! groups | grep -q docker; then
  warn "Adding $USER to the docker group..."
  sudo usermod -aG docker "$USER"
  warn "You may need to log out and log back in for docker group to take effect."
  warn "To continue without re-login, this session will use: sudo docker"
  DOCKER_CMD="sudo docker"
else
  DOCKER_CMD="docker"
  success "docker group: OK"
fi

# Docker Compose (v2 plugin check)
if ! docker compose version &>/dev/null 2>&1; then
  info "Docker Compose plugin not found, installing..."
  sudo apt-get install -y docker-compose-plugin
fi
success "Docker Compose: $(docker compose version | head -1)"

# Ensure Docker daemon is running
if ! docker info &>/dev/null 2>&1; then
  info "Starting Docker daemon..."
  sudo systemctl enable docker --now
fi
success "Docker daemon: running"

# Node.js
NODE_OK=false
if command -v node &>/dev/null; then
  NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
  if [[ "$NODE_VER" -ge 20 ]]; then
    success "Node.js: $(node --version)"
    NODE_OK=true
  else
    warn "Node.js $(node --version) is too old (need ≥20). Upgrading..."
  fi
fi

if [[ "$NODE_OK" == "false" ]]; then
  info "Installing Node.js 20 LTS via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  success "Node.js installed: $(node --version)"
fi

# npm (bundled with node)
success "npm: $(npm --version)"

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 3 — Repository"
# ═══════════════════════════════════════════════════════════════════════════════

if [[ "$IN_REPO" == "true" ]]; then
  success "Already inside the repository at: $INSTALL_DIR"
  info "Pulling latest code..."
  git pull --ff-only 2>/dev/null || warn "git pull failed — continuing with current code."
else
  mkdir -p "$(dirname "$INSTALL_DIR")"
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    info "Repository already exists at $INSTALL_DIR — pulling latest..."
    git -C "$INSTALL_DIR" pull --ff-only 2>/dev/null || warn "git pull failed — continuing."
    success "Repository updated."
  else
    info "Cloning repository to $INSTALL_DIR..."
    git clone "$REPO_URL" --recurse-submodules "$INSTALL_DIR"
    success "Repository cloned."
  fi
fi

cd "$INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 4 — Environment configuration"
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
info "You will be prompted for each required configuration value."
info "Press Enter to accept the suggested default. Secrets are auto-generated if left blank."
echo ""

# Helper: read a value from .env
env_get() {
  local key="$1"
  local default="${2:-}"
  local current
  current=$(grep -E "^${key}=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)
  echo "${current:-$default}"
}

# Helper: write a key=value to .env (replaces existing line or appends)
env_set() {
  local key="$1"
  local value="$2"
  if grep -qE "^${key}=" .env 2>/dev/null; then
    # Use a temp file approach that works on both GNU and BSD sed
    local tmpfile
    tmpfile=$(mktemp)
    grep -vE "^${key}=" .env > "$tmpfile"
    echo "${key}=${value}" >> "$tmpfile"
    mv "$tmpfile" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

# Helper: prompt for a value
ask() {
  local key="$1"
  local label="$2"
  local default="$3"
  local secret="${4:-false}"
  local required="${5:-false}"

  local current
  current=$(env_get "$key" "$default")

  while true; do
    if [[ "$secret" == "true" ]]; then
      prompt "$label [hidden, press Enter to auto-generate if blank]:"
      read -rs INPUT
      echo ""
    else
      prompt "$label [default: ${current:-<none>}]:"
      read -r INPUT
    fi

    local value="${INPUT:-$current}"

    if [[ "$required" == "true" && -z "$value" ]]; then
      warn "This field is required."
      current=""
      continue
    fi

    echo "$value"
    return
  done
}

# Copy template if .env doesn't exist
if [[ ! -f ".env" ]]; then
  cp .env.example .env
  info "Created .env from .env.example"
fi

DEFAULT_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

# POSTGRES_PASSWORD
CURRENT=$(env_get "POSTGRES_PASSWORD" "")
if [[ -z "$CURRENT" ]]; then CURRENT=$(openssl rand -hex 16); fi
prompt "PostgreSQL password [default: auto-generated]:"
read -rs PG_PASS_INPUT; echo ""
PG_PASS="${PG_PASS_INPUT:-$CURRENT}"
env_set "POSTGRES_PASSWORD" "$PG_PASS"
success "POSTGRES_PASSWORD set"

# AUTH_SECRET
CURRENT=$(env_get "AUTH_SECRET" "")
if [[ -z "$CURRENT" ]]; then CURRENT=$(openssl rand -base64 32); fi
prompt "Auth secret [default: auto-generated]:"
read -rs AUTH_SEC_INPUT; echo ""
AUTH_SEC="${AUTH_SEC_INPUT:-$CURRENT}"
env_set "AUTH_SECRET" "$AUTH_SEC"
success "AUTH_SECRET set"

# AUTH_URL
CURRENT=$(env_get "AUTH_URL" "http://${DEFAULT_IP}")
prompt "Site URL for Auth.js callbacks [default: $CURRENT]:"
read -r INPUT; AUTH_URL_VAL="${INPUT:-$CURRENT}"
env_set "AUTH_URL" "$AUTH_URL_VAL"
success "AUTH_URL = $AUTH_URL_VAL"

# ADMIN_EMAIL
while true; do
  CURRENT=$(env_get "ADMIN_EMAIL" "admin@localhost")
  prompt "Admin email [default: $CURRENT]:"
  read -r INPUT; ADMIN_EMAIL_VAL="${INPUT:-$CURRENT}"
  [[ -n "$ADMIN_EMAIL_VAL" ]] && break
  warn "Admin email is required."
done
env_set "ADMIN_EMAIL" "$ADMIN_EMAIL_VAL"
success "ADMIN_EMAIL = $ADMIN_EMAIL_VAL"

# ADMIN_PASSWORD
while true; do
  prompt "Admin password (min 12 chars) [hidden]:"
  read -rs ADMIN_PASS_INPUT; echo ""
  if [[ ${#ADMIN_PASS_INPUT} -lt 12 ]]; then
    CURRENT=$(env_get "ADMIN_PASSWORD" "")
    if [[ -n "$CURRENT" && ${#CURRENT} -ge 12 ]]; then
      ADMIN_PASS_VAL="$CURRENT"
      info "(Keeping existing password)"
      break
    fi
    warn "Password must be at least 12 characters."
    continue
  fi
  ADMIN_PASS_VAL="$ADMIN_PASS_INPUT"
  break
done
env_set "ADMIN_PASSWORD" "$ADMIN_PASS_VAL"
success "ADMIN_PASSWORD set"

# ANTHROPIC_API_KEY
CURRENT=$(env_get "ANTHROPIC_API_KEY" "")
prompt "Anthropic API key (required for AI agents, leave blank to skip):"
read -rs ANT_INPUT; echo ""
ANT_VAL="${ANT_INPUT:-$CURRENT}"
env_set "ANTHROPIC_API_KEY" "$ANT_VAL"
[[ -n "$ANT_VAL" ]] && success "ANTHROPIC_API_KEY set" || warn "ANTHROPIC_API_KEY not set — AI agents will not work"

# GITHUB_USERNAME
CURRENT=$(env_get "GITHUB_USERNAME" "")
prompt "GitHub username [default: $CURRENT]:"
read -r INPUT; GH_USER="${INPUT:-$CURRENT}"
env_set "GITHUB_USERNAME" "$GH_USER"
[[ -n "$GH_USER" ]] && success "GITHUB_USERNAME = $GH_USER" || warn "GITHUB_USERNAME not set"

# GITHUB_TOKEN
CURRENT=$(env_get "GITHUB_TOKEN" "")
prompt "GitHub token (optional, increases rate limits) [hidden]:"
read -rs GH_TOK_INPUT; echo ""
GH_TOK="${GH_TOK_INPUT:-$CURRENT}"
env_set "GITHUB_TOKEN" "$GH_TOK"
[[ -n "$GH_TOK" ]] && success "GITHUB_TOKEN set" || info "GITHUB_TOKEN not set (optional)"

# CONTACT_EMAIL
CURRENT=$(env_get "CONTACT_EMAIL" "")
prompt "Contact form delivery email (optional) [default: $CURRENT]:"
read -r INPUT; CONTACT_VAL="${INPUT:-$CURRENT}"
env_set "CONTACT_EMAIL" "$CONTACT_VAL"
[[ -n "$CONTACT_VAL" ]] && success "CONTACT_EMAIL = $CONTACT_VAL" || info "CONTACT_EMAIL not set"

# RESEND_API_KEY
CURRENT=$(env_get "RESEND_API_KEY" "")
prompt "Resend API key (optional, required for contact emails) [hidden]:"
read -rs RESEND_INPUT; echo ""
RESEND_VAL="${RESEND_INPUT:-$CURRENT}"
env_set "RESEND_API_KEY" "$RESEND_VAL"
[[ -n "$RESEND_VAL" ]] && success "RESEND_API_KEY set" || info "RESEND_API_KEY not set"

# NEXT_PUBLIC_BASE_URL
CURRENT=$(env_get "NEXT_PUBLIC_BASE_URL" "http://${DEFAULT_IP}")
prompt "Public base URL (for sitemap/SEO) [default: $CURRENT]:"
read -r INPUT; BASE_URL="${INPUT:-$CURRENT}"
env_set "NEXT_PUBLIC_BASE_URL" "$BASE_URL"
success "NEXT_PUBLIC_BASE_URL = $BASE_URL"

# CAREER_OPS_INTERNAL_SECRET
CURRENT=$(env_get "CAREER_OPS_INTERNAL_SECRET" "")
if [[ -z "$CURRENT" ]]; then CURRENT=$(openssl rand -base64 32); fi
prompt "career-ops internal secret [default: auto-generated]:"
read -rs CAREER_SEC_INPUT; echo ""
CAREER_SEC="${CAREER_SEC_INPUT:-$CURRENT}"
env_set "CAREER_OPS_INTERNAL_SECRET" "$CAREER_SEC"
success "CAREER_OPS_INTERNAL_SECRET set"

# Summary (mask secrets)
echo ""
info "Configuration summary:"
echo "  AUTH_URL              = $(env_get AUTH_URL)"
echo "  ADMIN_EMAIL           = $(env_get ADMIN_EMAIL)"
echo "  ADMIN_PASSWORD        = ****"
echo "  ANTHROPIC_API_KEY     = $(env_get ANTHROPIC_API_KEY | sed 's/.\{8\}$/****/;s/^.\{8\}/sk-***/')"
echo "  GITHUB_USERNAME       = $(env_get GITHUB_USERNAME)"
echo "  CONTACT_EMAIL         = $(env_get CONTACT_EMAIL)"
echo "  NEXT_PUBLIC_BASE_URL  = $(env_get NEXT_PUBLIC_BASE_URL)"
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 5 — career-ops setup"
# ═══════════════════════════════════════════════════════════════════════════════

info "Initialising career-ops submodule..."
git submodule update --init career-ops

if [[ -d "career-ops" ]]; then
  info "Installing career-ops npm dependencies..."
  (cd career-ops && npm install --omit=dev --prefer-offline 2>/dev/null || npm install --omit=dev)
  success "career-ops: npm install done"

  info "Installing Playwright Chromium (this may take a few minutes)..."
  (cd career-ops && npx playwright install chromium --with-deps 2>/dev/null || true)
  success "Playwright Chromium ready"

  [[ -f "career-ops/config/profile.yml" ]] || \
    { cp career-ops/config/profile.example.yml career-ops/config/profile.yml 2>/dev/null || true; }
  [[ -f "career-ops/cv.md" ]] || \
    { echo "# CV" > career-ops/cv.md; }
  warn "ACTION NEEDED: Fill in career-ops/config/profile.yml and career-ops/cv.md before using the Career panel."
else
  warn "career-ops directory not found — skipping. Run 'git submodule update --init career-ops' manually."
fi

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 6 — Build and deploy"
# ═══════════════════════════════════════════════════════════════════════════════

info "Installing host npm dependencies (for npx prisma)..."
npm install --prefer-offline 2>/dev/null || npm install

info "Building Docker images (this takes several minutes on first run)..."
docker compose build

info "Starting database..."
docker compose up -d db
info "Waiting for database to be ready (up to 60s)..."
ELAPSED=0
DB_USER=$(grep -E "^POSTGRES_USER=" .env 2>/dev/null | cut -d= -f2 || echo "portfolio")
[[ -z "$DB_USER" ]] && DB_USER="portfolio"
while ! docker compose exec -T db pg_isready -U "$DB_USER" &>/dev/null 2>&1; do
  if [[ $ELAPSED -ge 60 ]]; then die "Database did not become ready in 60s."; fi
  echo -ne "\r  waiting... ${ELAPSED}s"
  sleep 2; ELAPSED=$((ELAPSED + 2))
done
echo ""; success "Database is ready."

info "Applying database schema..."
docker compose run --rm app npx prisma db push --skip-generate
success "Schema applied."

info "Creating admin user..."
docker compose run --rm app npm run db:seed
success "Admin user created."

info "Starting all services..."
docker compose up -d

info "Waiting for app to become healthy (up to 90s)..."
ELAPSED=0
while true; do
  STATUS=$(docker compose ps --format json 2>/dev/null \
    | python3 -c "import sys,json; data=[json.loads(l) for l in sys.stdin if l.strip()]; app=[s for s in data if 'app' in s.get('Name','')]; print(app[0].get('Health','') if app else 'missing')" 2>/dev/null || echo "checking")
  [[ "$STATUS" == "healthy" ]] && { success "App is healthy."; break; }
  if [[ $ELAPSED -ge 90 ]]; then
    warn "App health timeout — it may still be starting. Check: docker compose logs app --tail 50"
    break
  fi
  echo -ne "\r  ${ELAPSED}s — status: $STATUS   "
  sleep 3; ELAPSED=$((ELAPSED + 3))
done
echo ""

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 7 — Cron jobs"
# ═══════════════════════════════════════════════════════════════════════════════

mkdir -p "$HOME/logs"
bash "$INSTALL_DIR/scripts/setup-cron.sh" --dir "$INSTALL_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
step "Step 8 — Smoke test"
# ═══════════════════════════════════════════════════════════════════════════════

NGINX_PORT="80"
# Check override file for port
if [[ -f docker-compose.override.yml ]]; then
  OVERRIDE_PORT=$(grep -A3 "nginx:" docker-compose.override.yml | grep -o '"[0-9]*:80"' | head -1 | grep -o '^"[0-9]*' | tr -d '"' || echo "")
  [[ -n "$OVERRIDE_PORT" ]] && NGINX_PORT="$OVERRIDE_PORT"
fi
BASE="http://localhost:${NGINX_PORT}"

ALL_OK=true
smoke() {
  local url="$1"; local expected="$2"; local label="$3"
  local got; got=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if [[ "$got" == "$expected" ]]; then
    success "$label: HTTP $got"
  else
    warn "$label: expected $expected, got $got"
    ALL_OK=false
  fi
}

smoke "$BASE/"          "200" "Homepage       GET /"
smoke "$BASE/admin"     "307" "Admin redirect  GET /admin"
smoke "$BASE/api/contact" "405" "API guard       GET /api/contact"

ROBOTS=$(curl -s --max-time 5 "$BASE/robots.txt" 2>/dev/null || true)
if echo "$ROBOTS" | grep -q "Disallow: /admin"; then
  success "robots.txt: /admin is disallowed"
else
  warn "robots.txt: could not verify (may still be starting)"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║        Installation complete!             ║${RESET}"
echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════╝${RESET}"
echo ""
info "Admin panel:  $BASE/admin"
info "Login email:  $(env_get ADMIN_EMAIL)"
info "Login pass:   (the password you set in Step 4)"
echo ""
info "Next steps:"
echo "  1. Fill career-ops/config/profile.yml and career-ops/cv.md with your details"
echo "  2. Add skills and experience via the admin panel"
echo "  3. Review and publish the draft projects imported from GitHub"
echo ""
info "Management:"
echo "  scripts/start.sh    — start services"
echo "  scripts/stop.sh     — stop services"
echo "  scripts/status.sh   — check health"
echo "  scripts/update.sh   — pull + redeploy"
echo "  cat ~/logs/*.log    — agent log files"
echo ""
if [[ "$ALL_OK" != "true" ]]; then
  warn "Some smoke tests failed. Services may still be warming up."
  warn "Run 'scripts/status.sh' in a minute to recheck."
fi
