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

## Milestone 4 — AI Agents + Remaining Polish ⬜ (CURRENT)

**Goal:** Agents produce real output. Admin dashboard shows live data. Remaining public pages complete.

### Agent completions
- ⬜ Wire Anthropic API in `agents/github-summarizer.ts` (stub exists at `TODO(M4)`)
- ⬜ Replace regex RSS parser in `agents/robotics-news.ts` with `rss-parser` npm package
- ⬜ Add more feed sources to robotics agent (IEEE Spectrum, Hackaday, ROS Discourse)
- ⬜ **Blog Topic Suggester** agent — inputs: existing titles + recent GitHub + recent news → 5 suggestions
- ⬜ **Personal Brand Monitor** agent — search owner name via Brave/SerpAPI, deduplicate mentions
- ⬜ **Career Opportunity Watcher** agent — Adzuna or Remotive API, LLM fit score
- ⬜ **Skills Inference agent** — analyses blog posts, project content, and GitHub repo data to detect technologies and concepts actually in use; suggests new skills to add or proficiency upgrades for existing ones; owner reviews suggestions in `/admin/agents` before anything is written to DB (never auto-writes — always a human-approval step)

### Admin agent controls
- ⬜ `POST /api/admin/agents/[id]/run` — trigger agent on demand
- ⬜ "Run now" button on `/admin/agents` page
- ⬜ Agent status field (idle / running / error) + last error message in DB + UI

### Public pages
- ⬜ `/projects` — standalone filterable projects index page (filter by type: SOFTWARE / ROBOTICS / HARDWARE / RESEARCH)

### Markdown renderer improvements
- ⬜ Copy-code button on code blocks
- ⬜ Table of contents sidebar for long posts

### Infra
- ⬜ GitHub Actions CI: lint + type-check on push

---

## Milestone 4.5 — Skills Inference Agent ⬜

**Goal:** The skills page stays accurate without manual maintenance. The agent reads what the owner actually builds — blog posts, project descriptions, GitHub repos — and surfaces technologies and concepts they demonstrably use. Owner approves before anything changes.

### Why this matters for a portfolio
Skills listed on most portfolios are self-reported and often stale. This agent makes the skills section evidence-based: every item can be traced back to a real project, commit, or post — which is far more credible to a technical employer.

### How it works

```
GitHub repos (languages, topics, README content, recent commits)
  + Project records in DB (content, tech tags)
  + Blog post content in DB
        ↓
Anthropic Claude extracts and scores technologies
        ↓
Cross-references against existing Skill rows in DB
        ↓
Produces a diff: suggested additions, proficiency upgrades, stale removals
        ↓
Writes AgentReport — owner reviews in /admin/agents
        ↓
Owner clicks "Apply" per suggestion → writes to Skill table
```

### Agent: `agents/skills-inference.ts`
- **GitHub source** — fetch repos via GitHub API: primary language per repo, repo topics, README text, languages breakdown (`/repos/{owner}/{repo}/languages`)
- **DB sources** — read all `Project.content` + `Project.techTags`, all `Post.content` and `Post.tags`
- **LLM prompt** — ask Claude to extract a deduplicated list of technologies with evidence snippets, then score each as FAMILIAR / PROFICIENT / EXPERT based on frequency and depth of use
- **Diff logic** — compare against existing `Skill` rows; flag: new (not in DB), upgrade (current level lower than inferred), stale (in DB but no evidence found in any source)
- **Output** — structured JSON: `{ add: [...], upgrade: [...], stale: [...] }` with evidence snippets per item
- Writes one `AgentReport` with the full diff as the summary (markdown table)

### Admin UI additions
- `/admin/agents` report shows the diff as a table: Skill | Current level | Suggested level | Evidence source
- Per-row "Apply" button (inline server action) — writes the change to `Skill` table
- "Apply all additions" bulk action
- Stale skills are highlighted but never auto-removed — owner decides

### Trigger modes
- On demand via "Run now" button
- Scheduled weekly (after GitHub Summarizer runs, so data is fresh)
- Could also run after a new blog post or project is published

### Schema — no changes needed
Uses existing `Skill`, `Agent`, `AgentReport` tables. Evidence snippets live in the report JSON (`rawData`).

---

## Milestone 4.6 — AI-Powered CV Generation ⬜

**Goal:** The CV at `public/cv.pdf` is always up to date. When skills, experience, or projects change in the DB, an agent re-generates a well-structured PDF automatically — no manual document editing ever again.

### How it works

```
DB change (skills / experience / projects / OWNER info)
    ↓
CV Generator agent reads all current data from DB
    ↓
Anthropic Claude structures and writes the CV content
    ↓
PDF rendered via @react-pdf/renderer (or puppeteer)
    ↓
PDF written to public/cv.pdf (served by Next.js as a static file)
    ↓
Admin notified via agent report in /admin/agents
```

### Trigger modes
- **On demand** — "Regenerate CV" button in admin (calls `POST /api/admin/agents/cv-generator/run`)
- **Automatic** — agent runs after any save in `/api/admin/skills`, `/api/admin/experience`, `/api/admin/projects`
- **Scheduled** — weekly cron job as a fallback catch-all

### Agent: `agents/cv-generator.ts`
- Reads from DB: `User` (OWNER info), all `Skill` rows grouped by category, all `Experience` rows ordered by date, all `Project` rows (featured first)
- Sends structured data to Anthropic API with a CV-writing system prompt:
  - Tailor tone for software engineering / robotics roles
  - Order sections: Summary → Skills → Experience → Projects → Education
  - Keep bullet points action-verb first ("Built", "Designed", "Led")
  - Output: clean structured JSON (`{ summary, skills[], experience[], projects[] }`)
- Renders the structured JSON to PDF

### PDF rendering
Use `@react-pdf/renderer` (runs in Node.js, no browser needed):
- `src/lib/cv-template.tsx` — React PDF document component
  - Matches portfolio design tokens: dark/light theme option, monospace font for code labels
  - Sections: Header (name, title, contact, links), Summary, Skills (grouped), Experience (timeline), Projects (featured only, with tech tags)
- `agents/cv-generator.ts` calls `renderToBuffer(CvDocument)` → writes `public/cv.pdf`

Alternative: Puppeteer rendering a hidden `/cv/print` Next.js page to PDF (more layout control, heavier dependency).

### API route
- `POST /api/admin/agents/cv-generator/run` — triggers the agent, returns job ID
- Auth-gated via `requireAdminSession()`
- Writes an `AgentReport` row on completion (or failure) so the result appears in `/admin/agents`

### Admin UI additions
- "Regenerate CV" button on `/admin/agents` page (or on a dedicated `/admin/cv` page)
- Shows last generated timestamp
- Preview link: opens `/cv.pdf` in new tab
- AgentReport entry shows what changed vs previous generation

### Schema additions
No new models needed. The agent uses the existing `Agent` + `AgentReport` tables.
Consider adding a `cvGeneratedAt DateTime?` field to the `User` model to track last generation time.

### Dependencies to install
```bash
npm install @react-pdf/renderer
# or, if using puppeteer approach:
npm install puppeteer
```

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
