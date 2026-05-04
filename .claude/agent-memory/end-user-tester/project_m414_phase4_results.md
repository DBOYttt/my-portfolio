---
name: Milestone 4.14 Phase 4 — Agent Feature Test Results
description: Findings from testing Phase 4 agent features (OW, BM, SI, BS) on 2026-04-19
type: project
---

Tested on 2026-04-19. Chrome extension not connected (Brave browser); tests performed via curl + code review.

## PASS Items

- OW: Multi-source fetch (Remotive + We Work Remotely + HackerNews) all present in source breakdown
- OW: Deduplication stat chips render (new jobs + already seen + total matched)
- OW: Score badges (1-10) and "Strong match" badge (score >= 8) render correctly
- OW-A: Keywords seeded from HARDCODED_KEYWORDS on first run, persisted in agent config
- OW-C: seenJobUrls persisted after run (34 URLs stored after 2 runs)
- OW-E: Email alert not triggered (OPPORTUNITY_ALERT_EMAIL env var not set in dev)
- BM: GitHub star/fork delta table present with all 11 repos
- BM: Google Alerts shows "No feeds configured" message when GOOGLE_ALERTS_RSS_FEEDS not set
- SI: "Apply all N additions" batch button present and serializes valid levels (FAMILIAR/PROFICIENT/EXPERT)
- SI: Individual Apply buttons and Skills to Upgrade section render correctly
- BS: generate-outline endpoint works (returns 4-6 sections)
- BS: generate-content endpoint works (returns full markdown)
- BS: showOutlinePrompt rendered after suggestion pill click (by code review)
- BS: Skip button calls generateContent() immediately (no intermediate offer step)
- BS report: Content Series section present with "Create N drafts" button
- BS report: Standalone suggestions have correct "Draft ->" links to /admin/blog/new?title=...
- tsc --noEmit: clean

## BUG Items

**BUG-1 [P2] SI-C job mention badges never appear after a dedup OW run**
- The SI report page queries `latestOWReport` (most recent by createdAt)
- If OW has been run twice, the second run returns 0 jobs (dedup)
- SI then renders 0 job badges for all skills even when the first OW run had relevant data
- Root cause: the dedup run produces a report with jobs:[] which becomes the "latest"
- Fix: query OW reports ordered by jobs count or skip 0-job reports

**BUG-2 [P3] Brand Monitor Dev.to section absent when devToMentions=0**
- The test spec says "Dev.to section present (empty is fine)"
- Both the summary markdown and UI card skip Dev.to entirely when devToMentions=0
- No empty state card, no "No Dev.to mentions found" message
- Contrast: Google Alerts renders an informational message when empty

**BUG-3 [P3] applyAllSkillAdditions fallback level "INTERMEDIATE" is not a valid SkillLevel**
- File: src/app/admin/(panel)/agents/reports/[reportId]/page.tsx line 291
- `(i.level ?? "INTERMEDIATE") as SkillLevel` — INTERMEDIATE not in enum (FAMILIAR/PROFICIENT/EXPERT)
- In practice dead code because LLM always returns valid levels, but would crash if triggered
- Fix: change fallback to "FAMILIAR"

**BUG-4 [P3] Draft -> link from BS report ignores ?title query param**
- /admin/blog/new does not read searchParams; PostForm has no initialData from URL
- The ?title= param in Draft links is silently dropped
- User arrives at blank PostForm even after clicking a prefilled link
- Fix: read searchParams in new post page and pass title as initialData

**Known design note: HN source returns 0 jobs in most OW runs**
- HackerNews "Who's Hiring" thread search is monthly and may have no matching comments
- This is expected behavior (0 jobs shown for HN), not a bug

**Why: dedup run blanks SI-C badges** — the `latestOWReport` query should filter to reports
with `rawData.jobs.length > 0` or query by `newJobCount > 0` stored field.
