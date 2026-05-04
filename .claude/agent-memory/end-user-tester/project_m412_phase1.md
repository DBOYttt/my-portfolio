---
name: Milestone 4.12 Phase 1 — Public Surface Test Run
description: Results and patterns from the first full public surface walkthrough (2026-04-16)
type: project
---

Completed public surface walkthrough on 2026-04-16 with live Postgres DB, freshly seeded (admin user + one blog post + one tool shortcut, no experience/projects rows).

**Batch 1 re-run — 2026-04-17 (Milestone 4.12 official E2E pass):**
All previously reported bugs confirmed FIXED. BUG-01 (seoTitle), BUG-02 (readTime), BUG-03 (anchor IDs), BUG-05 (mobile nav opacity) all pass regression checks. DB still has zero projects rows — /projects shows empty state, /projects/[slug] always 404s (coverage gap, not a bug). Rate limit confirmed: 5 × 200 then 429 on burst. Mobile pass at 414px: no overflow on any page, menu panel bg=rgb(15,17,23) (opaque). Note: window.innerWidth reports 500px not 414px (browser chrome overhead), scrollWidth 485px — no overflow detected.

**Confirmed passing:**
- Homepage renders, dark theme correct, no MockModeBanner (DB mode active)
- About, Skills, Robotics, Blog preview, Contact form, Footer all render
- /projects filter badges (All/Software/Robotics/Hardware/Research) all work, URL param updates
- /projects/non-existent-slug → clean 404
- /blog → listing renders
- /blog/non-existent-slug → clean 404
- /cv.pdf → 200, application/pdf, 3612 bytes
- /opengraph-image → 200, image/png, 1200x630
- /sitemap.xml → 200, valid XML, no /admin URLs
- /robots.txt → 200, Disallow /admin and /api/ present
- Contact API: 200 on first 5 requests, 429 on request 6+ (rate limit works)
- Admin routes: /admin → 307 redirect, /api/admin/* → 401 without auth
- Mobile (414px): no horizontal overflow, hamburger menu works, all sections responsive

**Bugs found (see bug reports in final report):**
- P2: Blog post page title/og:title empty — seoTitle="" in DB, ?? doesn't guard empty strings
- P2: readTime hardcoded as "" in data.ts, renders " read" with no number
- P2: Experience and Projects preview sections not rendered at all when DB empty — nav anchors broken
- P2: CV PDF "Invalid Date" in experience section when date fields are null/invalid
- P3: Mobile nav overlay has semi-transparent background, hero content bleeds through

**Batch 3 — 2026-04-17 — In-App Agents Validation:**
- GitHub Summarizer: HTTP 200 ok:true, reportId present, rawData has repos+profile keys, report page renders with markdown + 10 source links. Dashboard widget shows count-only (not per-agent named entry).
- Blog Suggester (admin run): HTTP 200 ok:true, 5 suggestions with tags, report page renders 5 numbered items. No error banner.
- Blog Suggester (inline panel): POST /api/admin/agents/agent-blog-suggester/run → 200; 5 clickable pill buttons render; clicking pill populates Title, auto-generates Slug, applies Tags correctly.
- Skills Inference (from /admin/skills Sync button): HTTP 200 ok:true, SKILLS_DIFF rawData type, 33 add/1 upgrade/0 stale, report page renders Apply/Upgrade tables with skill names.
- GitHub Project Importer: HTTP 200 ok:true, 3 new draft projects created (RecipeShare API, Programming Task Generator, PAC MMO Outfit Plugin), 4 skipped. Draft projects correctly hidden on public /projects.
- Concurrency probe (blog-suggester): statusA=500 statusB=409 — 409 confirms lock fired; 500 on first request is anomalous (agent likely still running from inline panel trigger). Second probe (opportunity-watcher, clean idle): statusA=200 statusB=409 — PASS.
- Brand Monitor: pre-trigger showed "error" badge with DB error text ("bind message supplies 7 parameters"); after fresh run returned HTTP 200 ok:true, badge reset to "enabled". The DB error is from a previous run, not a persistent fault.
- Platform Sync: HTTP 500 on run; UI stayed stable (no crash, "enabled" badge, Run now button intact). Likely missing TWITTER_BEARER_TOKEN.
- Opportunity Watcher: HTTP 200 ok:true during concurrency probe second run.
- Robotics News: not seeded in DB (never run via CLI runner) — absent from /admin/agents page entirely.

**FAIL found:** Concurrency probe on blog-suggester returned 500+409 (not 200+409). Root cause: agent was likely still in "running" state from the immediately-prior inline panel trigger. The atomic lock correctly issued 409; but first request hit an already-running agent rather than a clean idle start, producing 500 instead of 200. Clean-idle probe (opportunity-watcher) returned correct 200+409.

**Why:** Phase 1 of Milestone 4.12 end-user testing before VPS deployment.
**How to apply:** When testing agents, ensure a clean-idle state before concurrency probes. Platform Sync 500 is env-gated (TWITTER_BEARER_TOKEN absent). Brand Monitor "error" badge persists from prior failed run until a successful run resets it.
