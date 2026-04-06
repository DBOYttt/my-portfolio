# Implementation Plan

## Status Legend
- ✅ Done
- 🔄 In progress
- ⬜ Not started
- ⏸ Deferred

---

## Milestone 1 — Foundation ✅

**Goal:** Project compiles, runs without setup, public portfolio is visually complete with mock data.

### Tasks
- ✅ Next.js 14 (App Router, TypeScript, Tailwind v3) scaffold
- ✅ Prisma schema — all entities (User, Post, Project, Skill, Experience, Agent, AgentReport, MonitoredTopic, ToolShortcut, AuditLog, MediaAsset)
- ✅ Auth.js middleware guard on `/admin/*`
- ✅ Public sections: Nav, Hero, About, Skills, Experience, Projects, Robotics, Blog preview, Contact, Footer
- ✅ `src/lib/mock-data.ts` — zero-config content layer
- ✅ MockModeBanner — shows when running without DB
- ✅ Contact form API route with rate limiting
- ✅ AI agent scripts: GitHub Summarizer, Robotics News Curator
- ✅ Docker Compose + Nginx production config
- ✅ `.env.example` with all variables documented
- ✅ `CLAUDE.md`, `docs/` documentation suite
- ✅ GitHub repository: https://github.com/DBOYttt/my-portfolio

---

## Milestone 2 — Full Public Portfolio ⬜

**Goal:** Every public page is complete, SEO-ready, and connected to the database. Site is deployable.

### Tasks

#### Content pages
- ⬜ `/projects/[slug]` — full case study detail page
  - Hero with cover image, problem/approach/outcome sections
  - Tech stack tags, GitHub link, live demo link
  - "← Back to projects" navigation
- ⬜ `/projects` — standalone projects index page (filterable by type)
- ⬜ `/experience` — standalone timeline page

#### Data layer
- ⬜ Projects section: fetch from DB when `DATABASE_URL` is set, fall back to `mock-data.ts`
- ⬜ Experience section: same pattern
- ⬜ Skills section: same pattern

#### Contact form
- ⬜ Wire Resend email delivery in `/api/contact/route.ts`
- ⬜ Add honeypot field for spam reduction

#### CV
- ⬜ Add `public/cv.pdf` (owner provides real file)
- ⬜ `/cv` page with brief resume summary + download button

#### SEO
- ⬜ `sitemap.xml` — via `next-sitemap` or App Router `sitemap.ts`
- ⬜ `robots.txt` — disallow `/admin`, allow everything else
- ⬜ JSON-LD `Person` schema on homepage
- ⬜ JSON-LD `Article` schema on blog posts
- ⬜ OG image — static initially (`public/og-image.png`), dynamic via `next/og` later
- ⬜ Per-page `<title>` and `<meta description>` from mock-data/DB

#### Owner photo
- ⬜ Add real photo to `public/photo.jpg`
- ⬜ Update `AboutSection.tsx` to use `<Image src="/photo.jpg" alt="..." />`

#### Deployment
- ⬜ Set up VPS (Hetzner CX22 recommended)
- ⬜ Docker Compose deployment
- ⬜ Nginx HTTPS with Let's Encrypt (Certbot)
- ⬜ PostgreSQL running in Docker
- ⬜ `npm run db:seed` on first deploy
- ⬜ GitHub Actions CI: lint + type-check on push

---

## Milestone 3 — Admin Panel + Blog ⬜

**Goal:** Owner can manage all content via admin panel. No code changes needed for content updates.

### Admin shell
- ⬜ Admin layout: sidebar navigation, content area, top bar with logout
- ⬜ Dashboard overview: stats row, recent posts, agent digest preview, quick actions
- ⬜ Login page at `/admin/login` (Auth.js credentials form)
- ⬜ Audit log table populated on admin actions

### Blog management
- ⬜ Blog post list (`/admin/blog`)
  - Table: title, status badge, published date, tags, edit/delete actions
  - Filter by status (draft/published/scheduled)
- ⬜ Create post (`/admin/blog/new`)
  - Markdown editor with live preview (`@uiw/react-md-editor`)
  - Title, slug (auto-generated, editable), excerpt
  - Featured image upload
  - Tags (create on-the-fly), category selector
  - SEO fields: seoTitle, seoDesc
  - Status: draft / published / scheduled (with date picker)
- ⬜ Edit post (`/admin/blog/[id]`)
- ⬜ Delete post (with confirmation)
- ⬜ Public blog listing reads from DB (`/blog`)
- ⬜ Public blog post detail (`/blog/[slug]`)
  - Markdown rendered to HTML (remark + rehype)
  - Syntax highlighting for code blocks (rehype-highlight or shiki)

### Project management
- ⬜ Project list + CRUD in admin
- ⬜ Project detail pages read from DB

### Content management
- ⬜ Skills editor in admin
- ⬜ Experience timeline editor in admin
- ⬜ External links manager (GitHub, LinkedIn, etc.)

### Media library
- ⬜ Upload endpoint (`/api/admin/media/upload`)
- ⬜ Store to Cloudflare R2 (or local `public/uploads` as fallback)
- ⬜ Media grid in admin (`/admin/media`)
- ⬜ Image picker in blog/project editors

---

## Milestone 4 — AI Agents ⬜

**Goal:** Agents run on schedule, results appear in admin dashboard.

### Infrastructure
- ⬜ Cron job setup (system crontab or GitHub Actions scheduled workflow)
- ⬜ Agent error handling + retry logic
- ⬜ Agent status tracking (running / success / error) in DB

### Agent implementations
- ⬜ **GitHub Summarizer** — complete LLM summarization (currently stub)
  - Wire Anthropic API call in `agents/github-summarizer.ts`
  - Fetch recent commits, PRs, and repo stats
- ⬜ **Robotics News Curator** — complete LLM summarization
  - Use a proper RSS parser (`rss-parser` npm package)
  - Add more feed sources (IEEE, Hackaday, ROS Discourse)
- ⬜ **Blog Topic Suggester**
  - Input: existing post titles, recent GitHub activity, recent news digest
  - Output: 5 suggested titles with rationale
- ⬜ **Personal Brand Monitor**
  - Input: owner name, handle, project names
  - Search via Brave Search API or SerpAPI
  - Output: new web mentions with source + snippet
  - Deduplication against previous reports
- ⬜ **Career Opportunity Watcher**
  - Input: job title keywords, location, stack
  - Search via Adzuna API or Remotive API (public, no scraping)
  - Output: matching listings with fit score (LLM-assessed)

### Admin AI panel
- ⬜ Agent list page (`/admin/agents`)
  - Card per agent: name, type, last run, status, "Run now" button
- ⬜ Report detail page (`/admin/agents/reports/[id]`)
  - Markdown-rendered summary
  - Source list with links
  - Mark as read
- ⬜ Agent insights widget on dashboard overview
- ⬜ "Blog Topic Suggester" → click suggestion → prefills new post title

---

## Milestone 5 — Tools, Polish, Analytics ⬜

**Goal:** Admin is a complete workspace. Public site scores 90+ Lighthouse. Ready for employer sharing.

### Tool shortcuts
- ⬜ Tool shortcuts page (`/admin/tools`)
  - Grid of cards: name, description, icon, "Open" button
  - Managed via `ToolShortcut` DB model
  - n8n link configured by default (from seed)
- ⬜ Tool shortcuts CRUD in admin settings

### n8n integration
- ⬜ Document Tailscale VPN setup for secure n8n access
- ⬜ Add n8n shortcut to seed data with correct local URL

### Performance
- ⬜ Lighthouse audit — fix all issues < 90
- ⬜ Replace all `<img>` tags with `next/image`
- ⬜ Add `next/font` for Inter and JetBrains Mono (eliminates Google Fonts request)
- ⬜ Lazy load below-fold sections
- ⬜ Add loading skeletons for DB-fetched content

### Accessibility
- ⬜ Full keyboard navigation test
- ⬜ Screen reader test on homepage
- ⬜ All images have meaningful `alt` text
- ⬜ Color contrast audit (WCAG AA minimum)
- ⬜ Skip-to-content link

### Analytics
- ⬜ Self-hosted Umami (Docker, same VPS)
- ⬜ Add Umami tracking script to layout
- ⬜ Privacy-first: no cookies, no GDPR banner needed

### Dark/light mode
- ⬜ Theme toggle button in Nav
- ⬜ CSS variables for both themes in globals.css
- ⬜ Persist preference in localStorage

---

## Milestone 6 — Growth Features ⏸ (Deferred)

Defer until site is live and generating traffic.

- ⏸ Newsletter integration (Resend audiences or Buttondown)
- ⏸ Testimonials/references section
- ⏸ GitHub live activity widget on homepage
- ⏸ Dynamic OG images via `next/og`
- ⏸ Blog comments (only if needed — spam risk)
- ⏸ TOTP/2FA for admin login
- ⏸ Multi-language support

---

## Recommended Build Order

When starting a new session, always work in this priority order:

1. Whatever the owner explicitly asks for
2. The lowest-numbered incomplete Milestone 2 task
3. Never jump ahead to Milestone 3+ until Milestone 2 is done

The site is useful at Milestone 2. Everything after that is additive.
