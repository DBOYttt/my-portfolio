# Personal Portfolio Platform

**Live preview → [diboy.dev](https://diboy.dev)**

> A self-hosted, full-stack portfolio platform with an admin panel, 7 AI agents, and a CV pipeline. Fork it, fill in your details, deploy it.

A two-layer platform:
- **Public portfolio** — Engineering Logbook aesthetic (dark mode default, bone-paper/serif design). Sections: About, Skills, Projects, Robotics, Experience, Blog, Contact
- **Private admin** — full content CRUD, markdown blog editor, 7 AI agents, career-ops CV pipeline, MCP server status

## Demo

https://github.com/user-attachments/assets/bc463825-92bb-479e-9deb-43f5d6bb7d13

---

## Quick Start

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
npm run dev
# → http://localhost:3000  — works immediately with mock data, no DB needed
```

To make it yours: run `/setup-portfolio` in Claude Code, or edit `src/lib/mock-data.ts` directly with your name, bio, links, and experience.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Auth.js v5 |
| Email | Resend |
| AI Agents | Anthropic Claude API |
| MCP Server | `@modelcontextprotocol/sdk` (stdio + HTTP/SSE) |
| Career-Ops | Express + Claude Code CLI (isolated Docker service) |
| Deployment | Docker Compose + Nginx |

---

## What You Need to Provide

The site runs in **mock mode** without a database — public pages work, admin does not. Add env vars progressively to unlock features.

### Required — admin panel + DB mode

| Item | Where to set it | Notes |
|---|---|---|
| PostgreSQL database | `DATABASE_URL` in `.env` | Must be a direct `postgres://` URL. See `.env.example`. |
| Auth secret | `AUTH_SECRET` in `.env` | Generate with `openssl rand -base64 32` |
| Admin email + password | `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` | Used by `npm run db:seed` to create your login |

### Required — contact form emails

| Item | Where to set it | Notes |
|---|---|---|
| Resend API key | `RESEND_API_KEY` in `.env` | Free tier: 3 000 emails/mo at resend.com |
| Your email address | `CONTACT_EMAIL` in `.env` | Where contact form submissions are delivered |

### Required — AI agents

| Item | Where to set it | Notes |
|---|---|---|
| Anthropic API key | `ANTHROPIC_API_KEY` in `.env` | Required for agent LLM summarization |
| GitHub username | `GITHUB_USERNAME` in `.env` | Used by the GitHub Summarizer agent |
| GitHub token | `GITHUB_TOKEN` in `.env` | Optional but avoids GitHub API rate limits |

### Optional — AI platform scraping

| Item | Where to set it | Notes |
|---|---|---|
| Twitter/X Bearer token | `TWITTER_BEARER_TOKEN` in `.env` | Optional — enables Platform Sync agent to pull X profile + recent tweets |
| Twitter username | `TWITTER_USERNAME` in `.env` | Your handle without `@` |

### Content — your actual information

| Item | What to do |
|---|---|
| Personal info | Run `/setup-portfolio` in Claude Code (recommended), or edit the `OWNER` object in `src/lib/mock-data.ts` directly — name, tagline, bio, social links, experience |
| Photo | Place at `public/profile.png` — About section shows it automatically |
| CV / resume | Managed via the admin **Career** panel (`/admin/career`). Fill `career-ops/config/profile.yml` and `career-ops/cv.md`, then use the Career panel to evaluate jobs and publish the master CV to `public/cv.pdf`. Manual PDF upload also available at `/admin/cv`. |
| Projects, skills, experience | Use the admin panel at `/admin` once DB is running, or edit `src/lib/mock-data.ts` for mock mode |

---

## Getting Started

### 1. Fork and clone

Fork on GitHub first, then clone your fork:

```bash
git clone https://github.com/yourusername/my-portfolio.git
cd my-portfolio
npm install
```

### 2. Try mock mode first (no DB needed)

```bash
npm run dev
# → http://localhost:3000  — public portfolio with mock content
```

### 3. Fill in your information

The fastest way is the `/setup-portfolio` Claude Code skill — it walks through each section interactively and rewrites `src/lib/mock-data.ts` in one go:

```bash
# In Claude Code (this repo):
/setup-portfolio
```

Or edit `src/lib/mock-data.ts` manually. The `OWNER` object controls name, bio, links, and contact details.

### 4. Set up the database (optional — for admin panel + agents)

```bash
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD

npm run db:push           # Apply schema
npm run db:seed           # Create admin user
npm run setup:career-ops  # Initialise career-ops submodule
npm run dev               # Now running against real DB
```

`DATABASE_URL` must be a direct `postgres://` connection string, e.g.:
```
DATABASE_URL="postgres://user:password@127.0.0.1:5432/portfolio"
```

### 5. Open the app

```
http://localhost:3000        — public portfolio
http://localhost:3000/admin  — admin panel (login with your seeded credentials)
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage (public portfolio)
│   ├── blog/                 # Blog listing and posts
│   ├── projects/             # Project case studies
│   ├── admin/                # Admin panel (auth-gated)
│   └── api/                  # API routes
├── components/
│   ├── public/               # Public-facing components
│   └── admin/                # Admin panel components
└── lib/
    ├── mock-data.ts          # All placeholder/personal content lives here
    └── prisma.ts             # Prisma client singleton
prisma/
├── schema.prisma             # Database schema
└── seed.ts                   # Admin user seeder
agents/                       # AI agent scripts (run via cron)
career-ops/                   # git submodule — job evaluation + CV targeting CLI
career-ops-server/            # Express HTTP wrapper for career-ops (Docker service)
mcp-server/                   # MCP server (stdio + HTTP/SSE transports)
```

---

## AI Agents

The platform ships several autonomous agents that run on a schedule (or on demand from the admin panel):

| Agent | Schedule | What it does |
|---|---|---|
| **GitHub Summarizer** | Weekly Mon | Summarises recent GitHub activity + profile gaps |
| **Robotics News** | Weekly | Pulls robotics industry news and summarises with Claude |
| **Blog Suggester** | Weekly | Suggests blog topics from your GitHub + post history |
| **Brand Monitor** | Weekly | Monitors mentions of your name/brand online |
| **Skills Inference** | Weekly Mon | Diffs GitHub repo languages against DB skills; produces an Apply-table (never auto-writes) |
| **GitHub Project Importer** | Weekly Mon | Suggests new portfolio projects from public repos not yet in DB |
| **Platform Sync** | Weekly Mon | Pulls GitHub profile + X/Twitter data (if configured) |

Run any agent manually:
```bash
npx tsx agents/skills-inference.ts
npx tsx agents/github-project-importer.ts
npx tsx agents/platform-sync.ts
```

Or use the "Run now" button on `/admin/agents`.

---

## Career-Ops

The platform includes a **career-ops** Docker service for job evaluation and CV targeting. It runs isolated from the main app (no access to the database or auth secrets) and is driven by Claude Code CLI.

**How it works:**
1. Fill `career-ops/config/profile.yml` with your job preferences and `career-ops/cv.md` with your base CV
2. From `/admin/career`, submit a job posting URL for evaluation
3. Career-ops scores the job against your profile using Claude
4. When satisfied, publish the master CV — it lands at `public/cv.pdf`

**HTTP endpoints** (internal, port 4200):
- `POST /evaluate` — start a job evaluation
- `GET /status/:jobId` — poll evaluation status
- `POST /cv/master` — generate master CV
- `POST /sync` — push profile + CV markdown from DB to career-ops
- `GET /pipeline` — full evaluation history

---

## MCP Server

The platform ships an MCP server that exposes all portfolio content to AI agents (Claude Desktop, Claude Code, n8n) over stdio or HTTP/SSE.

**9 read-only resources:** `portfolio://owner`, `portfolio://posts`, `portfolio://posts/{slug}`, `portfolio://projects`, `portfolio://projects/{slug}`, `portfolio://skills`, `portfolio://experience`, `portfolio://agent-reports`, `portfolio://cv`

**14 write tools:** create/update/delete posts and projects, add/remove skills, add experience, update owner info, run any agent, generate CV, list agents, get agent reports, delete agent reports

```bash
npm run mcp:stdio   # stdio transport (Claude Desktop / Claude Code)
npm run mcp:http    # HTTP/SSE transport (n8n / remote agents)
```

See `docs/MCP_SETUP.md` for full setup instructions.

---

## Implementation Phases

- **Milestone 1** — Foundation: Next.js setup, DB, auth, core portfolio sections ✅
- **Milestone 2** — Full portfolio: projects, experience, contact form, SEO ✅
- **Milestone 3** — Admin + Blog: CRUD editor, markdown, media uploads ✅
- **Milestone 4** — AI Agents, CV generator, skills inference, project importer, platform scraping ✅
- **Milestone 4.10** — Pre-deployment security audit: 39/39 checks passed ✅
- **Milestone 5** — Homelab deployment: Docker Compose, Nginx, PostgreSQL, cron agents ✅
- **Milestone 5.5** — Engineering Logbook redesign: bone-paper aesthetic, light/dark theme ✅
- **Milestone 6.5** — Admin panel audit & bug fixes ✅
- **Milestone 7** — MCP server (stdio + HTTP/SSE, 14 tools, Claude Desktop + n8n) ✅
- **Milestone 7.5** — Career-ops integration: isolated Docker service, job evaluation pipeline ✅
- **Milestone 8** — Pre-Launch Audit Fix Sprint: CSP, mobile grid, unsaved-changes guard, career-ops reliability ✅
- **Milestone 9** — Cloudflare Zero Trust Tunnel → public domain (no port forwarding) ✅
- **Milestone 9.5** — Content population: skills/experience/projects seeded to DB, profile photo, blog ✅
- **Milestone 10** — Open source preparation: MIT licence, docs, hardcoded strings removed ✅
- **Milestone 11** — Growth features: analytics, newsletter, 2FA (deferred) ⏸

---

## Security Notes

- Admin routes are protected by server-side session validation
- Self-hosted tools (n8n, etc.) should remain on a separate subdomain with IP allowlist or VPN-only access
- Never commit `.env` — use `.env.example` as the reference
- Rate limiting applied to contact form endpoint

---

## Contributing

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup, code standards, and PR guidelines.

---

## License

MIT — see [LICENSE](./LICENSE).
