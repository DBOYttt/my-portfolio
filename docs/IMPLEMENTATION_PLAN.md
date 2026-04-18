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

## Milestone 4.13 — Post-E2E Fix Pass + CV Overhaul ⬜

**Goal:** Close out the findings from the Milestone 4.12 post-fix E2E test (`docs/MILESTONE_4.12_E2E_TEST_RESULTS.md`), then upgrade CV generation + editor so the PDF is tuned for software-engineering hiring and editable end-to-end inside the admin UI.

### Part A — Bug fixes from E2E test results

- ⬜ **Admin panel mobile layout** — every `/admin/*` page except `/admin/login` overflows horizontally on 414×900 (+60px to +400px). Collapse the sidebar to an off-canvas drawer with a hamburger toggle on viewports `< md`. Content column should fill viewport width. Touch targets ≥ 44px.
  - Files: `src/app/admin/(panel)/layout.tsx`, `src/components/admin/Sidebar.tsx`, `src/components/admin/TopBar.tsx`.
- ⬜ **`POST /api/admin/media` → 405** — collection root has no POST handler (uploads go to `/api/admin/media/upload`). Either implement POST at the root as an alias for upload, or explicitly return a helpful 404/405 with a `Location`/`Link` header pointing at the correct path. Decide based on REST convention.
  - File: `src/app/api/admin/media/route.ts`.
- ⬜ **`HEAD /uploads/<file>` → 503** — static assets should answer HEAD with 200/404, not 503. Investigate whether this is a Next.js static-serving oddity or something else (custom middleware swallowing HEAD?). Add a HEAD handler in the upload route or serve uploads through a thin route handler.
  - Files: `src/middleware.ts`, `next.config.js` (if headers/rewrites are involved), or a new static route wrapper.
- ⬜ **Dashboard agent-insights widget shape mismatch** — currently shows only an aggregate "29 unread agent reports" count. Expand to show the last 3–5 reports per-agent with title + relative timestamp (e.g. "GitHub Activity — April 2026 · 2h ago"), each linking to the report detail page.
  - Files: `src/app/admin/(panel)/page.tsx`, possibly a new `AgentInsightsWidget.tsx`.
- ⬜ **Brand Monitor stored error** — report status shows "bind message supplies 7 parameters, but prepared statement requires 0" from a prior run. Investigate whether this is from raw `$queryRaw` usage with mismatched placeholders; if so, fix the query. If it's environmental (stale error state from before `BRAND_MONITOR_API_KEY` was unset), clear the error field on successful re-run.
  - Files: `src/lib/agents/brand-monitor.ts`, possibly the agent run-result handler.

### Part B — CV Generation refinement (IT-industry tuned)

- ⬜ **Prompt rewrite** — `src/lib/agents/cv-generator.ts` prompt currently says "professional CV writer" with generic instructions. Replace with an IT-specific system prompt:
  - Voice: technical, action-verb-led bullets (e.g. "Architected", "Shipped", "Automated"), no filler.
  - Summary: 3 sentences max, must mention stack keywords + 1 quantified outcome (if available from experience descriptions).
  - Experience bullets: 2–3 bullets per role, start with strong verbs, include concrete tech (languages, frameworks, scale indicators) pulled from the experience description and skills list.
  - Skills section grouping: prefer industry-standard categories — Languages, Frameworks & Libraries, Databases, Tools & Platforms, Concepts (replace whatever category labels the DB uses).
  - Projects: lead with the tech stack in brackets, then a 1-sentence impact statement.
  - ATS-friendly: no columns, no tables, no images, simple section headings that match common ATS section names ("Summary", "Skills", "Experience", "Projects", "Contact").
- ⬜ **CV template refresh** — `src/lib/cv-template.tsx`. Keep the dark-header + cyan-accent design language (matches portfolio aesthetic), but improve typography hierarchy, reduce whitespace waste, add a 1-line "years of experience" indicator below the name if derivable from earliest experience row, and ensure all section headings are bold, 12pt+, detectable by ATS parsers. Keep single-column. Keep ≤ 2 pages (the template should truncate the Projects section if bytes get too large).
- ⬜ **Fallback template parity** — `buildCvFromRaw()` in the same file currently produces a formulaic 3-sentence template. Rewrite to match the same structural quality as the LLM path — action-verb bullets pulled straight from `experience.description`, skills grouped into IT-standard categories, same "Summary" opening line format. This is the path that runs when `ANTHROPIC_API_KEY` is unset (confirmed by Batch 4 row A10).
- ⬜ **Industry-keyword hygiene** — post-process LLM output to strip any marketing fluff ("passionate", "synergy", "results-driven", "dynamic team player") and replace weak verbs ("helped", "worked on", "involved in") with stronger alternatives. Simple regex pass, implemented in `cv-generator.ts` before `renderCvToPdf`.
- ⬜ **Report preview** — CV Generator report detail page should render a human-readable preview of the generated `cvContent` (not just the raw JSON dump), so the owner can proof-read before downloading the PDF.
  - File: `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx`.

### Part C — Full CV editor inside the CV tab

Currently `CvEditor` only exposes the summary textarea and the file upload input (confirmed by Batch 4 row A7 SKIP). The owner has to edit skills on `/admin/skills` and experience on `/admin/experience`, then re-run the agent. Make the CV tab self-contained.

- ⬜ **Summary editor** — keep existing textarea, add a character/word counter with a soft target (e.g. 350–600 chars).
- ⬜ **Experience editor** — add an inline list of experience rows with per-row edit buttons. Each row exposes: role, company, startDate, endDate, current, description (markdown), type. Editing a row calls `PUT /api/admin/experience/[id]` (may need to be added if not present) and re-fetches. Reorder via drag handle or up/down buttons persists `order` field.
- ⬜ **Projects editor** — same pattern as experience but for `Project` rows. Only `featured` projects appear in the CV, so add a "Show in CV" checkbox per row (maps to `featured`). Per-row edit: title, summary, techTags, featured.
- ⬜ **Skills editor** — inline grouped list. Add/edit/delete per category. Same fields as `/admin/skills` but embedded in the CV tab so the owner doesn't navigate away. Category-based grouping must match the IT-standard categories from Part B.
- ⬜ **Live preview pane** — optional stretch: show a side-by-side text preview of what will render in the PDF, updated as the owner types. If time-constrained, skip and rely on "Save & Render → Open PDF" round-trip.
- ⬜ **Unified Save & Render** — single "Save all & Render PDF" button at the top of the editor. Saves any dirty rows across all sections, then triggers `POST /api/admin/cv/render`. Shows per-section dirty indicators so the owner knows what changed.
- ⬜ **API surface** — add any missing routes: `PUT /api/admin/experience/[id]` (update), `PUT /api/admin/projects/[id]` (update), `PUT /api/admin/skills/[id]` (update). All behind `requireAdminSession`. Return the updated row on success.

### Part D — Verification

- ⬜ Re-run the Batch 4 CV lifecycle test (or the focused subset) — all 10 rows should PASS (A7 "SKIP" should become PASS once non-summary editing is exposed).
- ⬜ Manual mobile smoke test at 414×900: sidebar drawer opens/closes, all admin pages fit within viewport, no horizontal overflow.
- ⬜ Dashboard agent insights widget displays last 3–5 report titles per recent agent.
- ⬜ CV PDF with a real experience row + skill + project — manually eyeball for IT-industry tone, no filler phrases, ATS-parseable structure.

---

## Milestone 5 — Deployment ⬜

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
