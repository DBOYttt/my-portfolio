# Implementation Plan

## Status Legend
- ✅ Done
- ⬜ Not started
- ⏸ Deferred

---

## Milestone 1 — Foundation ✅

**Goal:** Project compiles, runs without setup, public portfolio is visually complete with mock data.

- ✅ Next.js 14 (App Router, TypeScript, Tailwind v3) scaffold
- ✅ Prisma schema — all entities (User, Post, Project, Skill, Experience, Agent, AgentReport, MonitoredTopic, ToolShortcut, AuditLog, MediaAsset)
- ✅ Auth middleware guard on `/admin/*`
- ✅ Public sections: Nav, Hero, About, Skills, Experience, Projects, Robotics, Blog preview, Contact, Footer
- ✅ `src/lib/mock-data.ts` — zero-config content layer
- ✅ MockModeBanner — shows when running without DB
- ✅ Contact form API route with rate limiting
- ✅ AI agent scripts: GitHub Summarizer, Robotics News Curator
- ✅ Docker Compose + Nginx production config
- ✅ `.env.example` with all variables documented
- ✅ `CLAUDE.md`, `docs/` documentation suite

---

## Milestone 2 — Full Public Portfolio ✅

**Goal:** Every public page is complete, SEO-ready, and connected to the database.

- ✅ `src/types/index.ts` — shared interfaces bridging mock and DB shapes
- ✅ `src/lib/data.ts` — central async fetchers (DB-first, mock fallback)
- ✅ `/projects/[slug]` — case study detail with `generateMetadata`, `generateStaticParams`
- ✅ `/blog/[slug]` — post detail with JSON-LD Article schema
- ✅ All public sections wired to `data.ts` (Projects, Experience, Skills, BlogPreview, Blog)
- ✅ Contact form: Resend email + honeypot spam trap
- ✅ `AboutSection.tsx` — conditional `<Image>` when `public/photo.jpg` exists
- ✅ `sitemap.ts` — dynamic, admin excluded
- ✅ `robots.ts` — `Disallow: /admin` and `/api/`
- ✅ JSON-LD Person schema on homepage
- ✅ `opengraph-image.tsx` — dynamic OG image via `next/og`
- ✅ `metadataBase` + owner-driven metadata in `layout.tsx`
- ✅ Blog post dates formatted as human-readable strings ("April 8, 2026")

**Owner actions still needed:**
- ⬜ Place `public/cv.pdf` (download link exists but 404s)
- ⬜ Place `public/photo.jpg` (conditional render is wired)

**Code still needed:**
- ⬜ `/projects` — standalone filterable projects index page
- ⬜ GitHub Actions CI: lint + type-check on push

---

## Milestone 3 — Admin Panel + Blog ✅

**Goal:** Owner can manage all content via admin panel. No code changes needed for content updates.

All items below are implemented and manually tested against a live local database.

### Auth
- ✅ `src/auth.ts` — Auth.js v5, Credentials provider, `strategy: "jwt"`, `maxAge: 86400`
  - **Critical:** Credentials provider requires JWT strategy. Database sessions are unsupported by Auth.js v5 with Credentials.
- ✅ `src/middleware.ts` — Edge-compatible cookie-presence check (lightweight guard)
  - **Critical:** Cannot use `export { auth as middleware }` — Prisma and bcryptjs are Node.js-only, incompatible with the Edge runtime.
- ✅ Real session validation enforced server-side in `(panel)/layout.tsx` via `auth()`
- ✅ `src/app/api/auth/[...nextauth]/route.ts` — Auth.js route handler
- ✅ `src/lib/admin-auth.ts` — `requireAdminSession()` guard for all `/api/admin/*` routes

### Admin shell
- ✅ Route groups: `(auth)/login` (no sidebar), `(panel)/*` (sidebar shell)
- ✅ `src/app/admin/(auth)/login/page.tsx` — server action login form
- ✅ `src/components/admin/LoginForm.tsx` — client component with `useFormStatus`
- ✅ `src/app/admin/(panel)/layout.tsx` — session guard + sidebar + topbar
- ✅ `src/components/admin/Sidebar.tsx` — `usePathname` active-link highlighting
- ✅ `src/components/admin/TopBar.tsx` — user email + sign-out server action
- ✅ `src/app/admin/(panel)/page.tsx` — dashboard: stat cards, agent insights widget, quick actions

### Markdown renderer
- ✅ `src/lib/markdown.ts` — unified pipeline: remark-parse → remark-rehype → rehype-highlight → rehype-sanitize → rehype-stringify
- ✅ `src/components/ui/MarkdownRenderer.tsx` — async Server Component, `dangerouslySetInnerHTML`
- ✅ `src/app/globals.css` — `.markdown-content` prose styles (no `@tailwindcss/typography`)
- ✅ `/blog/[slug]` and `/projects/[slug]` render content via `MarkdownRenderer`

### Blog CRUD
- ✅ `src/app/api/admin/posts/route.ts` — `GET` list, `POST` create
- ✅ `src/app/api/admin/posts/[id]/route.ts` — `GET`, `PUT`, `DELETE`
- ✅ `src/components/admin/PostForm.tsx` — MDEditor (dynamic import, SSR disabled), tag chips, SEO fields, status selector, scheduling
- ✅ `src/app/admin/(panel)/blog/page.tsx` — post list with status badges
- ✅ `src/app/admin/(panel)/blog/new/page.tsx` — create form
- ✅ `src/app/admin/(panel)/blog/[id]/page.tsx` — edit form

### Project CRUD
- ✅ `src/app/api/admin/projects/route.ts` — `GET`, `POST`
- ✅ `src/app/api/admin/projects/[id]/route.ts` — `GET`, `PUT`, `DELETE`
- ✅ `src/components/admin/ProjectForm.tsx` — MDEditor, tech tags, type, featured, order
- ✅ `src/app/admin/(panel)/projects/page.tsx`
- ✅ `src/app/admin/(panel)/projects/new/page.tsx`
- ✅ `src/app/admin/(panel)/projects/[id]/page.tsx`

### Skills + Experience editors
- ✅ `src/app/api/admin/skills/route.ts` + `[id]/route.ts`
- ✅ `src/app/api/admin/experience/route.ts` + `[id]/route.ts`
- ✅ `src/app/admin/(panel)/skills/page.tsx` — grouped by category, inline server actions
- ✅ `src/app/admin/(panel)/experience/page.tsx` — inline server actions

### Agents + Tools dashboard
- ✅ `src/app/api/admin/agents/route.ts` — list agents with latest report
- ✅ `src/app/api/admin/agents/reports/[id]/route.ts` — mark as read
- ✅ `src/app/api/admin/tools/route.ts` + `[id]/route.ts`
- ✅ `src/app/admin/(panel)/agents/page.tsx` — agent list with unread badges
- ✅ `src/app/admin/(panel)/agents/[id]/page.tsx` — report list per agent
- ✅ `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx` — full report with MarkdownRenderer
- ✅ `src/app/admin/(panel)/tools/page.tsx` — tool shortcut grid, inline add/delete

### Media library
- ✅ `src/app/api/admin/media/upload/route.ts` — multipart upload to `public/uploads/`, DB record
- ✅ `src/app/api/admin/media/route.ts` — list assets
- ✅ `src/app/api/admin/media/[id]/route.ts` — delete (file + DB record)
- ✅ `src/components/admin/MediaUploader.tsx` — client upload component
- ✅ `src/app/admin/(panel)/media/page.tsx` — image grid + uploader

---

## Milestone 4 — AI Agents + Remaining Polish ✅

**Goal:** Agents produce real output. Admin dashboard shows live data. Remaining public pages complete.

- ✅ GitHub Summarizer — Anthropic API wired; `fetchGitHubProfile()` added; rawData includes repos + profile
- ✅ Blog Topic Suggester (`agents/blog-suggester.ts`) — existing titles + HN API → 5 suggestions with rationale
- ✅ Personal Brand Monitor (`agents/brand-monitor.ts`) — Brave/SerpAPI search; URL deduplication across reports
- ✅ Career Opportunity Watcher (`agents/opportunity-watcher.ts`) — Remotive API, LLM fit score
- ✅ `POST /api/admin/agents/[id]/run` — trigger agent on demand; status cycles idle → running → idle/error
- ✅ `RunAgentButton.tsx` — "Run now" button with spinner, Done ✓, Failed states; `label?` + `redirectOnSuccess?` props
- ✅ Agent status + `lastError` fields in DB and UI
- ✅ `/projects` — standalone filterable projects index page (SOFTWARE / ROBOTICS / HARDWARE / RESEARCH badges)
- ✅ Markdown renderer: copy-code button, auto-generated table of contents
- ✅ `rehype-sanitize` configured with `clobberPrefix: ""` so ToC anchor IDs are not mangled

---

## Milestone 4.5 — Skills Inference Agent ✅

- ✅ `src/lib/agents/skills-inference.ts` — fetches GitHub repo languages (top 15 repos), diffs against DB skills + project techTags + post tags, calls Claude haiku to produce structured diff JSON
- ✅ rawData shape: `{ type: "SKILLS_DIFF", add: [...], upgrade: [...], stale: [...] }`
- ✅ `agents/skills-inference.ts` — CLI runner; seeds agent row in DB on first run
- ✅ Report detail page renders SKILLS_DIFF as Apply/Upgrade tables with inline server actions — never auto-writes
- ✅ Skills page — "Sync from GitHub" button (`RunAgentButton` with `redirectOnSuccess`) appears once agent row exists

---

## Milestone 4.6 — AI-Powered CV Generation ✅

- ✅ `src/lib/cv-template.tsx` — `@react-pdf/renderer` PDF template: dark header, cyan accent, Profile/Skills/Experience/Projects/Contact sections
- ✅ `src/lib/agents/cv-generator.ts` — reads DB, calls Claude haiku (max_tokens 1500), falls back to raw DB build, renders PDF to `public/cv.pdf`, saves `cvContent`/`cvGeneratedAt`/`cvSource` to User
- ✅ `agents/cv-generator.ts` — CLI runner; seeds agent row in DB on first run
- ✅ Schema additions on `User`: `cvGeneratedAt DateTime?`, `cvSource String @default("manual")`, `cvContent Json?`
- ✅ `/admin/cv` — generated date + source badge, Open PDF link, Run now button, `CvEditor`, manual upload section
- ✅ `CvEditor.tsx` — editable summary, read-only skills list, experience + project editors, "Save & Render PDF"
- ✅ API routes (all `runtime = "nodejs"`, auth-gated): `POST /api/admin/cv/run`, `GET|PUT /api/admin/cv`, `POST /api/admin/cv/render`, `POST /api/admin/cv/upload`

---

## Milestone 4.7 — GitHub Project Importer ✅

- ✅ `src/lib/agents/github-project-importer.ts` — fetches public repos, filters by githubUrl, fetches README + languages (up to 5 new repos), calls Claude haiku, auto-creates draft Project rows
- ✅ rawData shape: `{ type: "PROJECT_CREATED", created: [...], skipped: N }`
- ✅ `agents/github-project-importer.ts` — CLI runner
- ✅ Report detail page renders PROJECT_CREATED as draft list with "Edit draft →" links; legacy PROJECT_SUGGESTIONS still renders "Create as Draft" action
- ✅ Projects page — "Import from GitHub" button (`RunAgentButton` with `redirectOnSuccess`) appears once agent row exists

---

## Milestone 4.8 — Inline Agent Triggers in Editors ✅

- ✅ `AgentSuggestPanel.tsx` — reusable client component: idle → loading → result panel → close
- ✅ Blog editor — "💡 Suggest topics" runs Blog Suggester inline; clicking a pill sets title, slug, tags
- ✅ Blog editor — "Generate content" calls `POST /api/admin/blog/generate-content`; streams markdown into editor
- ✅ `POST /api/admin/blog/generate-content` — 600–1000 word post via Claude haiku; auth-gated

---

## Milestone 4.9 — Multi-Platform Scraping & Dashboard ✅

- ✅ GitHub Summarizer extended with `fetchGitHubProfile()` — rawData includes `profile: { bio, location, blog, twitter_username, followers }`
- ✅ `src/lib/agents/twitter-profile.ts` — Twitter API v2; returns `null` gracefully if `TWITTER_BEARER_TOKEN` not set
- ✅ `src/lib/agents/platform-sync.ts` + `agents/platform-sync.ts` — orchestrates GitHub + Twitter; combined markdown report
- ✅ LinkedIn: no scraping (ToS) — `POST /api/admin/linkedin/import` parses Positions.csv + Skills.csv from data export
- ✅ Admin dashboard Platform Connections card: GitHub (green if configured), X/Twitter (grey + hint), LinkedIn (export link)
- ✅ AgentType enum: `SKILLS_INFERENCE`, `GITHUB_PROJECT_IMPORTER`, `CV_GENERATOR`, `PLATFORM_SYNC` added

---

## Milestone 4.10 — Pre-Deployment Security Audit ✅

Curl-based pentest (39 PASS / 0 FAIL / 2 WARN):

- ✅ Auth bypass — all `/api/admin/*` routes return 401 without session
- ✅ Admin route guard — all `/admin/*` pages return 307 to login
- ✅ Security headers — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` present
- ✅ Cookie flags — `HttpOnly`, `SameSite: lax`; `Secure` auto-set on HTTPS
- ✅ No stack trace / path disclosure in 404 or error responses
- ✅ Sensitive files (`.env`, `schema.prisma`, `.git/config`) return 404
- ✅ Rate limiting — contact form 429 at request 6
- ✅ Open redirect blocked on `callbackUrl`
- ✅ Path traversal blocked on `/api/admin/media`
- [ ] Nikto scan — pending (`sudo dnf install nikto && nikto -h http://localhost:3000` before VPS deploy)
- [ ] File upload MIME validation — pending (requires authenticated session)
- [ ] LinkedIn CSV input fuzzing — pending

---

## Milestone 4.11 — Agent Infrastructure Bug Fixes ✅

- ✅ `run/route.ts` — atomic concurrent-run guard: `prisma.agent.updateMany({ where: { status: { not: "running" } } })` replaces non-atomic read-check-update; only one request wins the lock
- ✅ GitHub importer creation loop — try-catch around `project.create`; P2002 skipped silently; empty slug/title pre-validated
- ✅ Report page `createProjectDraft` — try-catch for JSON.parse + prisma.create; P2002 → redirect `?error=slug-exists`; error banner rendered from `searchParams.error`
- ✅ Report page `applySkillAdd` / `applySkillUpgrade` — wrapped in try-catch; silent swallow on error
- ✅ `deleteProject` server action — `revalidatePath` calls added; deleted row disappears immediately
- ✅ `RunAgentButton` — error response body parsed; exposed as `title` tooltip on Failed button

---

## Milestone 4.12 — End-User Testing & Bug Fixes ✅

**Goal:** Walk through the entire app as a real user — both the public portfolio and the admin panel — find anything broken, confusing, or visually off, and fix it before deployment.

- ✅ `end-user-tester` subagent walkthrough — Phase 1 (public surface) produced 5 bugs (4× P2, 1× P3). Phase 2 (admin surface) hit tool-call ceilings; gaps closed by curl-driven API verification + code inspection. Full details in `docs/MILESTONE_4.12_BUG_LIST.md`.
- ✅ BUG-01 — blog `<title>`/`og:title` rendered blank because `post.seoTitle ?? post.title` passed through empty strings. Fixed with `||`.
- ✅ BUG-02 — `readTime` hardcoded as `""` in both DB-path blog fetchers. Replaced with `computeReadTime()` helper (200 wpm).
- ✅ BUG-03 — `ExperienceSection` and `ProjectsSection` returned `null` on empty data, removing `#experience`/`#projects` anchors and breaking nav links. Always render the section wrapper now.
- ✅ BUG-04 — CV PDF rendered "Invalid Date – Present" when experience startDate was invalid. Added `formatMonth()` guard in `cv-generator.ts` and 400-response validation in `POST /api/admin/experience`.
- ✅ BUG-05 — mobile nav overlay was semi-transparent; hero bled through. Nav + menu panel forced opaque when `menuOpen`.
- ✅ Re-verification (curl): `/api/admin/*` all 401, `/admin/*` all 307, robots disallows `/admin`, sitemap clean, contact 429 at req 6, M4.11 atomic concurrency guard intact, `tsc --noEmit` clean.
- ⬜ Coverage gaps deferred to post-deploy smoke test (manual, ~10 min): Suggest-topics inline UI, Generate-content streaming, admin CRUD public reflection, CV edit+re-render, media upload UI, tools shortcut UI, logout redirect, mobile nav visual, CV PDF with real experience data.

---

## Milestone 4.13 — Post-E2E Fix Pass + CV Overhaul ✅

**Goal:** Close out the findings from the Milestone 4.12 post-fix E2E test, then upgrade CV generation + editor so the PDF is tuned for software-engineering hiring and editable end-to-end inside the admin UI.

### Part A — Bug fixes from E2E test results
- ✅ Admin panel mobile layout — off-canvas sidebar drawer with hamburger at `< md` (`AdminShell.tsx` + `Sidebar.tsx` + `TopBar.tsx`)
- ✅ `POST /api/admin/media` → 405 — returns 405 with JSON pointing to `/api/admin/media/upload`
- ✅ `HEAD /uploads/<file>` — `next.config.mjs` `/uploads/:path*` header block adds `Access-Control-Allow-Methods: GET, HEAD`
- ✅ Dashboard agent-insights widget — last 5 reports with agent name + relative timestamp, each linking to report detail
- ✅ Brand Monitor stored error — confirmed no `$queryRaw`; ghost from transient old run, no code fix needed

### Part B — CV Generation refinement (IT-industry tuned)
- ✅ IT-tuned LLM prompt — action-verb bullets, 5 IT-standard skill categories, banned-words list, ATS-friendly headings
- ✅ CV template refresh — 9.5pt body, lineHeight 1.4, `yearsOfExperience?` in header
- ✅ `buildCvFromRaw()` brought to parity — same IT-standard category map and dynamic summary structure
- ✅ `sanitizeCvContent()` post-processor — strips "passionate", "synergy", weak verbs replaced with stronger alternatives
- ✅ Report preview — CV Generator report detail renders `cvContent` as human-readable cards (Profile / Skills / Experience / Projects)

### Part C — Full CV editor inside the CV tab
- ✅ Experience editor — per-row edit (company, role, dates, description, type, current), up/down reorder, delete
- ✅ Projects editor — "Show in CV" checkbox per row (`featured`), per-row title/summary/techTags editing
- ✅ Skills editor — 5 IT-standard category groups with chip delete + per-category Add input
- ✅ Unified "Save all & Render PDF" button — per-section dirty indicators (amber dot + "Unsaved changes")
- ✅ API surface — `PUT /api/admin/experience/[id]`, `PUT /api/admin/projects/[id]`, `PUT /api/admin/skills/[id]`

### Part D — Verification
- ✅ Chrome extension mobile test at 500px CSS viewport — hamburger, drawer, no horizontal overflow, dirty indicators
- ✅ `tsc --noEmit` clean on all changes
- ✅ `end-user-tester` walkthrough dispatched for full admin coverage

---

## Milestone 4.14 — Agent Usefulness Overhaul ✅

**Goal:** Turn every agent from a proof-of-concept into a tool that produces output the owner can act on immediately. All 35 improvement items plus full testing infrastructure.

### Testing Infrastructure (Phase 1)
- ✅ Vitest + @vitest/coverage-v8 + happy-dom installed; `npm test` / `npm run test:watch` scripts
- ✅ `vitest.config.ts` — Next.js-compatible, `@` alias to `./src`, happy-dom environment
- ✅ `src/lib/rate-limit.ts` — extracted `checkRateLimit()` from contact route; contact route updated to import it
- ✅ 8 test files, 79 tests: data, rate-limit, cv-generator helpers, skills-inference helpers, admin-auth integration, admin-routes guard scan, agents-run endpoint, agent helper types
- ✅ `.github/workflows/ci.yml` — added `npm test` step + `npm run build` step (build uses `DATABASE_URL="prisma+postgres://ci"` so isMock() returns true and pages use mock data without a real DB)

### Bug Fix Pass (Phase 2)
- ✅ **SI-A [BUG]** — `normaliseCategoryEnum()` maps `"LANGUAGE"` → `"LANGUAGES"`, `"FRAMEWORK"` → `"FRAMEWORKS"`, etc.; called before every `prisma.skill.create` in skills-inference
- ✅ `ProjectsSection.tsx` — "View all on GitHub" link uses `OWNER.github` (was hardcoded `yourusername`)
- ✅ `src/app/admin/(panel)/projects/page.tsx` — metadata uses `OWNER.name` (was hardcoded "Alex Kowalski")

### CV Generator (CV-A through CV-F)
- ✅ **CV-D** — Model upgraded to `claude-sonnet-4-6`, `max_tokens: 4096`, `temperature: 0`
- ✅ **CV-A** — `mode: "portfolio" | "targeted"` parameter; portfolio mode writes `public/cv.pdf`; targeted saves timestamped file
- ✅ **CV-B** — `jobDescription?: string` input; LLM rewrites summary + bullets to match JD keywords
- ✅ **CV-C** — `POST /api/admin/cv/scrape-jd` — fetch + HTML-strip + 3000-char truncation; wired in `CvTargetForm.tsx`
- ✅ **CV-E** — Two variants (robotics-heavy + software-heavy) in one LLM call; both PDFs rendered; report detail shows both previews
- ✅ **CV-F** — ATS keyword gap table (present / absent columns) shown inline in report detail

### GitHub Summarizer (GH-A through GH-D)
- ✅ **GH-A** — `rawData.type = "GITHUB_AUDIT"` with four structured arrays: missing descriptions, missing READMEs, missing topics, portfolio gaps
- ✅ **GH-B** — DB cross-reference: each portfolio-gap item includes pre-built `/admin/projects/new?githubUrl=<url>` link
- ✅ **GH-C** — `classifyActivity()`: Active / Recent / Dormant per repo based on `pushed_at`; active repos not in portfolio flagged
- ✅ **GH-D** — `buildProfileConsistency()`: GitHub bio/location/blog/twitter vs DB values; per-field mismatch table in report

### Skills Inference (SI-B through SI-D)
- ✅ **SI-B** — "Apply all X additions" batch button → `prisma.skill.createMany()`; per-row approval kept for upgrades + stale
- ✅ **SI-C** — Job-market relevance tag: cross-references latest non-empty OW report; shows hit count per suggestion row
- ✅ **SI-D** — Single GitHub GraphQL query (`primaryLanguage` + `languages { nodes }` for all repos); REST fallback on GraphQL failure

### Opportunity Watcher (OW-A through OW-E)
- ✅ **OW-A** — Keywords stored in `Agent.config`; editable in admin UI; seeds from hardcoded array on first run
- ✅ **OW-B** — We Work Remotely RSS + HackerNews Algolia "Who's Hiring" sources added; failures swallowed; `rawData.sources[]` metadata
- ✅ **OW-C** — `seenJobUrls` in `Agent.config`; only new jobs reported; "X new jobs (Y seen)" header
- ✅ **OW-D** — Per-job match score 1–10 via LLM; sorted descending; top-3 get "strong match" badge
- ✅ **OW-E** — Resend email alert when any job scores ≥ threshold; opt-in via `OPPORTUNITY_ALERT_EMAIL=true` + `OPPORTUNITY_ALERT_THRESHOLD`

### Brand Monitor (BM-A through BM-C)
- ✅ **BM-A** — Google Alerts RSS feeds from `GOOGLE_ALERTS_RSS_FEEDS` env var; LLM sentiment classification; `seenGuids` dedup in config
- ✅ **BM-B** — GitHub star/fork delta vs `Agent.config.lastSnapshot`; per-repo delta table in report
- ✅ **BM-C** — Dev.to mention detection via public API; `seenDevToIds` dedup; empty state shown when 0 mentions

### Blog Suggester (BS-A through BS-D)
- ✅ **BS-A** — HN Algolia top stories (last 7 days) fed to LLM alongside existing post titles
- ✅ **BS-B** — Dev.to trending `?top=7` cross-referenced against owner's existing post tags
- ✅ **BS-C** — `series: { title, posts[] }[]` in rawData; report detail renders series groups with "Create all as drafts" action
- ✅ **BS-D** — `POST /api/admin/blog/generate-outline` route; `PostForm.tsx` shows outline preview + "Skip" before full content generation
- ✅ `/admin/blog/new?title=<title>` — page reads `searchParams.title` and passes as `initialData` to PostForm

### Robotics News (RN-A through RN-C)
- ✅ **RN-A** — `generateDigest()`: 5-item LLM digest with "why this matters"; fallback to top-5 raw items + `digestError` warning chip
- ✅ **RN-B** — RSS URLs from `ROBOTICS_RSS_FEEDS` env var; current URLs are default if var absent
- ✅ **RN-C** — `seenUrls` in `Agent.config`; only new articles surfaced; "X new articles" header

### GitHub Project Importer (GPI-A through GPI-C)
- ✅ **GPI-A** — `--sync` CLI flag: re-fetches description/topics/languages/README for existing repos; LLM produces update diff
- ✅ **GPI-B** — `scoreReadme()`: 0–5 score (title, description, install/usage, code blocks, links); shown in import report
- ✅ **GPI-C** — `GITHUB_IMPORT_BATCH` env var (default 5, range 1–20)
- ✅ LLM URL hallucination fix — `projectData.githubUrl` overwritten with authoritative `repo.html_url` after LLM response

### Platform Sync (PS-A through PS-C)
- ✅ **PS-A** — DB experience count vs LinkedIn import history; gap report
- ✅ **PS-B** — `buildProfileConsistency()`: name/bio/URL/location mismatch table (GitHub API vs DB User row)
- ✅ **PS-C** — Twitter/X optional: full report produced without token; X section appended only if `TWITTER_BEARER_TOKEN` set

### Agent Infrastructure
- ✅ `prisma/schema.prisma` — `config Json?` added to Agent model; `db:push` applied
- ✅ `src/lib/agents/types.ts` — optional `_updatedConfig` field on `AgentRunResult`
- ✅ `src/lib/agents/index.ts` — wrapper loads `agent.config` before run, persists `_updatedConfig` after success
- ✅ `src/app/api/admin/agents/[id]/run/route.ts` — persists `_updatedConfig` to Agent.config on successful run

### Deploy Prep (Phase 7)
- ✅ `.dockerignore` — excludes `.git`, `.github`, `.next`, `node_modules`, `.env*`, `docs/`, `coverage`
- ✅ `docker-compose.yml` — healthcheck added to app service (curl `/`, 30s interval, 3 retries)
- ✅ `next.config.mjs` — `output: "standalone"` confirmed (required by Dockerfile multi-stage build)
- ✅ `.github/workflows/deploy.yml` — SSH deploy via appleboy/ssh-action on CI success; gated to main branch
- ✅ `docs/SECURITY.md` — Pre-Deploy Checklist with Nikto scan instructions added

---

## Milestone 5 — Homelab Deployment ✅

**Target server:** `192.168.0.104` (hostname: `homelab`, Ubuntu 24.04.4 LTS)
**Access:** SSH as `diboy` (full sudo). Docker 29.4.0 + Compose v5.1.3 pre-installed.
**Scope:** LAN-only deployment — no public domain, HTTP on port 80.
**Not in scope:** Let's Encrypt (requires public domain — defer to M5.5 when domain added).

### Server snapshot (scouted 2026-04-19)
- 2 CPU cores · 7.6 GB RAM (5.7 GB free) · 56 GB disk (18 GB free)
- Already running: n8n on :5678, n8n-mcp on :4000, twingate, vibe-kanban on :3000
- Port 80 free · Port 443 free · UFW inactive
- No repo cloned yet · No Nginx binary (Docker image used)

---

### Phase 0 — Owner Portfolio Data (run before deploying)

Before the app is deployed, fill in real personal data so the built image serves your content, not placeholders.

**How:** Run the `/setup-portfolio` Claude Code skill in this repo. It asks for each piece of data interactively, then rewrites `src/lib/mock-data.ts` and commits.

```bash
# In Claude Code (this repo):
/setup-portfolio
```

The skill walks through six sections one at a time:
1. **Personal info** — name, tagline, bio, email, GitHub, LinkedIn, location
2. **Skills** — languages, frameworks, robotics/embedded, tools, optional extra categories
3. **Work experience** — reverse-chronological, up to 5 entries
4. **Robotics / highlight cards** — up to 4 cards (or replace with software specialisms)
5. **Mock projects** — optional; 11 real GitHub projects already in DB
6. **Confirmation + write** — shows summary, asks for approval, then rewrites file and commits

The skill does **not** modify `BLOG_POSTS` (manage posts via admin panel).

After the skill commits, the content is in git and will be baked into the Docker image on first deploy.

- ✅ Run `/setup-portfolio` and confirm all sections are accurate
- ⬜ Place `public/photo.jpg` in the repo (portrait photo, recommended ≥ 400×400px)
- ⬜ Push both changes before running Phase 4

---

### Phase 1 — Nginx LAN Config

The existing `nginx/portfolio.conf` requires a domain + TLS certs. Create a LAN variant
`nginx/portfolio-lan.conf` that serves HTTP only on port 80 and `server_name _`.

**`nginx/portfolio-lan.conf`:**
```nginx
server {
    listen 80;
    server_name _;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 20M;

    location / {
        proxy_pass         http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**`docker-compose.override.yml`** (LAN — mounts LAN config, drops port 443):
```yaml
services:
  nginx:
    ports:
      - "80:80"
    volumes:
      - ./nginx/portfolio-lan.conf:/etc/nginx/conf.d/default.conf:ro
```

The base `docker-compose.yml` keeps `443:443` for when a domain is added; the override drops it.

- ✅ Create `nginx/portfolio-lan.conf`
- ✅ Create `docker-compose.override.yml`

---

### Phase 2 — Dockerfile Build Fix

The Dockerfile runs `npm run build` without `DATABASE_URL` set.
`prisma.ts` throws at module load if `DATABASE_URL` is absent, but the dynamic
`await import("./prisma")` is only reached when `isMock()` is false — so absent
`DATABASE_URL` causes `isMock()` to return true and the build succeeds without a DB.

However, `npx prisma generate` in the builder stage also needs the `DATABASE_URL`
environment variable to be available for the Prisma CLI to pick up `prisma.config.ts`.
Add a build ARG to satisfy it at build time:

```dockerfile
# In the builder stage, after COPY . .
ARG DATABASE_URL=prisma+postgres://build-placeholder
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma generate
RUN npm run build
```

- ✅ Add `ARG DATABASE_URL=prisma+postgres://build-placeholder` + `ENV` to Dockerfile builder stage

---

### Phase 3 — Server Setup & `.env` Creation

SSH into `192.168.0.104` and run:

```bash
# 1. Clone repo
git clone git@github.com:DBOYttt/my-portfolio.git ~/my-portfolio
cd ~/my-portfolio

# 2. Create .env (production values)
cp .env.example .env
# Edit .env — fill in all required vars (see table below)
nano .env
```

**Required `.env` values for LAN deployment:**

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgres://portfolio:STRONG_PASS@db:5432/portfolio_db` |
| `POSTGRES_PASSWORD` | `STRONG_PASS` (same as above) |
| `AUTH_SECRET` | `openssl rand -base64 32` output |
| `AUTH_URL` | `http://192.168.0.104` |
| `ADMIN_EMAIL` | owner's email |
| `ADMIN_PASSWORD` | strong password (min 12 chars) |
| `ANTHROPIC_API_KEY` | from console.anthropic.com |
| `GITHUB_USERNAME` | owner's GitHub username |
| `GITHUB_TOKEN` | GitHub PAT with `public_repo` scope |
| `NEXT_PUBLIC_BASE_URL` | `http://192.168.0.104` |
| `RESEND_API_KEY` | from resend.com (optional — contact form) |
| `CONTACT_EMAIL` | delivery address for contact form |

All other variables optional — fill in as needed.

- ✅ SSH into server and clone repo (at `~/portfolio`)
- ✅ Create and populate `.env`

---

### Phase 4 — First Deploy

```bash
cd ~/my-portfolio

# 1. Build image
docker compose build app

# 2. Start DB (wait for healthy)
docker compose up -d db
docker compose ps   # wait until db is healthy

# 3. Apply schema + seed admin user
docker compose run --rm app npx prisma db push
docker compose run --rm app npm run db:seed

# 4. Start everything
docker compose up -d

# 5. Verify
curl http://localhost/          # should return HTML
curl http://localhost/admin     # should redirect to /admin/login
docker compose ps               # all three services Up (healthy)
```

- ✅ `docker compose build app`
- ✅ `docker compose up -d db` + wait for health
- ✅ Schema pushed via host (`DATABASE_URL=postgres://...@127.0.0.1:5432/... npx prisma db push`)
- ✅ Admin user seeded via host (`DATABASE_URL=... npm run db:seed`)
- ✅ `docker compose up -d`
- ✅ Verify: `curl http://localhost/` returns 200

---

### Phase 5 — Cron Jobs for Agents

Agents run from the **host server** (`/home/diboy/projects/my-portfolio`) using `npx tsx`, connecting to the Docker postgres via `127.0.0.1:5432`. The `agents/` directory is not included in the Docker standalone image — running from host avoids this limitation.

```bash
# On the host machine (crontab -e for user diboy)
PORTFOLIO_DB=postgres://portfolio:PASSWORD@127.0.0.1:5432/portfolio_db

# GitHub Summarizer — daily 07:00
0 7 * * * cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/github-summarizer.ts >> ~/logs/agent-github.log 2>&1

# Skills Inference — daily 07:05
5 7 * * * cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/skills-inference.ts >> ~/logs/agent-skills.log 2>&1

# GitHub Project Importer — weekly Monday 07:10
10 7 * * 1 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/github-project-importer.ts >> ~/logs/agent-importer.log 2>&1

# Blog Suggester — weekly Monday 08:00
0 8 * * 1 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/blog-suggester.ts >> ~/logs/agent-blog.log 2>&1

# Opportunity Watcher — weekly Monday 08:05
5 8 * * 1 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/opportunity-watcher.ts >> ~/logs/agent-jobs.log 2>&1

# Robotics News — weekly Wednesday 08:00
0 8 * * 3 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/robotics-news.ts >> ~/logs/agent-robotics.log 2>&1

# Brand Monitor — weekly Friday 08:00
0 8 * * 5 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/brand-monitor.ts >> ~/logs/agent-brand.log 2>&1

# Platform Sync — weekly Sunday 09:00
0 9 * * 7 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/platform-sync.ts >> ~/logs/agent-platform.log 2>&1

# CV Generator — weekly Sunday 09:05
5 9 * * 7 cd ~/portfolio && DATABASE_URL=$PORTFOLIO_DB npx tsx agents/cv-generator.ts >> ~/logs/agent-cv.log 2>&1
```

- ✅ `mkdir -p ~/logs` on server
- ✅ All 9 agent cron entries installed via `crontab -e`

---

### Phase 6 — Owner Content Population

At this point the app is live but serving placeholder data. Owner must:

1. **Fill in `OWNER` object** — if not done in Phase 0, run `/setup-portfolio` now (Claude Code skill) or edit `src/lib/mock-data.ts` directly. Rebuild + redeploy after.
2. **Add photo** — place `public/photo.jpg` inside the running container:
   ```bash
   docker cp ~/photo.jpg my-portfolio-app-1:/app/public/photo.jpg
   ```
   Or rebuild image after placing file in repo.
3. **Add real skills** — via admin panel `/admin/skills`
4. **Add real experience** — via admin panel `/admin/experience`
5. **Publish or edit projects** — 11 draft projects imported from GitHub; review + publish via `/admin/projects`
6. **Run CV Generator** — via `/admin/cv` → "Run now" (requires `ANTHROPIC_API_KEY`)
7. **Run GitHub Summarizer** — to populate first audit report
8. **Commit & redeploy** after mock-data changes:
   ```bash
   git pull && docker compose build app && docker compose up -d app
   ```

- ✅ Fill in `OWNER` in `src/lib/mock-data.ts` and push (done via `/setup-portfolio`)
- ✅ All 9 agents ran via CLI — DB rows seeded, 9 initial reports created
- ✅ GitHub Project Importer ran — 4 GitHub repos imported as draft projects
- ✅ GitHub Summarizer ran — first audit report saved
- ✅ `force-dynamic` added to `src/app/page.tsx` + `src/app/blog/page.tsx` — pages were pre-rendering as static HTML at build time, bypassing the real DB at runtime; rebuild + redeploy applied
- ⬜ Add real skills via `/admin/skills`
- ⬜ Add real experience via `/admin/experience`
- ⬜ Place `public/photo.jpg` in repo → `git push` (auto-deploy or manual `docker compose build app && docker compose up -d app`)
- ⬜ Review + publish the 4 imported draft projects via `/admin/projects`
- ⬜ Run CV Generator via `/admin/cv` → "Run now"

---

### Phase 7 — Update Deploy Workflow

The existing `.github/workflows/deploy.yml` uses SSH deploy via Twingate (server is LAN-only). Add secrets in GitHub repo settings:

| Secret | Value |
|--------|-------|
| `TWINGATE_SERVICE_KEY` | JSON key from Twingate Admin → Service Accounts → `github-actions-deploy` |
| `SSH_HOST` | `192.168.0.104` |
| `SSH_USER` | `diboy` |
| `SSH_KEY` | Contents of `~/.ssh/id_ed25519` (private key with server access) |

**Twingate setup (one-time):**
1. Twingate Admin Console → Settings → Service Accounts → New Service Account → name it `github-actions-deploy`
2. Assign it access to the `192.168.0.104` resource
3. Generate a service key → copy the JSON → paste into `TWINGATE_SERVICE_KEY` secret

- ⬜ Create `github-actions-deploy` Twingate service account and assign resource access
- ✅ Added `ANTHROPIC_API_KEY`, `GH_PAT_TOKEN`, `GH_USERNAME`, `AUTH_SECRET`, `SSH_HOST`, `SSH_USER`, `SSH_KEY` secrets to GitHub repo settings
- ✅ Updated deploy workflow: Twingate connect step added, correct path (`~/portfolio`), `docker compose build app`
- Note: `TWINGATE_SERVICE_KEY` already set. Auto-deploy will work once the Twingate service account is configured and assigned the 192.168.0.104 resource.

---

### Phase 8 — Smoke Test

```bash
# From dev machine (192.168.0.x)
curl -s http://192.168.0.104/ | grep "<title>"      # portfolio title
curl -I http://192.168.0.104/admin                   # 307 → /admin/login
curl -I http://192.168.0.104/api/contact             # 405 (not POST)
# Open browser → http://192.168.0.104 → full walkthrough
# Log into admin → run one agent → verify report appears
```

- ✅ Curl smoke tests pass (200, 307→login, 405, robots.txt)
- ✅ Admin login works (`AUTH_URL=http://192.168.0.104`, admin: `andrzejcn041@gmail.com`)
- ✅ All 4 services healthy (app, db, nginx, career-ops)
- ✅ 7 AI agent cron jobs installed via `scripts/setup-cron.sh`
- ⬜ Browser walkthrough: public sections load with real data (pending after skills/experience added)
- ⬜ CV PDF generated and downloadable (run via `/admin/cv`)
- ⬜ Contact form sends email (requires `RESEND_API_KEY` in `.env`)

---

### Future: Adding HTTPS (when domain added)

When a domain is pointed at this server:
1. Install Certbot: `sudo apt install certbot`
2. Obtain cert: `sudo certbot certonly --standalone -d yourdomain.com`
3. Copy certs to `nginx/certs/`: `fullchain.pem` + `privkey.pem`
4. Switch to `nginx/portfolio.conf` (remove override): update `docker-compose.override.yml` to use the main conf and re-add 443 port
5. Update `.env`: `AUTH_URL=https://yourdomain.com`, `NEXT_PUBLIC_BASE_URL=https://yourdomain.com`
6. `docker compose up -d nginx`
7. Set up cert renewal cron: `0 3 1 * * certbot renew && docker compose exec nginx nginx -s reload`

---

## Milestone 5.5 — Engineering Logbook Redesign ✅

**Goal:** Complete visual overhaul of the public portfolio — from dark slate to bone-paper Engineering Logbook aesthetic.

### Design System
- ✅ CSS custom properties (`--paper`, `--paper-2`, `--ink`, `--ink-soft`, `--ink-faint`, `--hairline`, `--rule`, `--accent`, `--accent-soft`, `--highlight`) in `globals.css`
- ✅ Light mode (`:root`) and dark mode (`[data-theme="dark"]`) using oklch colour values
- ✅ Light/dark theme toggle in Nav, persisted in `localStorage` key `logbook-theme`
- ✅ FOUC prevention via `next/script strategy="beforeInteractive"` in `layout.tsx`
- ✅ `suppressHydrationWarning` on theme-toggle button and decorative SVG `<path>` elements

### Typography (via `next/font/google`)
- ✅ Newsreader — serif body, headings, italic emphasis (`--font-newsreader`)
- ✅ Inter Tight — navigation, UI labels, buttons (`--font-inter-tight`)
- ✅ JetBrains Mono — code, metadata labels, `.mono` class (`--font-mono`)

### Hand-drawn SVG primitives
- ✅ `src/components/ui/hand-drawn.tsx` — `HandRule`, `HandUnderline`, `HandArrow`, `SectionHead`, `SketchPlaceholder`, and supporting primitives
- ✅ All primitives use `useMemo` for path computation; `suppressHydrationWarning` on `<path>` elements to handle PRNG SSR/hydration differences

### Layout classes (globals.css)
- ✅ `.page` — max-width 1060px container
- ✅ `.logbook-section` — section with vertical padding
- ✅ `.logbook-row` — two-column grid: margin column (120px) + body column
- ✅ `.margin` — left margin column for marginalia
- ✅ `.entry` / `.entry-head` / `.entry-body` / `.entry-tags` / `.entry-actions` — expandable logbook entry rows
- ✅ `.pill` — small status badge
- ✅ `.btn-link` — Newsreader italic link with arrow
- ✅ `.serif` / `.mono` / `.hl` / `.num` / `.meta` / `.arr` / `.fn` / `.stack` / `.row` / `.sketch-frame` / `.nav` / `.nav-num` / `.theme-toggle` — utility classes
- ✅ Old classes removed: `.section-container`, `.card`, `.tag`, `.btn-primary`, `.btn-secondary`, `.section-heading`, `.accent-line`

### Public section components (all rewritten)
- ✅ `Nav.tsx` — logbook nav with section numbers, theme toggle
- ✅ `HeroSection.tsx`
- ✅ `AboutSection.tsx`
- ✅ `SkillsSection.tsx`
- ✅ `ExperienceSection.tsx`
- ✅ `ProjectsSection.tsx`
- ✅ `RoboticsSection.tsx`
- ✅ `BlogPreviewSection.tsx`
- ✅ `ContactSection.tsx`
- ✅ `Footer.tsx`
- ✅ `src/components/public/ProjectFilter.tsx` — new client component for projects page filtering

### Pages
- ✅ `src/app/blog/page.tsx` — updated to logbook tokens
- ✅ `src/app/projects/page.tsx` — updated to logbook tokens

### DB schema additions
- ✅ `Project.year String?` — display year e.g. "2024" used in logbook entry header
- ✅ `Project.sketchLabel String?` — label for engineering sketch placeholder
- ✅ Both fields pushed to production DB via host-side `db:push` after deploy

### Production fix
- ✅ Post-merge 500 error resolved — `Project.year` column was missing in production DB; fixed by running `db:push` via host-side connection

---

## Milestone 6 — Polish + Analytics ⬜

**Goal:** Public site scores 90+ Lighthouse. Ready for employer sharing.

### Performance
- ⬜ Lighthouse audit — fix all issues below 90
- ⬜ Lazy load below-fold sections
- ⬜ Loading skeletons for DB-fetched content

### Accessibility
- ⬜ Full keyboard navigation test
- ⬜ Screen reader test on homepage
- ⬜ Color contrast audit (WCAG AA)
- ⬜ Skip-to-content link

### Analytics
- ⬜ Self-hosted Umami (Docker, same VPS)
- ⬜ Add Umami tracking script to layout (privacy-first, no cookies)

### Already done in M5.5
- ✅ `next/font` for Newsreader, Inter Tight, JetBrains Mono
- ✅ Theme toggle in Nav
- ✅ CSS variables for both themes in globals.css
- ✅ Persist preference in localStorage

---

## Milestone 6.5 — Admin Panel Audit & Bug Fixes ✅

**Goal:** Walk through every admin panel section as a real user, find all bugs and rough edges, and fix them before adding the MCP layer on top.

### Scope
- ✅ Dashboard — stat cards, agent insights widget, platform connections card, quick actions
- ✅ Blog — list view, create post (MDEditor loads, tags, SEO fields, status selector), edit, delete; "Suggest topics" panel; "Generate content" streaming; blog post reflected on public `/blog`
- ✅ Projects — list, create, edit, delete; published project reflected on public `/projects`
- ✅ Skills — grouped list, add skill per category, delete skill, category labels correct
- ✅ Experience — list, add entry, edit inline (added in this milestone), delete
- ✅ Agents — agent list with status badges, "Run now" cycle, report appears after run, report detail renders
- ✅ CV — page loads, CvEditor fields editable, Save & Render PDF flow, targeted CV form visible
- ✅ Media — image grid loads, upload, file appears, delete
- ✅ Tools — shortcut list, add shortcut, delete shortcut
- ✅ Mobile layout at ≤ 768px — hamburger, off-canvas drawer, no overflow

### Bugs found and fixed (branch: `fix/m65-admin-audit`)
- ✅ **P2** — `CvEditor.tsx`: skill categories all showed as "Other" — maps used pluralised enum values (`LANGUAGES`, `FRAMEWORKS`…) that don't exist; corrected to `LANGUAGE`, `FRAMEWORK`, `DATABASE`, `TOOL`, `OTHER`
- ✅ **P2** — `experience/page.tsx`: no inline edit capability — added `updateExperience` server action and per-entry edit form
- ✅ **P3** — All 14 admin panel pages missing `metadata` titles — every page now has a distinct browser tab title
- ⬜ **P3** — `robots.txt` sitemap URL shows `yourdomain.com` — fix: set `NEXT_PUBLIC_BASE_URL` in `.env` before VPS deployment (not a code bug)

### Deliverables
- ✅ Bug list with severity (P1/P2/P3) and reproduction steps
- ✅ All P1 and P2 bugs fixed (none found; 2 P2 + 3 P3 total)
- ✅ P3 bugs triaged — code P3s fixed; env-config P3 deferred to deploy checklist

---

## Milestone 7 — MCP Server for AI Content Population ✅

**Goal:** Expose the entire portfolio as an MCP server so AI agents (Claude Desktop, Claude Code, n8n) can read and write content without going through the web admin panel.

### MCP Server Package
- ✅ `mcp-server/` directory — standalone TypeScript package with `@modelcontextprotocol/sdk`
- ✅ stdio transport (for Claude Desktop / Claude Code)
- ✅ HTTP/SSE transport (for n8n / remote agents)
- ✅ Auth: `MCP_SECRET` env var — bearer token on HTTP mode; stdio requires local access
- ✅ Reuses `{ prisma }` singleton — no separate DB connection

### Resources (read-only)
- ✅ `portfolio://owner` — owner bio, tagline, location, status
- ✅ `portfolio://posts` — all published posts (title, slug, excerpt, tags, date)
- ✅ `portfolio://posts/{slug}` — full post with Markdown content
- ✅ `portfolio://projects` — all published projects (title, slug, summary, techTags, type)
- ✅ `portfolio://projects/{slug}` — full project with case study content
- ✅ `portfolio://skills` — skills grouped by category
- ✅ `portfolio://experience` — experience entries in chronological order
- ✅ `portfolio://agent-reports` — latest report per agent (title + summary)
- ✅ `portfolio://cv` — current CV JSON (structured: summary, skills, experience, projects)

### Tools (write operations)
- ✅ `create_post` — title, content (Markdown), excerpt, tags, status (DRAFT/PUBLISHED)
- ✅ `update_post` — by slug; any subset of fields
- ✅ `delete_post` — by slug; marks as DRAFT first (soft delete)
- ✅ `create_project` — title, summary, content, techTags, type, githubUrl, liveUrl
- ✅ `update_project` — by slug; any subset of fields
- ✅ `add_skill` — name, category, level
- ✅ `remove_skill` — by name + category
- ✅ `add_experience` — company, role, description, startDate, endDate, type
- ✅ `update_owner_info` — name, bio, tagline, location (writes to User table)
- ✅ `run_agent` — by AgentType; uses existing AGENT_RUNNERS; returns report title when done
- ✅ `generate_cv` — triggers CV Generator; returns path to rendered PDF

### Admin Panel Integration
- ✅ `/admin/mcp` status page — connection mode (stdio/HTTP), last tool call timestamp, recent tool call log (last 20 entries from AuditLog)
- ✅ MCP entry in admin sidebar
- ✅ Each MCP tool call writes to `AuditLog` with `action: "mcp.tool_call"` + tool name + entity metadata

### n8n Integration Guide
- ✅ `docs/MCP_SETUP.md` — setup instructions for Claude Desktop, Claude Code, and n8n HTTP mode
- ✅ Example n8n workflow: "When GitHub push → run GitHub Summarizer → read report → update project description"

---

## Milestone 7.5 — Career-Ops Integration (CV + Job Search) ✅

**Goal:** Ship [career-ops](https://github.com/santifer/career-ops) as a git submodule inside this repo so all requirements travel together. Claude Code drives career-ops inside an isolated Docker container that has zero access to the portfolio database or auth secrets — a web breach of the public portfolio cannot reach the CV agent. The portfolio admin panel gets a Career section to trigger evaluations and publish the master CV.

### Architecture

```
Internet ──► Nginx ──► Next.js app ──► PostgreSQL        (portfolio network)
                           │
                    auth-gated API
                    (POST /api/admin/career/*)
                           │
                    internal HTTP call           cv_output volume (shared)
                           ▼                            ▲
                     career-ops service ──────────────── │  (career-ops-net, isolated)
                     └─ Claude Code CLI                  │
                     └─ Playwright / Chromium            │
                     └─ career-ops submodule  ───────────┘ writes PDFs here

career-ops env: ANTHROPIC_API_KEY only — no DATABASE_URL, no AUTH_SECRET
portfolio env:  full secrets — career-ops cannot see them
```

- **`career-ops/`** — git submodule (`santifer/career-ops`), checked in at this path
- **`cv_output/`** — Docker named volume; career-ops writes PDFs, portfolio reads `master.pdf` → `public/cv.pdf`
- **`career-ops` Docker service** — isolated network, Claude Code + Playwright inside, exposes internal HTTP trigger API
- **`scripts/setup-career-ops.sh`** — one-shot setup: submodule init, npm install, playwright install, scaffold config if missing
- **`src/app/admin/(panel)/career/`** — new admin section: trigger evaluations, browse pipeline, publish CV

### Phase 1 — Add career-ops as a git submodule
- ✅ `git submodule add https://github.com/santifer/career-ops.git career-ops` — adds `.gitmodules` and pins the submodule at HEAD
- ✅ `git submodule update --init --recursive` to verify checkout works
- ✅ Add `career-ops/` to `.dockerignore` exclusions for the portfolio build (it's only used by the career-ops service)
- ✅ Commit `.gitmodules` and the submodule pointer

### Phase 2 — Automatic setup script
- ✅ Create `scripts/setup-career-ops.sh`:
  - `git submodule update --init --recursive`
  - `cd career-ops && npm install`
  - `npx playwright install chromium --with-deps`
  - Scaffold `career-ops/config/profile.yml` from `profile.example.yml` if absent
  - Scaffold `career-ops/cv.md` with a placeholder header if absent
  - Print next-steps: edit `career-ops/config/profile.yml`, fill `career-ops/cv.md`
- ✅ Make it executable: `chmod +x scripts/setup-career-ops.sh`
- ✅ Add `npm run setup:career-ops` script in `package.json` → `bash scripts/setup-career-ops.sh`
- ✅ Document in `README.md` (or `.env.example` header) that `npm run setup:career-ops` must be run after first clone

### Phase 3 — career-ops HTTP trigger server
Career-ops is designed for interactive Claude Code sessions. We need a thin wrapper so the portfolio admin can trigger it headlessly.
- ✅ Create `career-ops-server/server.js` (a new top-level directory, NOT inside the submodule):
  - Minimal Express/http server on `CAREER_OPS_PORT` (default `4200`)
  - `POST /evaluate` — accepts `{ url: string }`, shells out `claude -p "/career-ops [url]"` inside the `career-ops/` directory, streams output to a log file, returns `{ jobId }` immediately
  - `GET /status/:jobId` — returns job status + last N lines of log
  - `POST /cv/master` — triggers `claude -p "/career-ops-pdf"` to regenerate the master CV PDF; copies output to the shared `cv_output` volume path
  - `GET /pipeline` — reads `career-ops/pipeline.json` (career-ops tracker file) and returns it as JSON
  - Auth: `CAREER_OPS_INTERNAL_SECRET` header check — only the portfolio `app` service knows this value
- ✅ `career-ops-server/package.json` with only `express` as dependency
- ✅ `career-ops-server/Dockerfile` — `node:20-slim` base; installs Claude Code CLI (`npm install -g @anthropic-ai/claude-code`); installs Playwright Chromium; copies `career-ops/` submodule and server code; runs `server.js`

### Phase 4 — Docker Compose: isolated career-ops service
- ✅ Add `career-ops` service to `docker-compose.yml`:
  ```yaml
  career-ops:
    build:
      context: .
      dockerfile: career-ops-server/Dockerfile
    restart: unless-stopped
    environment:
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      CAREER_OPS_PORT: ${CAREER_OPS_PORT:-4200}
      CAREER_OPS_INTERNAL_SECRET: ${CAREER_OPS_INTERNAL_SECRET}
      CV_OUTPUT_PATH: /cv_output
    volumes:
      - cv_output:/cv_output
    networks:
      - career-ops-internal   # can reach app; cannot reach db
  ```
- ✅ Add `career-ops-internal` network (bridge) to `docker-compose.yml` — career-ops joins this; `app` joins both `portfolio` and `career-ops-internal`; `db` joins only `portfolio`
- ✅ Add `cv_output` named volume to `docker-compose.yml`
- ✅ Mount `cv_output` in the `app` service at `/app/public/cv-output` so Next.js can read published PDFs directly
- ✅ Add `CAREER_OPS_INTERNAL_URL` (e.g. `http://career-ops:4200`) and `CAREER_OPS_INTERNAL_SECRET` to `app` service environment
- ✅ Add all new env vars to `.env.example` with comments

### Phase 5 — Portfolio admin integration
- ✅ `src/app/api/admin/career/evaluate/route.ts` — `POST`, auth-gated, proxies to `career-ops` service `POST /evaluate`; stores job ID in a new `CareerJob` table or as a JSON blob in `Agent.config`
- ✅ `src/app/api/admin/career/status/[jobId]/route.ts` — `GET`, proxies to `career-ops` service `GET /status/:jobId`
- ✅ `src/app/api/admin/career/pipeline/route.ts` — `GET`, reads pipeline JSON from `career-ops` service
- ✅ `src/app/api/admin/career/cv/publish/route.ts` — `POST`, tells career-ops to regenerate master CV, then symlinks/copies `cv_output/master.pdf` to `public/cv.pdf`
- ✅ `src/app/admin/(panel)/career/page.tsx` — Career admin page:
  - Input field: paste a job URL → POST to `/api/admin/career/evaluate` → shows live status
  - Pipeline table: list of evaluated jobs from `GET /pipeline`, with score, status, PDF download link
  - "Publish master CV" button → `POST /api/admin/career/cv/publish` → confirms `public/cv.pdf` updated
- ✅ Add "Career" nav link to admin sidebar (in `src/components/admin/AdminNav.tsx` or equivalent)

### Phase 6 — Remove old portfolio agents
*Supersedes M4.6 (CV Generation) and the OW-* items in M4.14.*
- ✅ Delete `agents/cv-generator.ts` and `src/lib/agents/cv-generator.ts`
- ✅ Delete `agents/opportunity-watcher.ts` and `src/lib/agents/opportunity-watcher.ts`
- ✅ Remove `CV_GENERATOR` and `OPPORTUNITY_WATCHER` from `AgentType` enum in `prisma/schema.prisma` → `npm run db:push` → `npm run db:generate`
- ✅ Remove both from `src/lib/agents/index.ts` → `AGENT_RUNNERS`
- ✅ Simplify `/admin/cv` page to upload-only — remove AI generation UI, `CvTargetForm`, and associated dead API routes (`/run`, `/render`, `/scrape-jd`)
- ✅ Delete `src/lib/cv-template.tsx` and remove `@react-pdf/renderer` from `package.json`
- ✅ Drop `cvContent Json?`, `cvSource String`, `cvGeneratedAt DateTime?` from `User` schema → `npm run db:push`
- ✅ Remove `OPPORTUNITY_ALERT_EMAIL`, `OPPORTUNITY_ALERT_THRESHOLD` from `.env.example`
- ✅ Update test suite: remove cv-generator and opportunity-watcher unit tests; `npm test` must still pass

### Phase 7 — Docs update
- ✅ Update `docs/AI_AGENTS.md` — remove cv-generator and opportunity-watcher; add career-ops section describing the submodule, Docker service, and Claude Code driver
- ✅ Update `CLAUDE.md` — remove the two deprecated agent CLI commands; add `career-ops` submodule and `npm run setup:career-ops` to the setup section; note that career-ops is driven by Claude Code in an isolated container
- ✅ Update `docs/ARCHITECTURE.md` — add career-ops service to the deployment diagram and describe the isolation model

### Owner actions after this milestone
- ⬜ Run `npm run setup:career-ops`, then fill in `career-ops/config/profile.yml` and `career-ops/cv.md` with real details
- ⬜ Do the initial onboarding session: `cd career-ops && claude` → ask Claude to adapt archetypes and scoring to your background
- ⬜ Run 5–10 real job evaluations to calibrate scoring weights before relying on the pipeline

---

## Milestone 8 — Pre-Launch Audit Fix Sprint ✅

**Goal:** Address all findings from the 2026-05-12 three-agent assessment (`docs/PRE_M8_ASSESSMENT.md`) before the Cloudflare tunnel opens. All 18 in-scope findings fixed across two branches; merged to `main` 2026-05-12.

### Group 1 — Hard Blockers ✅
**Branch:** `fix/pre-m8-blockers` (merged)

- ✅ **F-01** — POST `/api/admin/projects` silently drops `publishedAt` — added `publishedAt` to `prisma.project.create()` with ISO date validation and P2002 → 409 error handling
- ✅ **F-02** — Content-Security-Policy header — added to `nginx/portfolio.conf` and `nginx/portfolio-lan.conf` (Nginx is single source of truth; `unsafe-eval` omitted for production builds)
- ✅ **F-03** — `NEXT_PUBLIC_BASE_URL=https://diboy.dev` — owner deployment action, set in production `.env` before tunnel opens
- ✅ **F-10** — Mobile grid clips `.entry-meta-right` — added `grid-column: 1 / -1` to `.entry-meta-right` in `@media (max-width: 760px)` block in `src/app/globals.css`

### Group 2 — Pre-Traffic Polish ✅
**Branch:** `fix/pre-traffic-polish` (merged)

#### Career-ops reliability
- ✅ **F-04** — Polling interval leaks on unmount: cleanup `useEffect(() => () => stopPolling(), [stopPolling])` added to `CareerEvaluateForm.tsx`
- ✅ **F-05** — Pipeline table stale after evaluation: `router.refresh()` added inside `pollStatus` on done/error/catch branches
- ✅ **F-06** — Auto-save errors silently swallowed: `saveError` state + red dot indicator; clears on successful save; `res.ok` check added to `persistConfig`
- ✅ **F-07** — No cancel during evaluation: Cancel button shown while `evaluating` is true; calls `stopPolling()` and resets state
- ✅ **F-08** — CV publish 404 shows raw error: maps `res.status === 404` → "No CV found. Run a job evaluation first."
- ✅ **F-14** — `portfolio_url` hardcoded as `""`: now `process.env.NEXT_PUBLIC_BASE_URL ?? ""` in `src/app/api/admin/career/sync/route.ts`
- ✅ **F-15** — Twitter field label/placeholder: label → "Twitter handle", placeholder → "@yourhandle"

#### Admin panel polish
- ✅ **F-09** — Sidebar `<Link>` bypasses `beforeunload`: `UnsavedChangesContext` + provider wrapping `(panel)/layout.tsx`; `PostForm` + `ProjectForm` call `setDirty`; Sidebar `onClick` intercepts with `window.confirm` (modifier-key guard for open-in-new-tab)
- ✅ **F-11** — Skills API error lists non-existent enum values: corrected to `LANGUAGE, FRAMEWORK, TOOL, ROBOTICS, EMBEDDED, DATABASE, OTHER`
- ✅ **F-12** — Escape key doesn't close mobile nav: `if (e.key === "Escape") { setOpen(false); return; }` added to `Nav.tsx` keydown handler
- ✅ **F-13** — `dismissStaleSkill` missing revalidatePath for current report: added `revalidatePath(\`/admin/agents/reports/${reportId}\`)` in `reports/[reportId]/page.tsx`
- ✅ **F-17** — Experience/Writing sections `return null` breaks nav anchors: both sections now render placeholder shell preserving `id="experience"` / `id="writing"` when DB is empty
- ✅ **F-18** — PostForm SCHEDULED button reads "Create post": three-way ternary added — Published / Scheduled / Draft
- ✅ **F-20** — Blog admin empty state has no CTA: "Create your first →" link added

### Group 3 — Deferred to M11 Growth Features
- F-16 — Blog search and tag filtering
- F-19 — RSS/Atom feed at `/blog/feed.xml`
- F-21 — "Back to top" button on blog post detail
- Blog pagination (plan before post count exceeds ~20)

---

## Milestone 9 — Cloudflare Zero Trust Tunnel (diboy.dev) ✅

**Goal:** Expose the homelab server at `192.168.0.104` to the public internet on `diboy.dev` via Cloudflare Zero Trust Tunnel. No open router ports. Cloudflare handles HTTPS automatically.

### Phase 1 — Migrate DNS to Cloudflare
- ✅ Add `diboy.dev` to Cloudflare (free plan) → Add a Site
- ✅ Copy the two Cloudflare nameservers provided (angela + noel)
- ✅ Log into name.com → diboy.dev → Nameservers → replaced with Cloudflare's NS records
- ✅ Verify propagation: `dig NS diboy.dev`

### Phase 2 — Create Cloudflare Tunnel
- ✅ Cloudflare dashboard → Zero Trust → Networks → Tunnels → Create tunnel
- ✅ Name: `portfolio-homelab`
- ✅ Tunnel token saved and installed

### Phase 3 — Install cloudflared on 192.168.0.104
- ✅ Downloaded and installed `cloudflared` 2026.5.0 (latest Linux amd64 .deb)
- ✅ Installed as systemd service: `sudo cloudflared service install <TUNNEL_TOKEN>`
- ✅ Enabled + started: 4 connections to Cloudflare Warsaw edge (waw02/03/04) via QUIC

### Phase 4 — Configure Public Hostnames
- ✅ Zero Trust → Tunnels → portfolio-homelab → Public Hostnames
- ✅ `diboy.dev` (root) → `http://localhost:80`
- ✅ `www.diboy.dev` → `http://localhost:80`

### Phase 5 — Update App Config and Redeploy
- ✅ Updated `~/projects/my-portfolio/.env` on server: `AUTH_URL=https://diboy.dev`, `NEXT_PUBLIC_BASE_URL=https://diboy.dev`
- ✅ Fixed `docker-compose.yml`: `NEXT_PUBLIC_SITE_URL` → `NEXT_PUBLIC_BASE_URL`
- ✅ Fixed `Dockerfile`: added `ARG NEXT_PUBLIC_BASE_URL` so SWC bakes correct URL into sitemap/robots at build time
- ✅ Created `nginx/portfolio-cf.conf`: hardcoded `X-Forwarded-Proto "https"`, HSTS, `CF-Connecting-IP` for real-IP rate limiting
- ✅ Rebuilt and redeployed

### Phase 6 — Verify
- ✅ `https://diboy.dev` → HTTP/2 200, `server: cloudflare`
- ✅ `https://diboy.dev/admin` → 307 → /admin/login
- ✅ `https://www.diboy.dev` → HTTP/2 200
- ✅ HSTS header: `max-age=31536000; includeSubDomains`
- ✅ Sitemap uses `https://diboy.dev` URLs
- ✅ robots.txt: `Disallow: /admin`, sitemap points to `https://diboy.dev/sitemap.xml`

---

## Milestone 9.5 — Content Population & Post-Launch Polish ✅

**Goal:** Fill the live site with real content, fix post-launch operational issues, and polish the public presentation.

### Admin & Auth
- ✅ Admin credentials updated: email → `andrzejczn@diboy.dev`, password changed
- ✅ Re-seeded admin user via `npx tsx prisma/seed.ts` on server

### Theme
- ✅ Dark mode set as default — `data-theme="dark"` on `<html>` SSR, FOUC script defaults to dark, Nav client fallback updated

### Infrastructure Fixes
- ✅ `scripts/run-agent.sh` — translates `@db:5432` → `@127.0.0.1:5432` so cron agent runs work from the host
- ✅ `.mcp.json` — removed from git tracking, added to `.gitignore` (contains real DB credentials); local copy configured for Claude Code MCP access
- ✅ SSH tunnel pattern established: `ssh -f -N -L 5432:127.0.0.1:5432 diboy@192.168.0.104` enables MCP tools from dev machine

### Skills (DB)
- ✅ 21 skills seeded via MCP `add_skill` tool across 6 categories:
  - Languages: C#, C++, Python, TypeScript, JavaScript, Java
  - Frameworks: .NET, Next.js, Prisma, Node.js, Three.js
  - Robotics: Arduino, WPILib, CAD, Fusion 360
  - Tools: Docker, Git, Linux, n8n
  - Database: PostgreSQL
  - Other: PyTorch, scikit-learn, Matplotlib

### Experience (DB)
- ✅ 4 entries seeded via MCP `add_experience` tool:
  - NewTech — Database Administration Intern (2021–2023)
  - Team 9155 FRC — Member & Team Captain (2020–2024)
  - Fundacja IB Polska & Chorągiew Krakowska ZHP — Volunteer (2024)
  - JCC Krakow — Volunteer (2021–2022)

### Projects (DB)
- ✅ GitHub Project Importer agent ran and created 3 draft projects from public repos
- ✅ Personal Portfolio Platform added manually via MCP `create_project` (title, summary, full content, tech tags, live URL)

### Blog
- ✅ 1 post published: "Building a Self-Hosted Portfolio with AI Agents" — real technical content about the platform architecture

### Public Sections
- ✅ Profile photo added at `public/profile.png` — studio portrait, displayed in About section margin
- ✅ Autodesk Fusion 360 robot model embedded in Robotics section (full-width iframe, 520px tall, above highlights grid)
- ✅ nginx CSP updated to allow `frame-src https://gmail3794190.autodesk360.com`
- ✅ Contact email updated in `mock-data.ts`: `andrzejczn@diboy.dev`

### Branch Cleanup
- ✅ `feat/cli-scripts` deleted (local + remote) — scripts merged into main
- ✅ `feat/m9-cloudflare-tunnel` deleted (local + remote) — merged into main

---

## Milestone 10 — Open Source Preparation ⬜

**Goal:** Make the repository public and usable by others as a self-hosted portfolio starter. Anyone should be able to clone it, fill in their own content, and deploy it without touching the codebase.

### Code Hygiene
- ⬜ Audit all hardcoded personal references — ensure everything is in `src/lib/mock-data.ts` or `.env`
- ⬜ Remove any committed secrets, personal tokens, or private URLs from git history (`git filter-repo` if needed)
- ⬜ Verify `.gitignore` covers `.env`, `public/cv.pdf`, `public/photo.jpg`, and any local overrides

### Documentation
- ⬜ `README.md` — rewrite intro to address an external user ("fork this to build your own portfolio"), not the owner
- ⬜ Add "Quick Start" section: clone → fill `.env.example` → `npm run dev`
- ⬜ `docs/CONTRIBUTING.md` — contribution guidelines, PR expectations, issue templates
- ⬜ `LICENSE` file — choose and add a licence (MIT recommended)
- ⬜ `.github/ISSUE_TEMPLATE/` — bug report + feature request templates
- ⬜ `.github/pull_request_template.md` — PR checklist

### Configuration
- ⬜ Ensure all personal config is driven by env vars or `mock-data.ts` — no owner-specific defaults in code
- ⬜ `src/lib/mock-data.ts` — replace all real personal data with clearly labelled placeholders (`"Your Name"`, `"your@email.com"`, etc.)
- ⬜ Verify `npm run dev` works out-of-the-box with zero `.env` setup (mock mode)
- ⬜ Verify `docker compose up` with only `.env.example` values produces a working deployment

### GitHub Repository
- ⬜ Make repository public on GitHub
- ⬜ Add repository topics: `nextjs`, `portfolio`, `typescript`, `prisma`, `tailwindcss`, `self-hosted`, `mcp`
- ⬜ Add a social preview image (`public/og-image.png` or GitHub repo settings)
- ⬜ Pin repository on GitHub profile

---

## Milestone 11 — Growth Features ⏸ (Deferred)

Defer until site is live and generating traffic.

- ⏸ Newsletter integration (Resend audiences or Buttondown)
- ⏸ Testimonials/references section
- ⏸ Blog comments (spam risk — low priority)
- ⏸ TOTP/2FA for admin login
- ⏸ Multi-language support

---

## Infra Notes for Future Agents

### DATABASE_URL
Must be a direct `postgres://` connection string — **not** `prisma+postgres://`.
The `PrismaPg` adapter uses the `pg` library which requires a standard postgres TCP connection.
The `prisma+postgres://` URL is for the Prisma Accelerate protocol only.

Local dev with `prisma dev` running:
```
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable"
```
Note: use `127.0.0.1`, not `localhost` — on this machine `localhost` resolves to `::1` (IPv6) but postgres only listens on `127.0.0.1`.

### Schema changes
Use `npx prisma db push` (not `migrate dev`). The Prisma dev proxy does not support the shadow database required by `migrate dev`.

### Seeding
```bash
DATABASE_URL="postgres://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable" npm run db:seed
```

### Auth.js v5 + Credentials
- JWT strategy is mandatory — `strategy: "database"` is unsupported with Credentials provider.
- Middleware must be an Edge-compatible cookie check. Do not `export { auth as middleware }` — Prisma and bcryptjs cannot run in the Edge runtime.
