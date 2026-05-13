#!/usr/bin/env bash
# setup-career-ops.sh — Initialise the career-ops git submodule.
# Run this once after cloning or when career-ops is updated.
#
# Usage: scripts/setup-career-ops.sh
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; RESET='\033[0m'
info()    { echo -e "${CYAN}$*${RESET}"; }
success() { echo -e "${GREEN}✓ $*${RESET}"; }
warn()    { echo -e "${YELLOW}⚠ $*${RESET}"; }
die()     { echo -e "${RED}✗ $*${RESET}" >&2; exit 1; }

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/setup-career-ops.sh"
  echo ""
  echo "Initialises the career-ops git submodule:"
  echo "  • git submodule update --init career-ops"
  echo "  • npm install --omit=dev inside career-ops/"
  echo "  • npx playwright install chromium --with-deps"
  echo "  • Scaffolds career-ops/config/profile.yml and career-ops/cv.md if absent"
  exit 0
fi

cd "$REPO_DIR"

info "Updating career-ops submodule..."
git submodule update --init career-ops
success "Submodule ready."

info "Installing career-ops npm dependencies..."
(cd career-ops && npm install --omit=dev)
success "npm install done."

info "Installing Playwright Chromium (downloads ~150 MB, may take a few minutes)..."
if (cd career-ops && npx playwright install chromium --with-deps); then
  success "Playwright Chromium installed."
else
  warn "Playwright install failed — career-ops CV publish may not work."
fi

if [[ ! -f "career-ops/config/profile.yml" ]]; then
  if [[ -f "career-ops/config/profile.example.yml" ]]; then
    cp career-ops/config/profile.example.yml career-ops/config/profile.yml
    success "Scaffolded career-ops/config/profile.yml from example."
  else
    warn "career-ops/config/profile.example.yml not found — create career-ops/config/profile.yml manually."
  fi
else
  info "career-ops/config/profile.yml already exists — not overwritten."
fi

if [[ ! -f "career-ops/cv.md" ]]; then
  if [[ -f "career-ops/cv.example.md" ]]; then
    cp career-ops/cv.example.md career-ops/cv.md
    success "Scaffolded career-ops/cv.md from example."
  else
    echo "# CV" > career-ops/cv.md
    success "Created empty career-ops/cv.md."
  fi
else
  info "career-ops/cv.md already exists — not overwritten."
fi

echo ""
success "career-ops is ready."
warn "ACTION NEEDED: Fill in career-ops/config/profile.yml and career-ops/cv.md with your real details before using the Career panel."
