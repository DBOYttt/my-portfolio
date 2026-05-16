# CLI Scripts — Usage Guide

All scripts live in `scripts/` and target **Debian 10+ / Ubuntu 22.04+** (apt-based).
Every script accepts `--help` for a quick reference.

---

## Quick reference

| Script | One-liner |
|---|---|
| `scripts/install.sh` | First-time setup on a fresh server |
| `scripts/start.sh` | Start all services |
| `scripts/stop.sh` | Stop all services |
| `scripts/update.sh` | Pull latest code and redeploy |
| `scripts/status.sh` | Health check all services |
| `scripts/setup-cron.sh` | Install / refresh AI agent cron jobs |
| `scripts/run-agent.sh <name>` | Run one AI agent manually |
| `scripts/setup-career-ops.sh` | Initialise the career-ops submodule |

---

## `scripts/install.sh` — First-time installation

Run once on a brand-new server. Works even if Docker and Node.js are already installed — those steps are skipped automatically.

```bash
bash scripts/install.sh
```

With a custom install directory (default is `~/projects/my-portfolio`):

```bash
bash scripts/install.sh --dir /opt/portfolio
```

If you clone the repo first and then run the script from inside it, the clone step is skipped:

```bash
git clone git@github.com:yourusername/my-portfolio.git
cd my-portfolio
bash scripts/install.sh
```

### What it does

```
Step 1 — Preflight       Checks OS (Debian/Ubuntu only), sudo access, Docker daemon
Step 2 — Prerequisites   Installs git, Docker CE, Node.js 20 LTS via apt (skipped if present)
Step 3 — Repository      Clones repo or runs git pull if already present
Step 4 — Environment     Interactive .env wizard — prompts for each value, auto-generates secrets
Step 5 — career-ops      Submodule init, npm install, Playwright Chromium download
Step 6 — Deploy          docker compose build → db push → db seed → docker compose up -d
Step 7 — Cron            Installs 7 AI agent cron entries (calls setup-cron.sh)
Step 8 — Smoke test      curl checks for /, /admin, robots.txt
```

### Environment wizard (Step 4)

You are prompted for each value. Press **Enter** to accept the shown default. Secrets are auto-generated with `openssl rand` if you leave them blank.

| Variable | Behaviour |
|---|---|
| `POSTGRES_PASSWORD` | Auto-generated if blank |
| `AUTH_SECRET` | Auto-generated if blank |
| `AUTH_URL` | Defaults to `http://<server-ip>` |
| `ADMIN_EMAIL` | Required — re-prompted until filled |
| `ADMIN_PASSWORD` | Required, hidden input, min 12 chars |
| `ANTHROPIC_API_KEY` | Required for AI agents; warning shown if skipped |
| `GITHUB_USERNAME` | Required for GitHub agents |
| `GITHUB_TOKEN` | Optional — increases API rate limits |
| `CONTACT_EMAIL` | Optional — contact form delivery address |
| `RESEND_API_KEY` | Optional — required for email delivery |
| `NEXT_PUBLIC_BASE_URL` | Defaults to `http://<server-ip>` |
| `CAREER_OPS_INTERNAL_SECRET` | Auto-generated if blank |

After install, the admin panel is at `http://<server-ip>/admin`.

---

## `scripts/start.sh` — Start services

```bash
# Start all services
bash scripts/start.sh

# Rebuild images first, then start (use after code changes)
bash scripts/start.sh --build
```

Waits up to 90 seconds for the `app` container to report healthy, then prints the service table and a quick HTTP check.

---

## `scripts/stop.sh` — Stop services

```bash
# Stop containers (data is preserved)
bash scripts/stop.sh

# Stop containers AND delete all data (postgres_data, cv_output volumes)
# Prompts: "Type YES to confirm"
bash scripts/stop.sh --volumes
```

`--volumes` is destructive — all database records and uploaded files are permanently deleted. Use it only when resetting to a clean state.

---

## `scripts/update.sh` — Pull and redeploy

```bash
# Show pending commits, confirm, pull, rebuild, rolling restart
bash scripts/update.sh

# Pull code only — no Docker rebuild or restart
bash scripts/update.sh --no-build
```

What happens:
1. `git fetch origin main` — shows how many commits are behind
2. Prompts for confirmation before proceeding
3. `git pull --ff-only` + `git submodule update --init career-ops`
4. `docker compose build app career-ops` (unless `--no-build`)
5. `docker compose up -d --no-deps app career-ops` — rolling restart, DB and Nginx are untouched
6. If `prisma/schema.prisma` changed since the last pull, `prisma db push` is run automatically

---

## `scripts/status.sh` — Health check

```bash
bash scripts/status.sh
```

Checks:
- Docker container states (healthy / running / unhealthy)
- HTTP endpoints: `GET /` → 200, `GET /admin` → 307, `GET /api/contact` → 405
- `robots.txt` disallows `/admin`
- PostgreSQL `pg_isready`
- career-ops `/health` endpoint
- Named volume disk usage

If any container is unhealthy, its last 50 log lines are printed.

Exit codes: `0` all checks passed · `1` one or more checks failed.

---

## `scripts/setup-cron.sh` — AI agent cron jobs

```bash
# Auto-detect repo path from script location
bash scripts/setup-cron.sh

# Explicit repo path
bash scripts/setup-cron.sh --dir /opt/portfolio
```

Installs 7 cron entries for the portfolio AI agents. The script is **idempotent** — it removes any existing portfolio-agent block (including the old format with hardcoded API keys) before writing a clean new block.

After running, `crontab -l` shows entries like:

```
PORTFOLIO_DIR=/home/diboy/projects/my-portfolio

0 7 * * *   cd $PORTFOLIO_DIR && bash scripts/run-agent.sh github-summarizer >> ~/logs/agent-github.log 2>&1
5 7 * * *   cd $PORTFOLIO_DIR && bash scripts/run-agent.sh skills-inference >> ~/logs/agent-skills.log 2>&1
...
```

No API keys or database passwords appear in the crontab. All secrets are read from `.env` at runtime by `run-agent.sh`.

### Agent schedule

| Agent | When | Log file |
|---|---|---|
| `github-summarizer` | Daily 07:00 | `~/logs/agent-github.log` |
| `skills-inference` | Daily 07:05 | `~/logs/agent-skills.log` |
| `github-project-importer` | Mon 07:10 | `~/logs/agent-importer.log` |
| `blog-suggester` | Mon 08:00 | `~/logs/agent-blog.log` |
| `robotics-news` | Wed 08:00 | `~/logs/agent-robotics.log` |
| `brand-monitor` | Fri 08:00 | `~/logs/agent-brand.log` |
| `platform-sync` | Sun 09:00 | `~/logs/agent-platform.log` |

---

## `scripts/run-agent.sh` — Run an agent manually

```bash
bash scripts/run-agent.sh github-summarizer
bash scripts/run-agent.sh skills-inference
bash scripts/run-agent.sh github-project-importer
bash scripts/run-agent.sh blog-suggester
bash scripts/run-agent.sh robotics-news
bash scripts/run-agent.sh brand-monitor
bash scripts/run-agent.sh platform-sync
```

This is the same script the cron entries use. It sources `.env` before calling `npx tsx agents/<name>.ts`, so all environment variables are loaded from the single `.env` file.

Run from inside the repo directory (or from anywhere — the script locates the repo via its own path):

```bash
cd ~/projects/my-portfolio
bash scripts/run-agent.sh blog-suggester
```

Output goes to stdout. To append to the same log file the cron job uses:

```bash
bash scripts/run-agent.sh blog-suggester >> ~/logs/agent-blog.log 2>&1
```

---

## `scripts/setup-career-ops.sh` — career-ops submodule

```bash
bash scripts/setup-career-ops.sh
```

Run once after cloning, or after a `git submodule update`. Does:
1. `git submodule update --init career-ops`
2. `npm install --omit=dev` inside `career-ops/`
3. `npx playwright install chromium --with-deps`
4. Scaffolds `career-ops/config/profile.yml` and `career-ops/cv.md` from examples if absent

After running, fill in `career-ops/config/profile.yml` with your job preferences and `career-ops/cv.md` with your base CV before using the Career panel.

---

## Common workflows

### Deploy to a fresh server

```bash
# 1. SSH into the server
ssh diboy@192.168.0.104

# 2. Clone repo (or let install.sh clone it)
git clone git@github.com:yourusername/my-portfolio.git ~/projects/my-portfolio
cd ~/projects/my-portfolio

# 3. Run installer — follow the prompts
bash scripts/install.sh

# 4. Verify everything is healthy
bash scripts/status.sh
```

### Deploy a code update

```bash
cd ~/projects/my-portfolio
bash scripts/update.sh
```

### Restart after a server reboot

```bash
cd ~/projects/my-portfolio
bash scripts/start.sh
```

### Check what's wrong

```bash
bash scripts/status.sh              # overview + HTTP checks
docker compose logs app --tail 100  # app logs
docker compose logs db --tail 50    # DB logs
cat ~/logs/agent-github.log         # agent run logs
```

### Full reset (wipes all data)

```bash
bash scripts/stop.sh --volumes      # type YES when prompted
bash scripts/start.sh               # starts fresh with empty DB
```

### Refresh cron entries after updating the repo path

```bash
bash scripts/setup-cron.sh --dir /new/path/to/my-portfolio
```

---

## Troubleshooting

**`Docker daemon is not running`**
```bash
sudo systemctl start docker
sudo systemctl enable docker   # auto-start on reboot
```

**`Permission denied` when running docker commands**

Your user was just added to the `docker` group. Log out and log back in, or use:
```bash
newgrp docker
```

**App container stuck in `starting` state**
```bash
docker compose logs app --tail 100
# Common causes: DATABASE_URL wrong, DB not yet healthy, port conflict
```

**Agent fails with `DATABASE_URL is not set`**
```bash
grep DATABASE_URL ~/projects/my-portfolio/.env
# Ensure the line is not commented out and has a value
```

**`crontab -l` still shows old entries with hardcoded API keys**
```bash
bash scripts/setup-cron.sh
# Re-running is safe — it removes and rewrites the portfolio agent block
```
