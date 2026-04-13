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
│   │   └── admin/             ← Admin panel UI components
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
│   └── robotics-news.ts
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

### Still Needed — Milestone 2 Remainder
- [ ] Owner provides `public/cv.pdf` (download link exists, file missing)
- [ ] Owner provides `public/photo.jpg` (conditional render is wired, file missing)
- [ ] `/projects` — standalone filterable projects index page
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

### Next — Milestone 4 (current)
- [ ] `/projects` — standalone filterable projects index page (filter by SOFTWARE / ROBOTICS / HARDWARE / RESEARCH)
- [ ] Markdown-renderer improvements: table of contents, copy-code button
- [ ] Milestone 4 agents: Blog Suggester, Brand Monitor, Opportunity Watcher
- [ ] Admin "Run now" button for agents (`POST /api/admin/agents/[id]/run`) + status field (idle/running/error)
- [ ] GitHub Actions CI: lint + type-check on push

### Milestone 4.5 — Skills Inference Agent
- [ ] `agents/skills-inference.ts` — reads GitHub repos + DB projects/posts, uses Claude to extract technologies, diffs against existing `Skill` rows, writes an `AgentReport` with suggested additions/upgrades/stale items
- [ ] Admin UI: diff table on agent report page, per-row "Apply" button (inline server action), "Apply all" bulk — **never auto-writes to DB; always owner-approved**

### Milestone 4.6 — AI-Powered CV Generation
- [ ] `agents/cv-generator.ts` — reads DB (User, Skills, Experience, Projects), calls Claude to write structured CV JSON, renders to `public/cv.pdf` via `@react-pdf/renderer`
- [ ] `/admin/cv` page: "Regenerate from DB" button, PDF preview, inline section editor (corrects AI output before rendering), manual PDF upload as escape hatch
- [ ] Schema additions: `cvGeneratedAt`, `cvSource` (`"generated" | "manual"`), `cvContent` (Json) on `User`
- [ ] API routes: `POST /api/admin/agents/cv-generator/run`, `GET|PUT /api/admin/cv`, `POST /api/admin/cv/upload`, `POST /api/admin/cv/render`
- [ ] See `docs/IMPLEMENTATION_PLAN.md` for full spec including the CV Section Editor flow

See `docs/IMPLEMENTATION_PLAN.md` for the full phased breakdown (Milestones 5–7 cover deployment, polish, and growth features).

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
npx tsx agents/github-summarizer.ts   # Run agent manually
npx tsx agents/robotics-news.ts       # Run agent manually
```

### Local DB connection
`DATABASE_URL` must be a direct `postgres://` connection string — **not** `prisma+postgres://`.
Use `127.0.0.1`, not `localhost` (postgres only listens on IPv4 on this machine):
```
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable"
```
Pass it inline to seed: `DATABASE_URL="postgres://..." npm run db:seed`

Do **not** modify `prisma/schema.prisma` without running `npm run db:push` and committing the change.
