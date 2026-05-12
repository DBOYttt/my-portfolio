# Pre-M8 Assessment — 2026-05-12

## Executive Summary

Three parallel assessment agents ran browser automation and visual QA against `http://localhost:3000` (12 E2E scenarios, full UX audit, visual QA sweep). The public-facing site is in good shape — dark mode, performance, security headers (except CSP), and responsive layout are nearly clean. The admin panel has one P1 data bug that silently drops `publishedAt` on project creation, and the career-ops panel has three critical reliability issues that make it untrustworthy for regular use. A single responsive grid defect clips metadata on mobile for blog and project listings. CSP is the only hard M8 security blocker.

**Overall verdict: Conditionally ready for M8.** Fix the 4 items in the "Must fix before M8 goes live" group, set `NEXT_PUBLIC_BASE_URL`, and add CSP — then the tunnel can open. Everything else is safe to ship incrementally.

---

## Findings Table

| # | Severity | Category | Summary | File | Line(s) |
|---|---|---|---|---|---|
| F-01 | Critical | Functionality | POST /api/admin/projects ignores `publishedAt` — new projects never appear on public /projects | `src/app/api/admin/projects/route.ts` | POST handler `prisma.project.create()` |
| F-02 | Critical | Security | Content-Security-Policy header absent | `nginx/portfolio.conf` or Next.js config | — |
| F-03 | Critical | SEO | sitemap.xml and robots.txt use `yourdomain.com` placeholder (`NEXT_PUBLIC_BASE_URL` unset) | `.env` (production) | — |
| F-04 | Critical | Reliability | Polling interval leaks on unmount — `setInterval` keeps firing after navigating away from /admin/career | `src/components/admin/CareerEvaluateForm.tsx` | ~195-200 (cleanup missing) |
| F-05 | High | Reliability | CareerEvaluateForm pipeline table never refreshes after evaluation completes | `src/components/admin/CareerEvaluateForm.tsx` | ~195-200 (`router.refresh()` missing) |
| F-06 | High | Reliability | Auto-save PATCH errors silently swallowed — data loss if session expires mid-edit | `src/components/admin/CareerEvaluateForm.tsx` | ~90-92 |
| F-07 | High | Usability | No cancel button during job evaluation — user locked out up to 5 min with no abort | `src/components/admin/CareerEvaluateForm.tsx` | ~514-531 |
| F-08 | High | Usability | CV publish 404 is a raw technical error message — not actionable for first-time user | `src/components/admin/CareerEvaluateForm.tsx` | ~263-265 |
| F-09 | High | Usability | Sidebar navigation bypasses unsaved-changes guard (Next.js `<Link>` skips `beforeunload`) | `src/components/admin/PostForm.tsx`, `src/components/admin/ProjectForm.tsx`, `src/components/admin/Sidebar.tsx` | ~71-77, ~75-80 |
| F-10 | High | Design | `entry-head` mobile grid defect (≤760px) — `.entry-meta-right` clips into 40px column | `src/app/globals.css` | ~454 |
| F-11 | Medium | Functionality | Skills API error message lists wrong enum values (`FRONTEND`, `BACKEND`, `DEVOPS` don't exist) | `src/app/api/admin/skills/route.ts` | ~36 |
| F-12 | Medium | Usability | Escape key doesn't close mobile nav drawer — ARIA pattern violation | `src/components/public/Nav.tsx` | ~33-43 |
| F-13 | Medium | Reliability | `dismissStaleSkill` doesn't revalidate report page — dismissed skill stays visible until reload | `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx` | ~252-259 |
| F-14 | Medium | Functionality | `portfolio_url` hardcoded as empty string in career-ops sync payload — no form field exists | `src/app/api/admin/career/sync/route.ts` | ~73 |
| F-15 | Medium | Usability | Twitter field label says "Twitter URL" but bare handles are stored — label/validation mismatch | `src/components/admin/CareerEvaluateForm.tsx` | ~316-321 |
| F-16 | Medium | Missing Feature | Blog has no search, tag filtering, or pagination — all posts in flat list | `src/app/blog/page.tsx` | ~38-68 |
| F-17 | Low | Usability | Experience and Writing sections hidden from homepage when DB has no rows — nav anchors broken | `src/app/page.tsx` | — |
| F-18 | Low | Usability | PostForm "SCHEDULED" state submit button reads "Create post" instead of "Schedule post" | `src/components/admin/PostForm.tsx` | ~479-483 |
| F-19 | Low | Missing Feature | No RSS/Atom feed | `src/app/blog/page.tsx`, `src/app/layout.tsx` | — |
| F-20 | Low | Usability | Admin empty states ("No posts yet.") have no inline CTA link | `src/app/admin/(panel)/blog/page.tsx` | ~50-53 |
| F-21 | Low | Missing Feature | No "back to top" on long blog posts | `src/app/blog/[slug]/page.tsx` | — |

---

## Career-Ops Analysis

The career-ops integration happy path works (evaluation triggers, log streams, CV publishes). However three reliability issues make it unsuitable for regular unsupervised use:

**F-04 (Critical) — Interval leak:** `pollStatus` starts a `setInterval` but the component has no `useEffect` cleanup. Navigating away mid-evaluation leaves orphaned timers updating unmounted React state — a classic memory leak that will produce React "Can't perform a state update on an unmounted component" warnings and potentially interfere with subsequent evaluations.

**F-05 (Critical) — Stale pipeline table:** `CareerAdminPage` is a Server Component rendered once at request time. After an evaluation completes, the inline streaming log shows the result but the Pipeline table below still shows the pre-evaluation snapshot. The user must hard-reload to see the new entry. Fix is one line: `router.refresh()` at the `done`/`error` branch of `pollStatus`.

**F-06 (Critical) — Silent save failures:** Auto-save errors are caught and discarded with a `// silent — not critical` comment. If the admin session expires (default Auth.js session = 30 days, but can be shorter), every keystroke is lost with zero feedback. This is especially dangerous given AI-generated field content (profile summary, keywords) that took 30+ seconds to produce.

**F-07 (High) — No cancel during evaluation:** A 5-minute evaluation window with no abort is a poor UX contract. If the career-ops service is down or slow, the user has no recourse except to navigate away (triggering the interval leak).

**F-08 (High) — Unhelpful CV error:** Raw Docker volume path in an error message surfaced to the UI is confusing. Map the 404 response to a user-facing message.

**Recommendation:** Fix F-04, F-05, F-06 before relying on career-ops for any real job applications. F-07 and F-08 are strong-preference items for regular use.

---

## Missing Features Backlog

These are scope gaps identified during the audit — not bugs, but notable absences for a public-facing portfolio:

| Feature | Priority | Notes |
|---|---|---|
| Blog search / tag filtering | Medium | Tags rendered as decorative spans; no interaction. Deferred to M10. |
| RSS/Atom feed | Low | Standard expectation for a blog; adds SEO value. |
| Blog "back to top" | Low | Needed on long posts. |
| Admin empty-state CTAs | Low | "No posts yet" with no link to create one is a minor friction point. |
| `portfolio_url` field in career-ops sync | Medium | Currently hardcoded empty — the whole point of the sync is to push a complete profile. |
| Blog pagination | Medium | Not yet needed but plan before post count exceeds ~20. |

---

## M8 Readiness Verdict

| Area | Status | Blocker? |
|---|---|---|
| Public site functional | PASS (11/12 E2E) | F-01 must be fixed first |
| Dark mode | FULLY CLEAN | No |
| Responsive layout | Minor defect (F-10) | No — usability issue, not broken |
| Performance | CLEAN | No |
| Security headers | CSP absent (F-02) | **Yes** |
| SEO / sitemap | Placeholder URLs (F-03) | **Yes** — fix in production .env |
| Admin functionality | P1 project creation bug (F-01) | **Yes** |
| Admin career-ops | 3 Critical reliability issues | No — admin-only, not public |
| Auth / session guard | CONFIRMED — middleware + server-side `requireAdminSession()` | No |

**Hard blockers for M8 go-live (must fix first):**
1. F-01 — `publishedAt` dropped on project creation
2. F-02 — Add Content-Security-Policy header
3. F-03 — Set `NEXT_PUBLIC_BASE_URL=https://diboy.dev` in production `.env`
4. F-10 — Mobile grid defect clips entry metadata on /blog and /projects

---

## Prioritised Improvement Plan

### Group 1 — Must fix before M8 goes live
**Branch:** `fix/pre-m8-blockers`

- [x] **F-01** [S] Add `publishedAt: body.publishedAt ?? null` to `prisma.project.create()` data in `src/app/api/admin/projects/route.ts` (mirror the PUT handler)
- [x] **F-02** [M] Add `Content-Security-Policy` header — start with `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'` in `next.config.ts` or Nginx config; tighten after verifying no breakage
- [ ] **F-03** [S] Set `NEXT_PUBLIC_BASE_URL=https://diboy.dev` in production `.env` before starting the Cloudflare tunnel *(deployment action — set on server before M9 tunnel opens)*
- [x] **F-10** [S] Add `grid-column: 1 / -1` to `.entry-meta-right` at the 760px breakpoint in `src/app/globals.css` line ~454

---

### Group 2 — Fix before site gets real traffic
**Branch:** `fix/pre-traffic-polish`

- [x] **F-04** [S] Add `useEffect` cleanup in `src/components/admin/CareerEvaluateForm.tsx` — return `() => stopPolling()` to prevent interval leak on unmount
- [x] **F-05** [S] Call `router.refresh()` inside `pollStatus` when status reaches `"done"` or `"error"` in `src/components/admin/CareerEvaluateForm.tsx` lines ~195-200
- [x] **F-06** [S] Replace silent catch block in auto-save with a persistent error indicator (e.g. a small red dot on the save status label) that clears on next successful save — `src/components/admin/CareerEvaluateForm.tsx` lines ~90-92
- [x] **F-07** [S] Add Cancel button in evaluation in-progress state calling `stopPolling()` and resetting form state — `src/components/admin/CareerEvaluateForm.tsx` lines ~514-531
- [x] **F-08** [S] Map 404 from CV publish endpoint to "No CV has been generated yet. Run a job evaluation first." — `src/components/admin/CareerEvaluateForm.tsx` lines ~263-265
- [x] **F-09** [M] Implement router-event-based unsaved-changes guard using `next/navigation` `beforePopState` or a custom navigation prompt hook; update `src/components/admin/PostForm.tsx` and `src/components/admin/ProjectForm.tsx`
- [x] **F-11** [S] Update hardcoded enum list in `src/app/api/admin/skills/route.ts` line ~36 to match schema: `LANGUAGE, FRAMEWORK, TOOL, ROBOTICS, EMBEDDED, DATABASE, OTHER`
- [x] **F-12** [S] Add `key === "Escape"` handler to close mobile nav in `src/components/public/Nav.tsx` lines ~33-43
- [x] **F-13** [S] Add `revalidatePath(\`/admin/agents/reports/${reportId}\`)` after `dismissStaleSkill` in `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx` lines ~252-259
- [x] **F-14** [S] Add `portfolio_url` field (or derive from `NEXT_PUBLIC_BASE_URL`) in career-ops sync payload — `src/app/api/admin/career/sync/route.ts` line ~73
- [x] **F-15** [S] Update Twitter field label in `src/components/admin/CareerEvaluateForm.tsx` lines ~316-321 to "Twitter handle" and strip leading `@` on save; or accept full URL and store consistently
- [x] **F-17** [S] Render Experience and Writing sections with a placeholder message when DB returns empty arrays, so nav anchors remain valid
- [x] **F-18** [S] Change submit button label for SCHEDULED state in `src/components/admin/PostForm.tsx` lines ~479-483 from "Create post" to "Schedule post"
- [x] **F-20** [S] Add inline "Create your first post →" link to empty state in `src/app/admin/(panel)/blog/page.tsx` lines ~50-53

---

### Group 3 — Post-launch / growth phase
**Branch:** `feat/growth-features` (open after real traffic arrives)

- [ ] **F-16** [L] Blog search and tag filtering — convert tag `<span>` elements to interactive filter buttons; add client-side filtering or server-side query param route — `src/app/blog/page.tsx`
- [ ] **F-19** [M] RSS/Atom feed at `/blog/feed.xml` — generate via a Next.js route handler; add `<link rel="alternate">` in `src/app/layout.tsx`
- [ ] **F-21** [S] "Back to top" button on blog post detail — `src/app/blog/[slug]/page.tsx`
- [ ] Blog pagination [M] — add `page` query param + Prisma `skip`/`take`; implement before post count exceeds ~20
