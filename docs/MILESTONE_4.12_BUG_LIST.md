# Milestone 4.12 — Bug List

Source runs:
- **Phase 1** (public surface): end-user-tester agent `a221c52f32281659a`, 2026-04-16, completed with structured report.
- **Phase 2** (admin surface): end-user-tester agent `a78b7b3dc7d43a937`, 2026-04-16, hit tool-call ceiling at step 30/32; no structured report. See "Phase 2 coverage gaps" below.
- **Phase 2b** (focused admin re-run): end-user-tester agent `a71051cb8af083612`, 2026-04-16, hit tool-call ceiling at step 12/12 (auth guard PASS) without emitting structured report. Partial hints: auth guard 401 verified; some 503s observed around step 10 area and a Brand Monitor 500 (likely missing `BRAND_MONITOR_API_KEY` — coverage gap).

DB state during test: live Postgres (not mock). Admin user seeded, plus residual data from prior sessions (posts, projects, agent reports). Mock-mode banner absent, as expected.

---

## P0 — Security / data loss

_None found._ Auth guards verified — `/admin/*` redirects logged-out users; `/api/admin/*` returns 401 without session; open redirect and path-traversal vectors all blocked.

## P1 — Blocks a feature

_None found in Phase 1. Phase 2 full coverage inconclusive; re-test scheduled after fixes._

## P2 — Degraded UX

### BUG-01 Blog post `<title>` and `og:title` render with empty title segment
- **URL:** `/blog/[slug]`
- **Steps:** Navigate to any published blog post. Inspect `<title>` and `og:title`.
- **Expected:** `<Post title> | <Owner name>` (e.g. `Hello World | Alex Kowalski`)
- **Actual:** ` | Alex Kowalski` — title segment is empty.
- **Root cause:** `src/app/blog/[slug]/page.tsx:31-35` uses `post.seoTitle ?? post.title`. Prisma returns `""` (empty string) when the admin form submits a blank `seoTitle`; `??` does not treat `""` as nullish, so the empty string wins. Same pattern applies to `seoDesc`.
- **Fix:** replace `??` with `||` in both `generateMetadata` and the OpenGraph block. Audit `src/app/projects/[slug]/page.tsx` for the same pattern.
- **Severity:** P2 — SEO-visible defect on shared URLs.

### BUG-02 `readTime` renders as " read" (number missing)
- **URL:** `/blog` and `/blog/[slug]`
- **Steps:** View any blog post summary or detail.
- **Expected:** `5 min read` (or similar).
- **Actual:** ` read` — the number is empty.
- **Root cause:** `src/lib/data.ts:186` and `:225` hardcode `readTime: ""` in the DB path (the mock path passes real values).
- **Fix:** compute read time from the post content word count (e.g. `Math.max(1, Math.round(words / 200)) + " min"`) in both `getBlogPosts` and `getBlogPostBySlug`.
- **Severity:** P2.

### BUG-03 Homepage nav anchors `#experience` and `#projects` dead-end when sections have no content
- **URL:** `/`
- **Steps:** Load `/` on a freshly seeded DB (no experience rows, no projects). Click the "Experience" or "Projects" link in the nav.
- **Expected:** Smooth scroll to the section.
- **Actual:** URL updates to `/#experience` or `/#projects` but the page stays at the hero — no DOM element carries the anchor id.
- **Root cause:** the section components return null/early when their data array is empty, which removes the `<section id="...">` wrapper from the DOM.
- **Fix:** in `src/components/public/ExperienceSection.tsx` and `src/components/public/ProjectsPreview.tsx` (and any homepage section that conditionally renders), always render the outer `<section id="...">` wrapper. Inside, show an empty-state message instead of returning null.
- **Severity:** P2.

### BUG-04 Generated CV PDF shows "Invalid Date – Present" in Experience section
- **URL:** `/cv.pdf`
- **Steps:** With at least one experience row in the DB where `current = true`, run the CV Generator, open the PDF.
- **Expected:** `Jan 2024 – Present` or similar.
- **Actual:** `Invalid Date – Present`.
- **Root cause:** `src/lib/cv-template.tsx` calls `.toLocaleDateString()` on a value that is null/undefined/unparsable for some experience rows.
- **Fix:** guard the date parse: `startDate ? new Date(startDate).toLocaleDateString(...) : ""`. Also validate `!isNaN(new Date(x).getTime())` before formatting.
- **Severity:** P2.

## P3 — Cosmetic

### BUG-05 Mobile nav overlay has semi-transparent background; hero bleeds through
- **URL:** `/` at viewport ≤ 768px
- **Steps:** Resize to 414×900, tap hamburger.
- **Expected:** Opaque dark panel.
- **Actual:** Hero heading and subtitle visible behind menu items; "Robotics" label overlaps hero subtitle.
- **Fix:** add an opaque background (`bg-[#0f1117]` or equivalent) to the mobile menu container in `src/components/public/Nav.tsx`.
- **Severity:** P3.

---

## Phase 2 coverage gaps (to be re-tested after fixes)

The Phase 2 full walkthrough did not emit a structured report. The following flows therefore have only partial confirmation:

| Flow | Status | Notes |
|---|---|---|
| Login happy path | **Verified** (Phase 2b step 1) |
| Logged-out `/admin` → 307 | **Verified** (Phase 1) |
| Logged-out `/api/admin/*` → 401 | **Verified** (Phase 2b step 12) |
| Agent concurrency (M4.11 fix) — double-click returns 1×200 + 1×409 | **Not verified** | Was step 2 in Phase 2b. Needs re-test. |
| Blog "💡 Suggest topics" inline | **Not verified** | Step 3 in Phase 2b. |
| Blog "Generate content" streaming | **Not verified** | Step 4 in Phase 2b. |
| Project CRUD + public visibility | **Not verified** | Step 5 in Phase 2b. |
| Skills + Experience inline add/delete | **Not verified** | Steps 6–7 in Phase 2b. |
| CV edit → re-render → PDF updates | **Not verified** | Step 8 in Phase 2b. |
| Media upload/delete | **Partial** | Phase 2 got as far as Step 30 "manual PDF upload works"; web-UI image upload/delete unverified. Hint of 503s around media area — may be residual, may be real. |
| Tools shortcut add/delete | **Not verified** | Step 10 (Phase 2) / 10 (Phase 2b). |
| Logout → redirect | **Not verified** | Step 11 in Phase 2b. |
| Brand Monitor / Platform Sync / Opportunity Watcher | **Coverage gap** | `BRAND_MONITOR_API_KEY`, `TWITTER_BEARER_TOKEN` not set; a 500 was observed on Brand Monitor — expected per spec (graceful skip), but worth confirming the admin UI doesn't hard-crash on the 500 response. |

## Console noise (non-blocking)

- `Warning: Extra attributes from the server: crxemulator at html` — injected by the Claude-in-Chrome extension on every page. Not an app bug. Will not appear in production.

## Recommended next actions (fix pass order)

1. BUG-01 — one-line edit each in `src/app/blog/[slug]/page.tsx` and `src/app/projects/[slug]/page.tsx`.
2. BUG-02 — word-count helper in `src/lib/data.ts`.
3. BUG-03 — outer-section wrapper in two homepage components.
4. BUG-04 — date guard in `src/lib/cv-template.tsx`.
5. BUG-05 — opaque background in `src/components/public/Nav.tsx`.
6. After fixes, run a **focused** Phase 2c tester against only the un-verified admin flows listed above.
