#!/usr/bin/env bash
# setup-cron.sh — Install cron entries for all portfolio AI agents.
# Reads secrets from .env at runtime via run-agent.sh (no hardcoded keys in crontab).
# Idempotent: removes any existing portfolio-agent block before writing a fresh one.
#
# Usage: scripts/setup-cron.sh [--dir <repo-path>]
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()     { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }

# ── Help ──────────────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/setup-cron.sh [--dir <repo-path>]"
  echo ""
  echo "Installs cron entries for all 7 portfolio AI agents."
  echo "Removes any existing portfolio-agent cron block before writing a new one."
  echo "Agents source secrets from .env at runtime — no API keys appear in crontab."
  echo ""
  echo "Options:"
  echo "  --dir <path>   Path to portfolio repo root (default: auto-detected)"
  echo ""
  echo "Log files are written to ~/logs/agent-<name>.log"
  exit 0
fi

# ── Determine repo dir ────────────────────────────────────────────────────────
PORTFOLIO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir) PORTFOLIO_DIR="$2"; shift 2 ;;
    *) die "Unknown option: $1. Run --help for usage." ;;
  esac
done

if [[ ! -f "$PORTFOLIO_DIR/.env" ]]; then
  die ".env not found at $PORTFOLIO_DIR/.env — run scripts/install.sh first."
fi

RUN_AGENT="$PORTFOLIO_DIR/scripts/run-agent.sh"
if [[ ! -f "$RUN_AGENT" ]]; then
  die "run-agent.sh not found at $RUN_AGENT"
fi

# Ensure run-agent.sh is executable
chmod +x "$RUN_AGENT"

# ── Create log directory ──────────────────────────────────────────────────────
mkdir -p "$HOME/logs"
success "Log directory: ~/logs"

# ── Build new cron block ──────────────────────────────────────────────────────
CRON_BLOCK="# ── Portfolio Agents (managed by scripts/setup-cron.sh) ──────────────────────
PORTFOLIO_DIR=${PORTFOLIO_DIR}

# GitHub Summarizer — daily 07:00
0 7 * * *   cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh github-summarizer >> ~/logs/agent-github.log 2>&1

# Skills Inference — daily 07:05
5 7 * * *   cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh skills-inference >> ~/logs/agent-skills.log 2>&1

# GitHub Project Importer — Mon 07:10
10 7 * * 1  cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh github-project-importer >> ~/logs/agent-importer.log 2>&1

# Blog Suggester — Mon 08:00
0 8 * * 1   cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh blog-suggester >> ~/logs/agent-blog.log 2>&1

# Robotics News — Wed 08:00
0 8 * * 3   cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh robotics-news >> ~/logs/agent-robotics.log 2>&1

# Brand Monitor — Fri 08:00
0 8 * * 5   cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh brand-monitor >> ~/logs/agent-brand.log 2>&1

# Platform Sync — Sun 09:00
0 9 * * 7   cd \$PORTFOLIO_DIR && bash scripts/run-agent.sh platform-sync >> ~/logs/agent-platform.log 2>&1
# ── End Portfolio Agents ──────────────────────────────────────────────────────"

# ── Remove existing portfolio-agent block and rewrite crontab ─────────────────
info "Removing existing portfolio-agent cron entries (if any)..."

EXISTING_CRON=$(crontab -l 2>/dev/null || true)

# Strip lines between the start and end markers (inclusive)
CLEANED_CRON=$(echo "$EXISTING_CRON" | awk '
  /# ── Portfolio Agents/ { skip=1 }
  skip && /# ── End Portfolio Agents/ { skip=0; next }
  !skip
')

# Write new crontab
{
  echo "$CLEANED_CRON"
  echo ""
  echo "$CRON_BLOCK"
} | crontab -

success "Cron entries installed (7 agents)"

echo ""
info "Scheduled agents:"
echo "  github-summarizer     → daily 07:00  → ~/logs/agent-github.log"
echo "  skills-inference      → daily 07:05  → ~/logs/agent-skills.log"
echo "  github-project-importer → Mon 07:10  → ~/logs/agent-importer.log"
echo "  blog-suggester        → Mon 08:00   → ~/logs/agent-blog.log"
echo "  robotics-news         → Wed 08:00   → ~/logs/agent-robotics.log"
echo "  brand-monitor         → Fri 08:00   → ~/logs/agent-brand.log"
echo "  platform-sync         → Sun 09:00   → ~/logs/agent-platform.log"
echo ""
info "Verify with:  crontab -l"
info "Run manually: cd $PORTFOLIO_DIR && bash scripts/run-agent.sh <name>"
