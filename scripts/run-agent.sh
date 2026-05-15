#!/usr/bin/env bash
# run-agent.sh — Sources .env and runs one portfolio AI agent.
# Used by cron entries so secrets never appear in crontab -l.
#
# Usage: scripts/run-agent.sh <agent-name>
#
# Agent names:
#   github-summarizer | skills-inference | github-project-importer
#   blog-suggester | robotics-news | brand-monitor | platform-sync
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

AGENTS="github-summarizer skills-inference github-project-importer blog-suggester robotics-news brand-monitor platform-sync"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  echo "Usage: scripts/run-agent.sh <agent-name>"
  echo ""
  echo "Sources \$REPO_DIR/.env and runs agents/<agent-name>.ts via npx tsx."
  echo ""
  echo "Agent names:"
  echo "  github-summarizer | skills-inference | github-project-importer"
  echo "  blog-suggester | robotics-news | brand-monitor | platform-sync"
  exit 0
fi

if [[ $# -lt 1 ]]; then
  echo "Error: agent name required." >&2
  echo "Run: scripts/run-agent.sh --help" >&2
  exit 1
fi

AGENT_NAME="$1"

# Validate agent name
if ! echo "$AGENTS" | grep -qw "$AGENT_NAME"; then
  echo "Error: unknown agent '$AGENT_NAME'" >&2
  echo "Valid agents: $AGENTS" >&2
  exit 1
fi

AGENT_FILE="$REPO_DIR/agents/${AGENT_NAME}.ts"
if [[ ! -f "$AGENT_FILE" ]]; then
  echo "Error: agent file not found: $AGENT_FILE" >&2
  exit 1
fi

ENV_FILE="$REPO_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env not found at $ENV_FILE" >&2
  echo "Run scripts/install.sh to set up the environment." >&2
  exit 1
fi

# Load environment variables from .env — safe KEY=VALUE-only parser (no shell execution)
while IFS='=' read -r _key _rest; do
  [[ -z "$_key" || "$_key" == \#* ]] && continue
  [[ "$_key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
  _val="${_rest%\"}"
  _val="${_val#\"}"
  _val="${_val%\'}"
  _val="${_val#\'}"
  export "$_key=$_val"
done < "$ENV_FILE"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set in .env" >&2
  exit 1
fi

# When running from the host, replace the Docker service hostname with localhost.
# .env uses postgres://...@db:5432/... (Docker network) which is unreachable outside containers.
DATABASE_URL="${DATABASE_URL//@db:/@127.0.0.1:}"
export DATABASE_URL

TSX_BIN="$REPO_DIR/node_modules/.bin/tsx"
if [[ -x "$TSX_BIN" ]]; then
  exec "$TSX_BIN" "$AGENT_FILE"
else
  exec npx --no-install tsx "$AGENT_FILE"
fi
