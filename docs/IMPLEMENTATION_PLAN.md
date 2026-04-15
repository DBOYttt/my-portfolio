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

## Milestone 5 — Deployment ⬜ (CURRENT)

**Goal:** Live on a real domain with HTTPS, SSL, and a real PostgreSQL instance.

- ⬜ Provision VPS (Hetzner CX22 or equivalent)
- ⬜ Docker Compose deployment (Next.js + PostgreSQL + Nginx)
- ⬜ Nginx HTTPS with Let's Encrypt (Certbot)
- ⬜ Set all production env vars (see `.env.example`)
- ⬜ `npm run db:push && npm run db:seed` on first deploy
- ⬜ Owner places `public/photo.jpg`
- ⬜ Run CV Generator agent to produce initial `public/cv.pdf` (replaces manual placement)
- ⬜ Cron jobs for agents (`crontab -e` on VPS)
- ⬜ Update `OWNER` object in `src/lib/mock-data.ts` with real info

---

## Milestone 6 — Polish + Analytics ⬜

**Goal:** Public site scores 90+ Lighthouse. Ready for employer sharing.

### Performance
- ⬜ Lighthouse audit — fix all issues below 90
- ⬜ `next/font` for Inter and JetBrains Mono (eliminates Google Fonts request)
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

### Dark/light mode
- ⬜ Theme toggle in Nav
- ⬜ CSS variables for both themes in globals.css
- ⬜ Persist preference in localStorage

---

## Milestone 7 — Growth Features ⏸ (Deferred)

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
