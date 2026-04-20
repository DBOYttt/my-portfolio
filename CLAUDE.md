# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> AI Agent Instructions for My Portfolio Platform — read fully before making any changes.

---

## Project Identity

A full-stack personal portfolio + private admin platform for a programmer and robotics enthusiast.
Built to help the owner get hired. Every decision should serve that goal first.

**Owner:** `src/lib/mock-data.ts` → `OWNER` object (update with real info before going live)
**GitHub:** https://github.com/DBOYttt/my-portfolio (private)
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS v3 · PostgreSQL · Prisma · Auth.js v5

---

## Mandatory Behaviour for AI Agents

### Git — non-negotiable
- **Commit and push after every change.** No batching across multiple responses.
- Use `git add <specific files>` — never `git add -A` blindly (avoids committing secrets).
- Commit messages must follow: `type(scope): short description` (see section below).
- Never commit `.env`, `node_modules/`, or any file in `.gitignore`.
- Never force-push unless explicitly instructed by the owner.
- Never skip hooks (`--no-verify`).

### Code quality
- TypeScript strict mode is enabled — do not disable or suppress type errors with `any` casts unless unavoidable and commented.
- Never add features, refactors, or improvements beyond what was asked.
- Do not add comments to code you did not write or change.
- Prefer editing existing files over creating new ones.
- Do not create markdown files unless asked.

### Security — always enforce
- Never expose `DATABASE_URL`, `AUTH_SECRET`, or any secret in code or logs.
- Admin routes (`/admin/*`, `/api/admin/*`) must always be protected by session checks.
- Contact form API must always have rate limiting applied.
- New API routes default to auth-required unless they are explicitly public.
- API routes that use Prisma, `@react-pdf/renderer`, or `bcryptjs` must declare `export const runtime = "nodejs"` — these packages are incompatible with the Edge runtime.

---

## Commit Message Convention

```
type(scope): short imperative description

Types:  feat | fix | refactor | style | docs | chore | test
Scope:  public | admin | blog | agents | db | auth | api | infra | docs

Examples:
  feat(public): add robotics gallery section with image grid
  fix(api): correct rate limit window calculation in contact route
  chore(db): add AgentReport index on createdAt
  docs: update implementation plan with Phase 2 milestones
```

---

## Project Structure — Know Before You Touch

```
my-portfolio/
├── CLAUDE.md                  ← You are here. Read before anything else.
├── docs/                      ← All extended documentation
│   ├── ARCHITECTURE.md        ← System design, stack decisions, deployment
│   ├── DEVELOPMENT.md         ← Dev setup, commands, conventions
│   ├── IMPLEMENTATION_PLAN.md ← Phased roadmap with task breakdown
│   ├── DATA_MODEL.md          ← Database schema reference
│   ├── AI_AGENTS.md           ← AI agent specs and implementation guide
│   └── SECURITY.md            ← Security model and rules
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Homepage — imports section components
│   │   ├── blog/              ← Public blog (listing + post detail)
│   │   ├── projects/          ← Public project case studies
│   │   ├── admin/             ← Private admin panel (auth-gated)
│   │   └── api/               ← API routes (contact, admin, auth)
│   ├── components/
│   │   ├── public/            ← All public-facing UI components
│   │   ├── admin/             ← Admin panel UI components
│   │   └── ui/                ← Shared UI primitives (MarkdownRenderer, TableOfContents, CodeCopyEnhancer)
│   ├── lib/
│   │   ├── mock-data.ts       ← ALL placeholder content lives here
│   │   └── prisma.ts          ← Prisma client singleton
│   ├── types/                 ← Shared TypeScript types
│   └── middleware.ts          ← Admin route auth guard
├── prisma.config.ts           ← Prisma 7 config (schema path, migrations path, datasource URL)
├── prisma/
│   ├── schema.prisma          ← Database schema — source of truth
│   └── seed.ts                ← Admin user seeder
├── docker-compose.yml         ← Production: app + db + nginx services
├── docker-compose.override.yml← Local dev overrides (e.g. port exposure for host-side migrations)
├── agents/                    ← Standalone AI agent scripts (run via cron)
│   ├── github-summarizer.ts
│   ├── robotics-news.ts
│   ├── blog-suggester.ts
│   ├── brand-monitor.ts
│   ├── opportunity-watcher.ts
│   ├── skills-inference.ts
│   ├── github-project-importer.ts
│   ├── cv-generator.ts
│   └── platform-sync.ts
└── nginx/
    └── portfolio.conf         ← Nginx reverse proxy config
```

> **Agent registry:** `src/lib/agents/index.ts` exports `AGENT_RUNNERS` — a map from `AgentType` enum value to runner function. Every new agent runner must be registered here for the admin "Run now" button to work. `src/lib/agents/types.ts` defines the `AgentRunResult` interface all runners must return.

### Adding a new agent (all steps required)
1. Add the new value to the `AgentType` enum in `prisma/schema.prisma` → `npm run db:push` → `npm run db:generate`
2. Create `src/lib/agents/your-agent.ts` — export `runYourAgent(): Promise<AgentRunResult>`
3. Register in `src/lib/agents/index.ts` → `AGENT_RUNNERS`
4. Create `agents/your-agent.ts` CLI runner (seeds the DB agent row on first run)
5. Import `{ prisma }` from `src/lib/prisma` — never `new PrismaClient()` (PrismaPg adapter is only in the singleton)

---

## Content Architecture — Critical Rule

**All placeholder/mock content lives exclusively in `src/lib/mock-data.ts`.**

Do NOT hardcode strings in components. When adding a new section that needs content:
1. Add the data shape to `mock-data.ts`
2. Import it in the component
3. The owner replaces values in one place

When the admin panel + database are active (Milestone 3+), components will fetch from the DB instead. `mock-data.ts` becomes the fallback/seed source.

**Mock mode** is active when `DATABASE_URL` is absent or starts with `prisma+postgres://`. The `isMock()` helper in `src/lib/data.ts` centralises this check; all fetchers use it. The homepage (`src/app/page.tsx`) checks `!process.env.DATABASE_URL` to conditionally render `<MockModeBanner />`.

Canonical data-fetching pattern for RSC (all fetchers in `src/lib/data.ts` follow this):
```typescript
async function getData() {
  if (!process.env.DATABASE_URL) return MOCK_DATA; // from mock-data.ts
  return prisma.yourModel.findMany({ ... });
}
```

---

## Current State (post-Milestone 5)

All public sections, admin CRUD, nine AI agents, CV generation, security audit, and 79 Vitest tests are complete and deployed. The app is **live on the LAN** at `http://192.168.0.104` (Docker Compose: app + PostgreSQL + Nginx, port 80). All 9 agents have run and are registered in the DB; 4 GitHub projects imported as drafts. `npm test`, `tsc --noEmit`, `npm run lint`, and `npm run build` are all clean.

### Deployment: `192.168.0.104`
- **Stack:** Docker Compose — `my-portfolio-app-1` (Next.js, port 3000 internal), `my-portfolio-db-1` (PostgreSQL 16, `127.0.0.1:5432`), `my-portfolio-nginx-1` (port 80, LAN HTTP)
- **Config:** `nginx/portfolio-lan.conf` via `docker-compose.override.yml` (HTTP only, no TLS)
- **Cron agents:** 9 jobs in `diboy`'s crontab at `/home/diboy/projects/my-portfolio`, logs → `~/logs/`
- **GitHub secrets set:** `ANTHROPIC_API_KEY`, `GH_PAT_TOKEN`, `GH_USERNAME`, `AUTH_SECRET`, `SSH_HOST`, `SSH_USER`, `SSH_KEY`
- **Auto-deploy:** wired (`deploy.yml` uses Twingate + SSH) — pending Twingate service account setup to activate

### Key architectural facts worth knowing
- Admin route groups: `(auth)/` — login page only, no shell. `(panel)/` — all authenticated pages; `layout.tsx` calls `auth()` and redirects if no session.
- `src/middleware.ts` is Edge-only and checks only for cookie *presence* — not validity. Real auth is enforced server-side by `auth()` in `(panel)/layout.tsx` and `requireAdminSession()` in every `/api/admin/*` route.
- Agent run API: `POST /api/admin/agents/[id]/run` uses an atomic `updateMany` lock — only one run at a time; concurrent callers get 409.
- Skills Inference results are **never auto-applied** — owner must approve each diff on the report detail page.
- CV PDF is written to `public/cv.pdf`; `cvSource` field on `User` tracks `"ai"` vs `"manual"`.
- `Agent.config Json?` stores per-agent persistent state (seenUrls, keywords, repoSnapshot, etc.). Runners return `_updatedConfig` in `AgentRunResult`; the run API persists it after success.
- Build without a real DB: `DATABASE_URL="prisma+postgres://ci" npm run build` — forces `isMock()` true so all pages use mock data. Used in CI.
- `src/app/page.tsx` and `src/app/blog/page.tsx` declare `export const dynamic = "force-dynamic"` — required because both pages were being pre-rendered as static HTML at build time (with mock data), bypassing the real DB at runtime.
- Test suite: `npm test` runs 79 Vitest tests across 8 files (unit, integration, structural scan). `npm run test:watch` for TDD.
- CI/CD pipeline: `.github/workflows/ci.yml` runs lint → type-check → test → build on every push. `.github/workflows/deploy.yml` SSH-deploys via Twingate when CI passes on `main`. Requires `TWINGATE_SERVICE_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_KEY` in GitHub repo secrets.

### Pending — owner actions
- [ ] Add `public/photo.jpg` to repo, then `git push` → auto-deploy picks it up (or `docker compose build app && docker compose up -d app` manually)
- [ ] Add real skills via `/admin/skills`
- [ ] Add real experience via `/admin/experience`
- [ ] Review + publish the 4 imported GitHub projects via `/admin/projects`
- [ ] Run CV Generator via `/admin/cv` → "Run now"
- [ ] Set up Twingate service account (`github-actions-deploy`) to activate auto-deploy

### Upcoming — Milestone 6: Polish + Analytics
- [ ] Lighthouse audit — fix all issues below 90
- [ ] `next/font` for Inter and JetBrains Mono
- [ ] Self-hosted Umami analytics (Docker, same server)
- [ ] Accessibility audit (keyboard nav, WCAG AA contrast)

See `docs/IMPLEMENTATION_PLAN.md` for the full phased breakdown.

---

## Environment Variables Reference

All required variables are documented in `.env.example`.
Never create new secrets without adding them to `.env.example` first.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string. If absent, site runs in mock mode.
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`. Required for admin login.
- `AUTH_URL` — Full site URL for Auth.js callbacks (e.g. `http://localhost:3000`).
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Used by `npm run db:seed` to create the admin user.
- `RESEND_API_KEY` — Required for contact form email delivery.
- `CONTACT_EMAIL` — Where contact form submissions are delivered.
- `CONTACT_FROM_EMAIL` — Must be a verified sender domain in Resend.
- `ANTHROPIC_API_KEY` — Required for AI agent LLM summarization.
- `GITHUB_TOKEN` / `GITHUB_USERNAME` — Used by GitHub Summarizer and Skills Inference agents; token is optional but increases rate limits and enables GraphQL.
- `NEXT_PUBLIC_BASE_URL` — Canonical site URL used in sitemap and JSON-LD schemas.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2 storage for admin media uploads (optional).

---

## What NOT to Do

- Do not add `console.log` to production code paths.
- Do not install new dependencies without checking if existing packages cover the need.
- Do not modify `prisma/schema.prisma` without running `npm run db:push` (local) or `npm run db:migrate` (prod) and committing the change.
- Do not add client components (`"use client"`) unless the feature genuinely requires browser APIs or interactivity.
- Do not create a new component file for something that can be a local variable or inline JSX.
- Do not add progress bars or percentage meters to the Skills section — they are perceived as arbitrary.
- Do not add particle effects, typing animations on the hero, or scroll-jacking — ever.
- Do not expose the admin panel URL in the public sitemap or robots.txt.
- Do not treat the middleware session check as a full auth guard — it only checks for cookie presence, not validity. Real session verification is done server-side in `src/app/admin/(panel)/layout.tsx` via `auth()`, and in every `/api/admin/*` route via `requireAdminSession()` in `src/lib/admin-auth.ts`.

---

## Design System Quick Reference

```
Background:   #0f1117 (page), #1a1d27 (cards/elevated), #2a2d3a (borders)
Text:         slate-100 (primary), slate-400 (body), slate-500/600 (muted)
Accent:       cyan-500 (#06b6d4) — use sparingly, only for emphasis
Font:         Inter (UI), JetBrains Mono (code, labels)

CSS classes (defined in globals.css):
  .section-container  → max-w-6xl mx-auto with horizontal padding
  .section-heading    → h2 style
  .accent-line        → cyan underline decorative element
  .card               → elevated surface with hover border
  .tag                → small label pill (cyan tint)
  .btn-primary        → cyan filled button
  .btn-secondary      → ghost/outline button
```

---

## Running the Project

Run the full verification suite before committing: `npm test && npm run lint && npx tsc --noEmit`. For browser walkthroughs use the `end-user-tester` subagent.

```bash
npm run dev          # Start dev server (works without DB — mock mode)
npm run build        # Production build
npm run lint         # ESLint via Next.js
npx tsc --noEmit     # Type-check without emitting (run before committing)
npm test                         # Vitest — 79 tests across 8 files (unit, integration, structural)
npm run test:watch               # Vitest watch mode for TDD
npm run test:coverage            # Vitest with V8 coverage report
npx vitest run <pattern>         # Run a single test file, e.g. npx vitest run admin-routes
npm run db:generate  # Re-generate Prisma client after schema changes
npm run db:push      # Apply schema to DB — use this locally (migrate dev unsupported with Prisma dev proxy)
npm run db:migrate   # Apply schema with migration history — use in production only
npm run db:seed      # Create admin user
npm run db:studio    # Open Prisma Studio (DB browser)
npx tsx agents/github-summarizer.ts          # Run agent manually
npx tsx agents/robotics-news.ts              # Run agent manually
npx tsx agents/blog-suggester.ts             # Run agent manually
npx tsx agents/brand-monitor.ts              # Run agent manually
npx tsx agents/opportunity-watcher.ts        # Run agent manually
npx tsx agents/skills-inference.ts           # Run agent manually (seeds DB row on first run)
npx tsx agents/github-project-importer.ts    # Run agent manually (seeds DB row on first run)
npx tsx agents/cv-generator.ts               # Run agent manually (seeds DB row on first run)
npx tsx agents/platform-sync.ts              # Run agent manually (seeds DB row on first run)
```

> **Important:** All CLI runners import `{ prisma }` from `src/lib/prisma` (not `new PrismaClient()`).
> The PrismaPg adapter is set up in the singleton — using `new PrismaClient()` directly fails.

### DB connection (host-side, for migrations and agent runs)
`DATABASE_URL` must be a direct `postgres://` string — **not** `prisma+postgres://`.
The Docker container exposes PostgreSQL on `127.0.0.1:5432` (via `docker-compose.override.yml`):
```
DATABASE_URL="postgres://portfolio:POSTGRES_PASSWORD@127.0.0.1:5432/portfolio_db"
```
Pass inline: `DATABASE_URL="postgres://..." npm run db:seed`
All 9 agent scripts require `DATABASE_URL` inline or from `.env` (tsx does not auto-load `.env`).

Do **not** modify `prisma/schema.prisma` without running `npm run db:push` and committing the change.
