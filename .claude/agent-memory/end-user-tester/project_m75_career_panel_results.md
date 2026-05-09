---
name: Milestone 7.5 — Career Admin Panel Test Results
description: End-user test of /admin/career panel on port 8080 (nginx-proxied); all flows, bugs, and edge cases found
type: project
---

Career admin panel tested 2026-05-08 on http://localhost:8080 (nginx → Next.js stack).

**Why:** M7.5 introduced the career-ops integration — new /admin/career page replacing /admin/cv.

## Test Results Summary

All 8 test flows executed. 0 P0/P1 bugs. 1 P2 bug. 1 P3 note.

### Flow results

1. **Public homepage** — PASS. Loads on port 8080, all sections rendered, zero console errors.
2. **Admin login** — PASS. /admin redirects to /admin/login when unauthenticated (307 → /admin/login?callbackUrl=...). Login page renders correctly (email, password, Sign in button). Curl-based login confirmed auth works and issues a valid session token. Admin dashboard accessible post-login.
3. **Career page structure** — PASS. /admin/career renders three sections: Career Profile (5 collapsible detail groups: Contact, Target Roles, Narrative, Compensation, Location), Evaluate a Job (URL input + Evaluate button), Evaluation Pipeline (empty state: "No evaluations yet."). Also renders Publish Master CV section (not in original brief).
4. **Career Profile auto-save** — PARTIALLY TESTED. `form_input` tool sets DOM value but doesn't fire React onChange (no debounce trigger from tool). API layer tested directly via curl: GET returns stored config (200), PATCH saves and persists (200), round-trip confirmed working. The "Saved" indicator is rendered conditionally — visible only after debounce fires.
5. **Sync button** — PASS. POST /api/admin/career/sync returns 200 `{ok:true, profileFields:[...]}`. Syncs profile.yml and cv.md to career-ops container. Unauthenticated returns 401.
6. **Evaluate flow** — PASS. POST /api/admin/career/evaluate returns {jobId} (200). Status polling works: running → done transition confirmed. Log lines appear in status response. With placeholder URL (example.com) career-ops returns a helpful "that's a placeholder" message with status "done". No error — graceful handling.
7. **Sidebar navigation** — PASS. Sidebar links: Dashboard, Blog, Projects, Skills, Experience, Media, Agents, MCP, Career, Tools. No "CV" link present. No duplicate Career link. Career link href="/admin/career" correct.
8. **Old CV redirect** — PASS. GET /admin/cv → 307 → /admin/career (both curl and browser-side confirmed).

## Bugs Found

### [P2] PATCH /api/admin/career/config shallow-merges only at top level — nested fields wiped on partial contact update

URL: /api/admin/career/config
Steps:
  1. PATCH with `{contact:{phone:"A",location:"B"}}`
  2. PATCH with `{contact:{phone:"C"}}` only
  3. GET config
Expected: `{contact:{phone:"C",location:"B"}}` — location preserved
Actual: `{contact:{phone:"C"}}` — location wiped
Note: Does NOT affect the browser UI flow because CareerEvaluateForm always sends the entire config object in persistConfig(). Only impacts direct API callers or future partial-patch scenarios.

### [P3] Pipeline table "No evaluations yet" — completed evaluate jobs don't appear in Pipeline section

URL: /admin/career
Note: By design — evaluate jobs are tracked in-memory in career-ops-server (Map<string,Job>), while pipeline reads /app/cv_output/pipeline.json written by the Claude Code CLI. These are separate stores. After a job completes, reloading the page shows "No evaluations yet" even though the job ran. This creates a UX gap — user has no persistent history of evaluated jobs. Not a bug per se but worth noting for UX improvement.

## Other observations

- Publish CV returns 404 "master-cv.pdf not found in cv-output volume" — expected (no CV has been generated via /cv master yet).
- Network/console capture via extension requires navigation tracking to start before page load — initial `useEffect` fetch to /api/admin/career/config was not observable in the network tool. All API testing done via curl with real session instead.
- computer (click/type) tool blocked in this session's sandbox — cannot simulate real keystrokes to trigger React onChange handlers. Test methodology relies on curl + form_input + network/DOM reads.

**How to apply:** Flag the P2 shallow-merge bug for fix if the config API is ever used with partial payloads or from MCP tools. The P3 pipeline UX gap is a backlog item for M10 growth features.
