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
├── prisma/
│   ├── schema.prisma          ← Database schema — source of truth
│   └── seed.ts                ← Admin user seeder
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

---

## Content Architecture — Critical Rule

**All placeholder/mock content lives exclusively in `src/lib/mock-data.ts`.**

Do NOT hardcode strings in components. When adding a new section that needs content:
1. Add the data shape to `mock-data.ts`
2. Import it in the component
3. The owner replaces values in one place

When the admin panel + database are active (Milestone 3+), components will fetch from the DB instead. `mock-data.ts` becomes the fallback/seed source.

**Mock mode** is active when `DATABASE_URL` is absent or starts with `prisma+postgres://`. The `isMock()` helper in `src/lib/data.ts` centralises this check; all fetchers use it. The homepage (`src/app/page.tsx`) checks `!process.env.DATABASE_URL` to conditionally render `<MockModeBanner />`.

---

## Current Implementation State

### Completed — Milestone 1
- [x] Next.js 14 scaffold, Prisma schema, DB models, auth middleware
- [x] Public sections: Nav, Hero, About, Skills, Experience, Projects, Robotics, Blog preview, Contact, Footer
- [x] Zero-config mockup mode (no DB/env required)
- [x] Contact form API with rate limiting
- [x] AI agent scripts: GitHub Summarizer, Robotics News Curator
- [x] Docker Compose + Nginx production config

### Completed — Milestone 2
- [x] `src/types/index.ts` — shared TypeScript interfaces (ProjectSummary, ProjectDetail, ExperienceItem, SkillGroup, BlogPostSummary, BlogPostDetail)
- [x] `src/lib/data.ts` — central async data fetchers; DB-first with mock fallback for all sections
- [x] All public sections wired to `data.ts` (Projects, Experience, Skills, BlogPreview, Blog page)
- [x] `/projects/[slug]` — full case study detail page with `generateMetadata` + `generateStaticParams`
- [x] `/blog/[slug]` — blog post detail page with JSON-LD Article schema
- [x] Contact form: Resend email delivery + honeypot spam trap
- [x] `AboutSection.tsx` — renders `public/photo.jpg` when present, SVG placeholder otherwise
- [x] `sitemap.ts` — dynamic, includes all projects + blog posts, excludes `/admin`
- [x] `robots.ts` — `Disallow: /admin` and `/api/`
- [x] JSON-LD Person schema on homepage
- [x] `opengraph-image.tsx` — dynamic OG image via `next/og` served at `/opengraph-image`
- [x] `metadataBase` + OWNER-driven root metadata in `layout.tsx`

### Still Needed — Owner actions before going live
- [ ] Owner provides `public/photo.jpg` (About section conditional render is wired, file missing)
- [ ] Owner fills in real personal info in `src/lib/mock-data.ts` (`OWNER` object — name, title, bio, social links)
- [ ] GitHub Actions CI: lint + type-check on push
- [ ] Deploy to VPS: Docker Compose, Nginx HTTPS, Let's Encrypt, PostgreSQL

### Completed — Milestone 3
- [x] `src/auth.ts` — Auth.js v5 Credentials provider, **JWT strategy** (`strategy: "jwt"`, 24h maxAge). Database sessions are unsupported with Credentials in Auth.js v5.
- [x] `src/middleware.ts` — lightweight **Edge-compatible cookie-presence check** (cannot use `export { auth as middleware }` — Prisma and bcryptjs are Node.js-only, incompatible with the Edge runtime). Real session validity is enforced server-side by `auth()` in `(panel)/layout.tsx`.
- [x] `/admin/login` — server-action login form (`LoginForm.tsx` client component with `useFormStatus`)
- [x] Admin route groups: `(auth)/login` (no sidebar), `(panel)/*` (sidebar shell)
- [x] Admin shell: `(panel)/layout.tsx`, `Sidebar.tsx` (`usePathname` active links), `TopBar.tsx` (logout server action)
- [x] Admin dashboard: stats (posts/projects/skills), agent insights widget, quick actions
- [x] `src/lib/admin-auth.ts` — `requireAdminSession()` guard for all `/api/admin/*` routes
- [x] Blog CRUD: list, create, edit pages + `PostForm.tsx` (MDEditor, tag chips, SEO, scheduling)
- [x] Project CRUD: list, create, edit pages + `ProjectForm.tsx` (MDEditor, tech tags, type, featured)
- [x] Skills editor: grouped by category, inline server-action add/delete
- [x] Experience editor: inline server-action add/delete with full date/type support
- [x] Agents dashboard: agent list with unread badges, report list, full report detail with `MarkdownRenderer`
- [x] Tools shortcuts manager: grid view, inline add/delete server actions
- [x] Media library: `public/uploads/` upload, image grid, delete, `MediaUploader` client component
- [x] `src/lib/markdown.ts` + `MarkdownRenderer.tsx` — unified pipeline (remark + rehype + highlight + sanitize)
- [x] `/blog/[slug]` and `/projects/[slug]` — content rendered via `MarkdownRenderer`

### Completed — Milestone 4
- [x] `/projects` — standalone filterable projects index page (filter by SOFTWARE / ROBOTICS / HARDWARE / RESEARCH type badges)
- [x] Markdown-renderer improvements: table of contents (auto-generated from headings), copy-code button
- [x] `rehype-sanitize` configured with `clobberPrefix: ""` so ToC anchor IDs are not mangled
- [x] Milestone 4 AI agents: Blog Suggester, Brand Monitor, Opportunity Watcher — all with CLI runners in `agents/`
- [x] Admin "Run now" button (`RunAgentButton.tsx`) → `POST /api/admin/agents/[id]/run` — status cycles idle → running → idle/error with badges
- [x] Agent run API response includes `{ ok, title, rawData, reportId }` — enables contextual redirect and inline UI
- [x] All CLI runners (`agents/*.ts`) use shared `prisma` singleton from `src/lib/prisma` (not `new PrismaClient()`) — required for PrismaPg adapter compatibility

### Completed — Milestone 4.5: Skills Inference Agent
- [x] `src/lib/agents/skills-inference.ts` — fetches GitHub repo languages (top 15 repos), diffs against DB skills + project techTags + post tags, calls Claude haiku to produce structured diff JSON
- [x] rawData shape: `{ type: "SKILLS_DIFF", add: [...], upgrade: [...], stale: [...] }`
- [x] `agents/skills-inference.ts` — CLI runner; seeds agent row in DB on first run
- [x] Report detail page (`/admin/agents/reports/[reportId]`) renders SKILLS_DIFF as Apply/Upgrade tables with inline server actions — **never auto-writes; always owner-approved**
- [x] Skills page (`/admin/skills`) — "Sync from GitHub" button (`RunAgentButton` with `redirectOnSuccess`) appears once agent row exists in DB

### Completed — Milestone 4.6: AI-Powered CV Generation
- [x] `src/lib/cv-template.tsx` — `@react-pdf/renderer` PDF template: dark header, cyan accent line, sections for Profile/Skills/Experience/Projects/Contact; exported as `renderCvToPdf(cvContent): Promise<Buffer>`
- [x] `src/lib/agents/cv-generator.ts` — reads DB (User, Skill, Experience, Project), calls Claude haiku (max_tokens 1500) to write structured CV JSON, falls back to raw DB build if no API key or parse fails, renders PDF to `public/cv.pdf`, saves `cvContent`/`cvGeneratedAt`/`cvSource` to User
- [x] `agents/cv-generator.ts` — CLI runner; seeds agent row in DB on first run
- [x] Schema additions on `User`: `cvGeneratedAt DateTime?`, `cvSource String @default("manual")`, `cvContent Json?`
- [x] `/admin/cv` — Server Component page: generated date + source badge, Open PDF link, Run now button, `CvEditor`, manual upload section
- [x] `src/components/admin/CvEditor.tsx` — client component: editable summary textarea, skills read-only list (edit via Skills page), experience + projects editors, "Save & Render PDF" → PUT /api/admin/cv then POST /api/admin/cv/render
- [x] API routes (all `runtime = "nodejs"`, all behind `requireAdminSession`): `POST /api/admin/cv/run`, `GET|PUT /api/admin/cv`, `POST /api/admin/cv/render`, `POST /api/admin/cv/upload`

### Completed — Milestone 4.7: GitHub Project Importer
- [x] `src/lib/agents/github-project-importer.ts` — fetches public repos, filters out ones already in DB by githubUrl, fetches README + languages for new repos (up to 5), calls Claude haiku to generate project entries, then **auto-creates draft `Project` rows** (no owner approval required at import time)
- [x] rawData shape: `{ type: "PROJECT_CREATED", created: [...], skipped: N }` — `PROJECT_SUGGESTIONS` is the legacy shape still rendered for old reports
- [x] `agents/github-project-importer.ts` — CLI runner
- [x] Report detail page renders `PROJECT_CREATED` as a list of created drafts with "Edit draft →" links; legacy `PROJECT_SUGGESTIONS` reports still render suggestion cards with a "Create as Draft" server action
- [x] Projects page (`/admin/projects`) — "Import from GitHub" button appears once agent row exists in DB

### Completed — Milestone 4.8: Inline Agent Triggers in Editors
- [x] `src/components/admin/AgentSuggestPanel.tsx` — reusable `"use client"` component: `{ agentId, buttonLabel, renderResult, className? }`; states: idle → loading → result panel → close; error shown inline
- [x] Blog editor (`PostForm.tsx`) — "💡 Suggest topics" button below Title field runs Blog Suggester inline, shows 5 clickable suggestion pills; clicking a pill sets title, auto-generates slug, and adds tags
- [x] Blog editor (`PostForm.tsx`) — "Generate content" button calls `POST /api/admin/blog/generate-content` with `{ title, tags, excerpt }`, streams full markdown into the editor body (requires title to be set; requires `ANTHROPIC_API_KEY`)
- [x] `POST /api/admin/blog/generate-content` — generates 600–1000 word blog post markdown via Claude haiku; auth-gated; `runtime = "nodejs"`
- [x] Blog Suggester `rawData` now structured: `{ suggestions: [{ title, tags, rationale }], existingTopics: N }`
- [x] `RunAgentButton` extended with `label?` and `redirectOnSuccess?` props

### Completed — Milestone 4.9: Multi-Platform Scraping & Dashboard
- [x] `src/lib/agents/github-summarizer.ts` — extended with `fetchGitHubProfile()` (`GET /users/{username}`); rawData now includes `{ repos: [...], profile: { bio, location, blog, twitter_username, followers } }`
- [x] `src/lib/agents/twitter-profile.ts` — Twitter API v2 user + tweets fetch; returns `null` gracefully if `TWITTER_BEARER_TOKEN` not set
- [x] `src/lib/agents/platform-sync.ts` — orchestrates GitHub profile + Twitter fetch; produces combined markdown report
- [x] `agents/platform-sync.ts` — CLI runner
- [x] LinkedIn: no auto-scraping (ToS violation, no free API) — `POST /api/admin/linkedin/import` parses Positions.csv + Skills.csv from LinkedIn data export and returns preview
- [x] Admin dashboard Platform Connections card: GitHub (green if `GITHUB_USERNAME` set), X/Twitter (grey + hint if unconfigured), LinkedIn (Export data link)
- [x] New `AgentType` enum values: `SKILLS_INFERENCE`, `GITHUB_PROJECT_IMPORTER`, `CV_GENERATOR`, `PLATFORM_SYNC`

### Completed — Milestone 4.10: Pre-Deployment Security Audit
Curl-based pentest run locally (39 PASS / 0 FAIL / 2 WARN). Results:

- [x] **Auth bypass (API)** — all 9 `/api/admin/*` routes return 401 without session (GET + POST)
- [x] **Admin route guard** — all 7 `/admin/*` pages return 307 redirect to login without session
- [x] **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` present on all responses
- [x] **Cookie flags** — Auth.js sets `HttpOnly: true`, `SameSite: lax` by default; `Secure` added automatically on HTTPS (confirmed in `@auth/core` source)
- [x] **Information disclosure** — 404 and API error responses do not leak stack traces, Prisma paths, or filesystem paths
- [x] **Sensitive files** — `.env`, `.env.local`, `package.json`, `tsconfig.json`, `prisma/schema.prisma`, `.git/config` all return 404
- [x] **Rate limiting** — contact form returns 429 at request 6 (threshold working)
- [x] **XSS payloads** — `<script>`, `<img onerror>`, `javascript:`, `<iframe>` all blocked at API layer (401 — auth required)
- [x] **Open redirect** — `callbackUrl` param does not redirect to `evil.com`, `//evil.com`, or encoded variants
- [x] **Path traversal** — `..%2F`, `%2e%2e%2f`, `....//` patterns blocked on `/api/admin/media`
- [x] **File exposure** — no static files from project root are served through Next.js public dir
- [ ] **Nikto scan** — not run (tool not installed); run `sudo dnf install nikto && nikto -h http://localhost:3000` before VPS deploy
- [ ] **File upload MIME validation** — manual test pending (requires authenticated session + media endpoint)
- [ ] **LinkedIn CSV input fuzzing** — pending (requires authenticated session)

### Completed — Milestone 4.11: Agent Infrastructure Bug Fixes
- [x] `src/app/api/admin/agents/[id]/run/route.ts` — atomic concurrent-run guard: replaced non-atomic `findUnique` + status check with `prisma.agent.updateMany({ where: { status: { not: "running" } } })` — only one request can claim the lock; others get 409
- [x] `src/lib/agents/github-project-importer.ts` — creation loop wrapped in try-catch; P2002 (unique constraint) skipped silently, other errors re-thrown; empty slug/title pre-validated before insert
- [x] `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx` — `createProjectDraft` wraps JSON.parse + prisma.create in try-catch; P2002 redirects to `?error=slug-exists`; error banner renders from `searchParams.error`
- [x] Report page — `applySkillAdd` and `applySkillUpgrade` wrapped in try-catch (silent swallow, user can retry)
- [x] `src/app/admin/(panel)/projects/page.tsx` — `deleteProject` now calls `revalidatePath("/admin/projects")`, `revalidatePath("/projects")`, `revalidatePath("/")` so deleted row disappears immediately
- [x] `src/components/admin/RunAgentButton.tsx` — error response body parsed and stored in `errorMsg` state; exposed as `title` tooltip on the Failed button

### Next — Milestone 5: Deployment
- [ ] Deploy to VPS: Docker Compose, Nginx HTTPS, Let's Encrypt, PostgreSQL
- [ ] GitHub Actions CI: lint + type-check on push
- [ ] Owner fills in real personal data (name, bio, photo, skills, experience, projects)

See `docs/IMPLEMENTATION_PLAN.md` for the full phased breakdown.

---

## Environment Variables Reference

All required variables are documented in `.env.example`.
Never create new secrets without adding them to `.env.example` first.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string. If absent, site runs in mock mode.
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`. Required for admin login.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Used by `npm run db:seed` to create the admin user.
- `RESEND_API_KEY` — Required for contact form email delivery. `resend` package is already installed; the integration stub is in `src/app/api/contact/route.ts`.
- `ANTHROPIC_API_KEY` — Required for AI agent LLM summarization.

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

```bash
npm run dev          # Start dev server (works without DB — mock mode)
npm run build        # Production build
npm run lint         # ESLint via Next.js
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

### Local DB connection
`DATABASE_URL` must be a direct `postgres://` connection string — **not** `prisma+postgres://`.
Use `127.0.0.1`, not `localhost` (postgres only listens on IPv4 on this machine):
```
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable"
```
Pass it inline to seed: `DATABASE_URL="postgres://..." npm run db:seed`

Do **not** modify `prisma/schema.prisma` without running `npm run db:push` and committing the change.
