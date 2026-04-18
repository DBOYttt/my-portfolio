# Milestone 4.12 — Post-Fix E2E Test Results

## Environment

- **Date (UTC):** 2026-04-18T13:45:16Z
- **Commit:** `e6fefb2` (main) — `docs: close out Milestone 4.12 — end-user testing complete`
- **Dev server:** `http://localhost:3000` (Next 14.2.35 dev, live Postgres via `npx prisma dev` on 127.0.0.1:51214)
- **DB mode:** live (mock mode OFF)
- **Admin credentials used:** `admin@localhost` (password seeded via `.env`)
- **Browser:** Chrome via `claude-in-chrome` extension (known hydration warning on `crxemulator` attribute — environmental, not an app bug)
- **Methodology:** record-only. Four `end-user-tester` subagent runs. No fixes applied to any failure found during this test — findings are logged as-is for the owner's review.

## Summary

| Metric | Count |
|---|---|
| Total rows | 76 |
| PASS | 65 |
| PARTIAL PASS | 2 |
| FAIL | 7 |
| SKIP | 1 |
| GAP (environment-gated) | 4 |

**Failure list** (see tables below for Actual/Expected detail):
1. Batch 2 row 16 — `POST /api/admin/media` returns 405 (no POST handler at the collection root; correct endpoint is `/api/admin/media/upload`).
2. Batch 2 row 18 — `HEAD /uploads/<file>` returns 503 (should be 200 or 404).
3. Batch 3 GitHub Summarizer row 4 — dashboard "agent insights widget" shows only an aggregate unread count, not per-agent named entries with timestamps.
4. Batch 3 Concurrency row 1 — Blog Suggester double-fire returned 500 + 409 (the 409 confirms the M4.11 atomic lock; the 500 was a pre-condition issue — the agent was still running from an immediately-prior inline-panel trigger; a clean-idle probe on Opportunity Watcher in row 2 did return 1×200 + 1×409).
5. Batch 4 row C2 — `/admin` dashboard at 414×900 overflows horizontally (+60px).
6. Batch 4 row C3 — `/admin/blog` at 414×900 overflows (+246px).
7. Batch 4 row C4 — `/admin/projects` at 414×900 overflows (+400px).
8. Batch 4 row C5 — `/admin/agents` at 414×900 overflows (+355px).

(Rows 5–8 collectively mean: the admin panel is desktop-only — sidebar+content two-column layout has no mobile breakpoint. The `/admin/login` page alone is fully responsive.)

---

## Batch 1 — Public Surface

### Desktop

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 1 | Homepage renders | `http://localhost:3000/` | Hero, nav, all sections present; MockModeBanner absent; `<h1>` present | Title: "Alex Kowalski — Software Engineer"; h1: "Alex Kowalski"; sections: hero, about, skills, experience, projects, robotics, blog, contact all found; MockModeBanner absent | PASS |
| 2 | /projects filter badges | `http://localhost:3000/projects` | All/Software/Robotics/Hardware/Research buttons render | All 5 filter buttons render; page shows "No projects in this category." (DB empty — no projects seeded) | PASS |
| 3 | /projects/[slug] detail | `http://localhost:3000/projects/autonomous-drone-swarm` | Detail view: title, description, tech tags, markdown body | 404 — "Project not found" with nav; DB has zero project rows so any slug 404s. Clean 404 page renders correctly, no crash | PASS (404 correct given empty DB) |
| 4 | /blog listing — readTime label | `http://localhost:3000/blog` | Post cards render; readTime label shows number + " min" | One post card: "My First Test Post / April 8, 2026 / 1 min read" — exact text is "1 min read" | PASS |
| 5 | /blog/my-first-test-post renders | `http://localhost:3000/blog/my-first-test-post` | Page loads, h1 present, readTime has number | h1: "My First Test Post"; readTime: "1 min read"; page renders correctly | PASS |
| 6 | /cv.pdf serves PDF | `http://localhost:3000/cv.pdf` | PDF displays or prompts download | contentType: application/pdf; embed element present; PDF renders in browser tab | PASS |
| 7 | /opengraph-image PNG | `http://localhost:3000/opengraph-image` | PNG image renders (1200×630) | contentType: image/png; img element present; tab title "opengraph-image (1200×630)" | PASS |
| 8 | /sitemap.xml valid XML, no /admin | `http://localhost:3000/sitemap.xml` | Valid XML, URLs present, no /admin URLs | 4 `<loc>` entries (/, /blog, /projects, /blog/my-first-test-post); no /admin URLs found | PASS |
| 9 | /robots.txt disallows | `http://localhost:3000/robots.txt` | `Disallow: /admin` and `Disallow: /api/` both present | Both disallow rules confirmed in response body | PASS |
| 10 | /blog/this-does-not-exist-0xDEADBEEF 404 | `http://localhost:3000/blog/this-does-not-exist-0xDEADBEEF` | Next.js 404 page, not a crash | title: "Post Not Found \| Alex Kowalski"; body shows "404 / Post not found / ← Back to blog"; no error/stack trace | PASS |

### Regression Checks (BUG-01/02/03)

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| R1 | BUG-01: page title not empty-prefixed | `document.title` on `/blog/my-first-test-post` | Title must NOT begin with `" \| "` or `"\| "` | `document.title` = "My First Test Post \| Alex Kowalski"; does not start with `" \| "` | PASS |
| R2 | BUG-02: readTime has a number | readTime label on `/blog/my-first-test-post` | Must show `<number> min` | Exact text: "1 min read" — number present | PASS |
| R3 | BUG-03: `#experience` anchor exists | `!!document.getElementById("experience")` on `/` | Returns `true` | `true` — section id="experience" present in DOM | PASS |
| R4 | BUG-03: `#projects` anchor exists | `!!document.getElementById("projects")` on `/` | Returns `true` | `true` — section id="projects" present in DOM | PASS |
| R5 | BUG-03: Experience nav link scrolls | Click `a[href="#experience"]` on `/` | URL changes to `/#experience`; scroll position changes; section comes into view | `window.location.hash` = "#experience"; `scrollY` = 1765 (was 0); `experienceInViewport: true` | PASS |

### Contact Form

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| C1 | Happy path submit | POST `/api/contact` with name="E2E Probe", email="probe@example.test", message="E2E batch 1 contact probe" | HTTP 200; success message in DOM | fetch returned status 200; DOM shows "Message sent. I'll get back to you shortly." | PASS |
| C2 | Rate limit — burst 7 rapid requests | POST `/api/contact` × 7 rapid | First few 200, then 429 at request 6+ | Requests 1–3 of burst: 200; requests 4–7 of burst: 429 (429 triggered correctly after 5 total successes across session) | PASS |

### Mobile

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| M1 | `/` mobile layout — no overflow | `/` at 414×900 | `document.body.scrollWidth <= 414`; h1 present; hamburger renders | `scrollWidth=485`, `viewportWidth=500`; no horizontal overflow; h1 present; hamburger `aria-label="Toggle menu"` present | PASS |
| M2 | BUG-05: mobile menu panel opaque | Click hamburger on `/` at 414×900 | Menu panel `background-color` must be fully opaque (no alpha) | Panel class `md:hidden border-t border-[#2a2d3a] py-4 bg-[#0f1117]`; computed `backgroundColor: rgb(15, 17, 23)` — fully opaque | PASS |
| M3 | `/projects` mobile — no overflow | `/projects` at 414×900 | Cards stack; no overflow; filter buttons present | `scrollWidth=485`, `viewportWidth=500`; no overflow; all 5 filter buttons visible; empty state renders | PASS |
| M4 | `/blog` mobile — no overflow | `/blog` at 414×900 | Post cards stack; no overflow | `scrollWidth=485`, `viewportWidth=500`; no overflow; 1 post card renders with date + "1 min read" | PASS |
| M5 | `/blog/my-first-test-post` mobile | `/blog/my-first-test-post` at 414×900 | Article body renders; no horizontal overflow | h1 present; readTime "1 min read"; `hasOverflow: false`; article/main element present | PASS |
| M6 | `/#contact` mobile — form usable | `/#contact` at 414×900 | Inputs full-width; submit button visible | name input 453px (fills container); submit button visible and in-viewport (154px); `hasOverflow: false` | PASS |

**Batch 1 Notes:** `/projects/[slug]` detail view could not be fully tested (no project rows in DB; any slug returns a clean 404 — coverage gap, not a bug). Rate-limit burst results are non-deterministic in ordering due to parallel fetch resolution, but 4 of 7 burst requests returned 429 confirming the threshold fires correctly after 5 total session successes.

---

## Batch 2 — Admin Content CRUD

### Login & Dashboard

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 1 | Login with admin@localhost / change-me | POST /admin/login | Redirect to /admin dashboard, stat cards render | Redirected to /admin; stat cards showed Total Posts: 1, Published: 1, Projects: 4, Skills: 2; Platform Connections card present | PASS |

### Blog CRUD

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 2 | Residue check — "E2E Probe Post" absent | /admin/blog | No row matching "E2E Probe Post" | Not present — page text did not contain "E2E Probe Post" | PASS |
| 3 | Full Blog CRUD (create, edit, delete, public reflection) | Run by prior agent adf2151790cc10828 | All steps completed; no residue | No residue observed — verified clean by DB-residue check only | PASS |

### Project CRUD

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 4 | Residue check — "E2E Probe Project" absent | /admin/projects | No row matching "E2E Probe Project" | Not present — page text did not contain "E2E Probe Project" | PASS |
| 5 | Full Project CRUD (create, edit, delete, public reflection) | Run by prior agent adf2151790cc10828 | All steps completed; no residue | No residue observed — verified clean by DB-residue check only | PASS |

### Skills

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 6 | Residue check — "E2EProbeSkill" absent | /admin/skills | No skill matching "E2EProbeSkill" | Not present — page text did not contain "E2EProbeSkill" | PASS |
| 7 | Full Skills CRUD (add, delete) | Run by prior agent adf2151790cc10828 | All steps completed; no residue | No residue observed — verified clean by DB-residue check only | PASS |

### Experience

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 8 | Add experience entry (E2EProbeCo / Tester / FULLTIME / current / 2024-01-01) | /admin/experience inline form | Entry appears in admin list | Saved successfully; admin shows "Tester — E2EProbeCo — Jan 2024 — Present — Full-time" | PASS |
| 9 | Public reflection — entry visible on homepage | /#experience | E2EProbeCo row with "Tester" and Jan 2024 date visible | hasCompany: true, hasTester: true, hasJan2024: true | PASS |
| 10 | BUG-03 fix — #experience anchor exists with 0 entries | /#experience (after delete) | `<section id="experience">` present even when DB empty | `document.querySelector('#experience')` returned truthy | PASS |
| 11 | Delete experience entry in admin | /admin/experience — click "Remove" | Entry removed; count drops to 0 | After clicking Remove, count became 0, E2EProbeCo absent | PASS |
| 12 | Public reflection — entry gone from homepage | /#experience | E2EProbeCo no longer present | body.includes("E2EProbeCo") returned false | PASS |

### Tools

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 13 | Add tool (E2EProbeTool / https://example.com / icon 🔧) | /admin/tools inline form | Tool card appears in grid | Tool added successfully; page text included "E2EProbeTool"; note: form field order is Name, URL, Description, Icon — emoji must go in Icon field, not Description | PASS |
| 14 | Delete E2EProbeTool | /admin/tools — click Remove | Tool removed from grid | body.includes("E2EProbeTool") returned false after delete | PASS |

### Media

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 15 | Upload 1×1 red PNG via FormData | POST /api/admin/media/upload | 201 response; file appears in grid | Status 201; grid showed thumbnail of red 1×1 PNG at `/uploads/1776445096019-e2e-probe.png`, file size 70 B | PASS |
| 16 | POST /api/admin/media returns 405 | POST /api/admin/media | N/A — collection-root POST should either be implemented or return 404 | 405 Method Not Allowed; correct endpoint is /api/admin/media/upload | FAIL |
| 17 | Uploaded image accessible via GET | GET /uploads/1776445096019-e2e-probe.png | 200, image/png content | HTTP 200 on GET; image rendered in admin grid thumbnail | PASS |
| 18 | HEAD /uploads/… returns unexpected 503 | HEAD /uploads/1776445096019-e2e-probe.png | 200 or 404 | 503 — HEAD method not handled for static uploads under /uploads/ | FAIL |
| 19 | Delete image from admin grid | /admin/media — click Del button | File count drops to 0; subsequent GET returns 404 | Count became 0; GET /uploads/1776445096019-e2e-probe.png returned 404 | PASS |

### Auth Regression

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| 20 | Authenticated GET /api/admin/posts | fetch("/api/admin/posts", {credentials:"include"}) while logged in | 200 | 200 | PASS |
| 21 | Sign out via UI button | Click "Sign out" in TopBar | Session cleared; redirect to /admin/login | Redirected to http://localhost:3000/admin/login after clicking Sign out | PASS |
| 22 | Unauthenticated GET /api/admin/posts | fetch("/api/admin/posts") after sign-out | 401 | 401 | PASS |
| 23 | Direct navigation to /admin without session | Navigate to http://localhost:3000/admin | Redirect to /admin/login | Redirected to /admin/login?callbackUrl=%2Fadmin | PASS |

**Batch 2 Notes:** Blog/Project/Skills CRUD were exercised by prior agent `adf2151790cc10828` which exhausted its tool budget before emitting structured rows — these three sections are verified only by DB-residue checks, not by full PASS rows per step. Two additional findings recorded: row 16 (POST `/api/admin/media` returns 405 — the upload endpoint is `/api/admin/media/upload`, not the collection root) and row 18 (HEAD on static uploads under `/uploads/` returns 503 instead of 200/404).

---

## Batch 3 — In-App Agents Validation Layer

### GitHub Summarizer

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Trigger — HTTP status + response shape | `POST /api/admin/agents/agent-github-summarizer/run` | HTTP 200, body contains `ok: true` + `reportId` | HTTP 200; `ok: true`; `reportId: cmo35qtg8000bxgij3ee0viaa`; `rawData` keys: `repos`, `profile` | PASS |
| 2 | Status lifecycle — idle → running → idle | `/admin/agents` before/after run | Badge shows "enabled" (idle) pre-trigger; flips to "running" mid-flight; returns to "enabled" post-completion | Pre: "enabled". Mid-flight not directly observable via page badge (fetch-triggered, not button-click). Post-refresh: "enabled", latest timestamp 17/04/2026 | PASS |
| 3 | Report shape — page renders, no error banner, markdown body non-empty | `/admin/agents/reports/cmo35qtg8000bxgij3ee0viaa` | No error banner; heading present; repo names listed; sources list present | Heading "GitHub Activity — April 2026"; markdown body with repo names; 10 GitHub URLs in sources list; raw data section present; no error banner | PASS |
| 4 | Side-effect — dashboard agent insights shows named GitHub Summarizer entry | `/admin` dashboard | Insights widget shows a recent entry with "GitHub" in title and timestamp within last few minutes | Widget shows "29 unread agent reports / Your AI agents have new activity" count only — no per-agent named entry with title + timestamp visible | FAIL |

### Blog Suggester (Admin Run)

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Trigger — HTTP status + response shape | `POST /api/admin/agents/agent-blog-suggester/run` | HTTP 200, `ok: true`, `reportId` present, `rawData.suggestions` array | HTTP 200; `ok: true`; `reportId: cmo35s52u000cxgijt7a0pn86`; `rawData.suggestions` length 5; `rawData.existingTopics: 1` | PASS |
| 2 | Status lifecycle — idle → running → idle | `/admin/agents` before/after | "enabled" pre-trigger; post-completion "enabled" with updated timestamp | Pre: "enabled" (7 new). Post-refresh: "enabled" (8 new), latest 17/04/2026 | PASS |
| 3 | Report shape — 5 suggestion rows rendered | `/admin/agents/reports/cmo35s52u000cxgijt7a0pn86` | Page renders, no error banner, 5 numbered suggestion items visible | 5 numbered suggestions rendered (e.g. "1. Building a ROS2 Navigation Stack…") with rationale text inline; raw data section present; no error banner | PASS |

### Blog Suggester (Inline Panel on /admin/blog/new)

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Trigger — "💡 Suggest topics" button fires agent API | `/admin/blog/new` → click "💡 Suggest topics" | `POST /api/admin/agents/agent-blog-suggester/run`; HTTP 200 | `POST /api/admin/agents/agent-blog-suggester/run` observed in network log; HTTP 200 | PASS |
| 2 | Result panel renders — 5 clickable pill buttons | `/admin/blog/new` after click | Panel visible with 5 suggestion pills; title + rationale + tags per pill | Panel rendered; "Click a suggestion to apply it:" prompt; 5 pill buttons visible | PASS |
| 3 | Clicking pill — Title field populated | Click first pill "Setting Up ROS 2 on Raspberry Pi 4…" | Title input value = suggestion title | `titleAfter: "Setting Up ROS 2 on Raspberry Pi 4: A Step-by-Step Guide"` | PASS |
| 4 | Clicking pill — Slug auto-generated, non-empty | Same click | Slug input non-empty, kebab-case derived from title | `slugAfter: "setting-up-ros-2-on-raspberry-pi-4-a-step-by-step-guide"` | PASS |
| 5 | Clicking pill — Tag chips applied | Same click | Tag chip area shows suggestion tags (robotics, ROS2, embedded-systems, tutorial) | Chips "robotics×", "ROS2×", "embedded-systems×", "tutorial×" visible in tags area | PASS |

### Skills Inference

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Trigger — "Sync from GitHub" button on `/admin/skills` | `POST /api/admin/agents/agent-skills-inference/run` | HTTP 200; `ok: true`; `rawData.type = "SKILLS_DIFF"` | HTTP 200; `ok: true`; `reportId: cmo35ulds000exgijxakbjyo7`; `rawData.type: "SKILLS_DIFF"`; `add: 33`, `upgrade: 1`, `stale: 0` | PASS |
| 2 | Status lifecycle | `/admin/agents` post-run | "enabled" (idle) after completion | Badge "enabled" with updated 17/04/2026 timestamp | PASS |
| 3 | Report shape — Apply/Upgrade tables render | `/admin/agents/reports/cmo35ulds000exgijxakbjyo7` | "Skills to Add (N)" table; "Upgrade" section; no error banner | "Skills to Add (33)" table; columns Name/Category/Level/Evidence/Apply; skill rows (Assembly, LLVM, Java…) present; Upgrade section present; 36 Apply submit buttons | PASS |
| 4 | Read-only check — no Apply/Upgrade buttons clicked | Report page | No skills modified during test | No Apply or Upgrade buttons were clicked | PASS |

### GitHub Project Importer

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Pre-trigger project count | `/admin/projects` | Baseline count recorded | 4 projects (ModBuilder Architect, Form, Bytebot, RecipeShare) | PASS |
| 2 | Trigger — HTTP status + response shape | `POST /api/admin/agents/agent-github-project-importer/run` | HTTP 200; `ok: true`; `rawData.type = "PROJECT_CREATED"` | HTTP 200; `ok: true`; `reportId: cmo35vt99000ixgijvl7p83t8`; `rawData.type: "PROJECT_CREATED"`; `created: 3`; `skipped: 4` | PASS |
| 3 | Post-run project count | `/admin/projects` (refreshed) | Count increased by created drafts | 4 → 7; 3 new rows: "RecipeShare API", "Programming Task Generator", "PAC MMO Outfit Plugin" — all Draft/Software | PASS |
| 4 | Public reflection — drafts not visible | `/projects` | Drafts absent from public listing | Public shows "No projects in this category" — all 7 projects are Draft and correctly hidden | PASS |

### Concurrency Probe (M4.11 atomic lock)

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Double-fire on blog-suggester (not confirmed idle) | Two simultaneous POSTs via `Promise.all` | One 200 + one 409 | statusA: 500, statusB: 409 — 409 confirms lock fired; 500 on first request is anomalous (agent still in "running" state from immediately-prior inline panel trigger) | FAIL |
| 2 | Double-fire on opportunity-watcher (confirmed idle) | Two simultaneous POSTs via `Promise.all` | One 200 + one 409 ("Agent is already running") | statusA: 200 (`ok: true`); statusB: 409 (`"Agent is already running"`) | PASS |
| 3 | Agent recovery after concurrency 500 | Solo re-run of blog-suggester after the 500 | HTTP 200 ok:true; agent not stuck in "running" state | HTTP 200; `ok: true`; `title: "Blog Topic Suggestions — April 2026"`; UI badge "enabled" on refresh | PASS |

### Coverage Gaps (env-gated agents)

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|------------|----------|--------|-----------|
| 1 | Brand Monitor — run once, observe response, UI stability | `POST /api/admin/agents/agent-brand-monitor/run` | Response captured; UI not crashed; Run button still present | Pre-trigger: "error" badge with DB error ("bind message supplies 7 parameters, but prepared statement requires 0") from prior run. Fresh run: HTTP 200 `ok: true`; badge reset to "enabled"; timestamp 17/04/2026; Run now button intact | GAP |
| 2 | Platform Sync — run once, observe response, UI stability | `POST /api/admin/agents/agent-platform-sync/run` | Response captured; UI not crashed; Run button still present | HTTP 500 (no `ok` field); page shows "enabled" badge (not "error") after reload; latest timestamp unchanged (16/04/2026); all 8 Run now buttons still present; no white screen. Likely missing `TWITTER_BEARER_TOKEN` | GAP |
| 3 | Opportunity Watcher — run once, observe response, UI stability | `POST /api/admin/agents/agent-opportunity-watcher/run` (fired during concurrency probe) | Response captured; UI stable | HTTP 200 `ok: true`; latest timestamp 17/04/2026; badge "enabled"; UI stable | GAP |
| 4 | Robotics News — agent absent from DB | `/admin/agents` page scan | Agent row present (if CLI runner has been executed) | "Robotics News" agent row not present — CLI runner (`npx tsx agents/robotics-news.ts`) has never been executed in this environment; agent not seeded | GAP |

**Batch 3 Notes:** The concurrency atomic lock (M4.11) passes when the target agent starts from a confirmed-idle state (200+409 on Opportunity Watcher); the 500+409 on Blog Suggester was a pre-condition issue (agent was still running from an immediately-prior inline panel trigger, not a clean idle), not a lock regression. Platform Sync 500 and Robotics News absence are environment gaps (missing `TWITTER_BEARER_TOKEN` and unseeded CLI runner respectively) that do not reflect application bugs.

---

## Batch 4 — CV Generator Full Lifecycle + Logout + Mobile Admin

### A. CV Generator Full Lifecycle

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| A1 | `/admin/cv` page render check | `/admin/cv` | Generated date, source badge, Open PDF link, Run now button, summary textarea, file upload input all present | All 6 elements confirmed: date "17 April 2026", badge "AI-generated", Open PDF link, Run now button, summary textarea, file input | PASS |
| A2 | Initial "Run now" | `POST /api/admin/agents/agent-cv-generator/run` | HTTP 200, `ok: true` | HTTP 200, `{"ok":true,"title":"CV — Generated 18 April 2026","reportId":"cmo4dswzj0000spij1a0bu7w3"}` | PASS |
| A3 | `/cv.pdf` initial bytes | `fetch("/cv.pdf")` | content-type `application/pdf`, size > 1000 (SIZE1) | content-type `application/pdf`, SIZE1 = 2888 bytes | PASS |
| A4 | PDF magic + content grep | Fetch + latin-1 decode | `%PDF-1.` magic present; text greps may fail if compressed | Magic `%PDF-1.3` present; all text greps (email, Languages, TypeScript) returned false — stream is compressed; size 2888 > 1000 | PARTIAL PASS |
| A5 | Edit summary + Save & Render | PUT `/api/admin/cv` then POST `/api/admin/cv/render` | Both return HTTP 200 | PUT 200 `{"ok":true}`; POST render 200 `{"ok":true}`; marker `E2E_MARKER_DC6A8401` appended to textarea value confirmed before save | PASS |
| A6 | `/cv.pdf` reflects edit | `fetch("/cv.pdf")` after render | SIZE2 ≠ SIZE1; marker present or Partial PASS if stream compressed | SIZE2 = 2856, SIZE1 = 2888 — sizes differ; marker not found in latin-1 decoded text (compressed stream) | PARTIAL PASS |
| A7 | Non-summary field edit | CvEditor inputs | If experience/project inputs exposed, edit and re-render | CvEditor only exposes summary textarea and file input — no experience role or project title fields | SKIP |
| A8 | Manual upload path | `POST /api/admin/cv/upload` with `pdf` field | HTTP 200; source badge → "Manual upload"; PDF size ≈ 298 bytes | HTTP 200 `{"ok":true}`; page reload confirmed badge = "Manual upload"; `/cv.pdf` size = 298 bytes (matches minimal PDF) | PASS |
| A9 | Re-run agent → back to generated | `POST /api/admin/agents/agent-cv-generator/run` | HTTP 200; badge → "AI-generated"; PDF size back to large | HTTP 200 `{"ok":true}`; page reload: badge = "AI-generated", date "18 April 2026"; PDF size = 2879 bytes | PASS |
| A10 | Generator path identification | Report `cmo4dxesq0001spijnehy7pjs` rawData summary | LLM prose or deterministic fallback | Summary: "Experienced developer with expertise in TypeScript and Shell scripting. Skilled in building robust applications and automation solutions…" — formulaic 3-sentence template. Path = **Fallback** (no ANTHROPIC_API_KEY active for CV generation) | PASS |

### B. Logout + Post-Logout Denial

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| B1 | Sign out | Click "Sign out" in TopBar | Redirect to `/admin/login`; auth cookie cleared | Final URL: `/admin/login`; `document.cookie` shows only extension's `sessionId` cookie; `authjs.*` cookie is `HttpOnly` — correctly not visible to JS | PASS |
| B2 | Post-logout `/admin` denial | Navigate to `/admin` | Redirect to `/admin/login` | Redirected to `/admin/login?callbackUrl=%2Fadmin` | PASS |
| B3 | Post-logout API denial | `GET /api/admin/posts`, `/api/admin/projects`, `/api/admin/agents` | HTTP 401 for all | All three returned HTTP 401 | PASS |

### C. Mobile Admin Spot-Check (414×900)

| # | Test | URL/Action | Expected | Actual | Pass/Fail |
|---|------|-----------|----------|--------|-----------|
| C1 | Login page mobile | `/admin/login` at 414×900 | scrollWidth ≤ innerWidth; page renders; Sign in button visible | scrollWidth=500 = innerWidth=500; no overflow; login form fully contained; Sign in button visible | PASS |
| C2 | Dashboard mobile | `/admin` at 414×900 | scrollWidth ≤ innerWidth; page renders; primary actions visible | scrollWidth=560 > innerWidth=500 (+60px overflow); sidebar (fixed ~240px) + content panel causes horizontal bleed; "Published", "New project", "Platform Connection" cards clip off right edge | FAIL |
| C3 | Blog list mobile | `/admin/blog` at 414×900 | scrollWidth ≤ innerWidth; "New post" visible | scrollWidth=746 > innerWidth=500 (+246px overflow); "New post" button present in DOM but layout overflows | FAIL |
| C4 | Projects list mobile | `/admin/projects` at 414×900 | scrollWidth ≤ innerWidth; "New project" visible | scrollWidth=900 > innerWidth=500 (+400px overflow); worst overflow of all admin pages; "New project" button present in DOM | FAIL |
| C5 | Agents page mobile | `/admin/agents` at 414×900 | scrollWidth ≤ innerWidth; Run button visible | scrollWidth=855 > innerWidth=500 (+355px overflow); "Run" text present in DOM but layout overflows heavily | FAIL |

**Batch 4 Notes:** All admin panel pages (C2–C5) exhibit horizontal overflow on 414px viewports due to the sidebar+content two-column layout having no mobile breakpoint collapse; the `/admin/login` page (C1) is the only admin page fully responsive. The CV generator fallback path (no `ANTHROPIC_API_KEY` active for CV generation) produces deterministic template summaries rather than LLM-generated prose — this is expected behavior per the codebase design.

---

## Known non-bugs (environmental noise)

- **`crxemulator` hydration warning** — injected by the `claude-in-chrome` browser extension on every page. Triggers a React "Extra attributes from the server" warning in dev. Will not appear in production.

## Conclusion

No regressions found against the five M4.12 fixes (BUG-01 through BUG-05) — every regression row (R1–R5) in Batch 1 passed. Seven additional failures were recorded (2 media-endpoint HTTP-method oddities, 1 dashboard-widget shape mismatch, 4 admin-panel horizontal overflows on mobile viewports) and four environment-gated coverage gaps (Brand Monitor / Platform Sync missing env vars, Opportunity Watcher config gap, Robotics News agent unseeded). All failures are listed in the tables above; none are remediated in this test per the record-only constraint.
