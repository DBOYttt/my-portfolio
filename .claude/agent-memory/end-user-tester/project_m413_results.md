---
name: Milestone 4.13 — Test Results
description: PASS/FAIL results from Milestone 4.13 verification run on 2026-04-18
type: project
---

Milestone 4.13 end-user verification run on 2026-04-18. Tested items: A1 (responsive sidebar), A2 (POST /api/admin/media route), A3 (HEAD /uploads files), A4 (dashboard agent insights widget), Part C (CV editor expansion).

**A1 — Responsive Sidebar: PASS**
- At 414px: sidebar hidden behind off-canvas drawer, hamburger button visible in TopBar with `md:hidden`
- Clicking hamburger opens drawer with `bg-black/50` overlay (`opacity-100 pointer-events-auto` when open)
- Clicking overlay closes drawer (confirmed via DOM: overlay onClick=onClose)
- Clicking any nav link closes drawer (each Link has onClick={onClose})
- At 1280px: sidebar always visible, no hamburger shown
- No horizontal overflow at mobile width on Dashboard, Blog, Skills pages
- Projects table clips Actions column at mobile (container overflow-hidden, table 546px > 466px container) — P2 issue exists but is pre-existing, sidebar responsiveness itself passes

**A2 — POST /api/admin/media: PASS**
- Returns 405 with `{"error":"File uploads must go to /api/admin/media/upload"}`
- Without auth: returns 401 `{"error":"Unauthorised"}` (correct auth guard still works)

**A3 — HEAD /uploads: PASS**
- HEAD on static file in public/uploads/ returns 200 (tested with temporary test file)
- HEAD on /uploads/ directory returns 404 (correct — no index)
- No 503 errors observed

**A4 — Dashboard agent insights widget: PASS**
- Shows list of 5 most-recent report rows with: report title, agent name (muted), relative timestamp ("4h ago")
- "5 unread" badge + "View all" link present
- Works correctly at both 1280px desktop and 414px mobile

**Part C — CV Editor expansion: PASS**
- "Save all & Render PDF" button present at top of editor
- IT-standard skill categories: Languages, Frameworks & Libraries, Databases, Tools & Platforms, Concepts, Other (for unmapped)
- Per-row experience editing: Company, Role, Start date (date input), End date (disabled when current), Current role checkbox, Type select, Description textarea
- Up/Down reorder buttons on each experience row (↑/↓, disabled at boundaries)
- Delete button per experience row
- Projects section with "Show in CV" checkboxes per project
- Amber dirty dots: PROFILE SUMMARY dot, SKILLS dot, EXPERIENCE dot, PROJECTS dot — all appear when respective section is changed
- "Unsaved changes" text appears next to Save button when any section dirty
- Dirty state correctly resets on fresh page load (F5) and fresh SPA navigation
- PUT /api/admin/experience/[id]: 200
- PUT /api/admin/projects/[id]: 200
- PUT /api/admin/skills/[id]: 200
- DELETE /api/admin/experience/[id]: exists (204)

**Bugs found:**
- P2: Projects admin table at mobile (414px) clips Actions column — container uses overflow-hidden, needs overflow-x-auto. Edit/Delete buttons partially or fully hidden. Also affects Blog table (same pattern). Pre-existing design issue, not introduced by M4.13.

**Console noise:**
- Only crxemulator hydration warning (Chrome extension artifact, not an app bug) — consistent across all pages

**Why:** Milestone 4.13 verification before marking milestone complete.
**How to apply:** All A-series items and Part C are verified PASS. The one remaining P2 (table clipping on mobile) is a pre-existing issue not introduced in M4.13.
