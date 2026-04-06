# CLAUDE.md — AI Agent Instructions for My Portfolio Platform

This file is automatically read by Claude Code at the start of every session.
Read it fully before making any changes to this codebase.

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

---

## Current Implementation State

### Completed
- [x] Milestone 1: Project scaffold, Prisma schema, DB models, auth middleware
- [x] Public sections: Nav, Hero, About, Skills, Experience, Projects, Robotics, Blog preview, Contact, Footer
- [x] Zero-config mockup mode (no DB/env required)
- [x] Contact form API with rate limiting
- [x] AI agent scripts: GitHub Summarizer, Robotics News Curator
- [x] Docker Compose + Nginx production config

### Next Up — Milestone 2
- [ ] Wire projects/experience sections to pull from DB when available
- [ ] Project detail pages (`/projects/[slug]`)
- [ ] Resend email integration on contact form
- [ ] CV PDF (add real file to `public/cv.pdf`)
- [ ] SEO: sitemap.xml, robots.txt, JSON-LD Person schema, OG images
- [ ] Deploy to VPS or Vercel

See `docs/IMPLEMENTATION_PLAN.md` for the full phased breakdown.

---

## Environment Variables Reference

All required variables are documented in `.env.example`.
Never create new secrets without adding them to `.env.example` first.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string. If absent, site runs in mock mode.
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`. Required for admin login.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Used by `npm run db:seed` to create the admin user.
- `RESEND_API_KEY` — Required for contact form email delivery.
- `ANTHROPIC_API_KEY` — Required for AI agent LLM summarization.

---

## What NOT to Do

- Do not add `console.log` to production code paths.
- Do not install new dependencies without checking if existing packages cover the need.
- Do not modify `prisma/schema.prisma` without running `npm run db:migrate` and committing the migration.
- Do not add client components (`"use client"`) unless the feature genuinely requires browser APIs or interactivity.
- Do not create a new component file for something that can be a local variable or inline JSX.
- Do not add progress bars or percentage meters to the Skills section — they are perceived as arbitrary.
- Do not add particle effects, typing animations on the hero, or scroll-jacking — ever.
- Do not expose the admin panel URL in the public sitemap or robots.txt.

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
npm run db:push      # Apply schema to DB (no migration history)
npm run db:migrate   # Apply schema with migration history (use in prod)
npm run db:seed      # Create admin user
npm run db:studio    # Open Prisma Studio (DB browser)
npx tsx agents/github-summarizer.ts   # Run agent manually
npx tsx agents/robotics-news.ts       # Run agent manually
```
