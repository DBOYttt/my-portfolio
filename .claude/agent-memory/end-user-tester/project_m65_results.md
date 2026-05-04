---
name: Milestone 6.5 — Admin Panel Audit Results
description: Full walkthrough of all admin sections (M6.5). 2 new P2 bugs found, 1 pre-existing P3 confirmed, 2 new P3 bugs found.
type: project
---

Full admin panel audit completed 2026-05-04. All 11 sections tested.

**Why:** Milestone 6.5 task — first full admin walkthrough since M5.5 Logbook redesign, pre-MCP-server deployment gate.

**How to apply:** Fix P2 bugs before VPS deploy. P3s can be batched.

## New Bugs Found

### P2 — CvEditor skill category mismatch
- File: `src/components/admin/CvEditor.tsx` CAT_TO_DB and DB_TO_CAT mappings
- CvEditor uses LANGUAGES/FRAMEWORKS/DATABASES/TOOLS/CONCEPTS (pluralized/invented)
- Prisma schema enum uses LANGUAGE/FRAMEWORK/DATABASE/TOOL/OTHER
- Result: ALL skills fall into "Other" on the CV page — never appear in their correct section
- Fix: align the mapping constants with the actual enum values

### P2 — Experience has no inline edit
- URL: /admin/experience
- Only Add and Remove operations exist in the server component
- No edit/update functionality — to correct an entry you must delete and re-add
- This was by design in the initial implementation but is a missing feature

### P3 — Admin page titles all show "Logbook" default
- Only /admin/cv exports metadata with a proper title
- All other admin pages (Dashboard, Blog, Projects, Skills, Experience, Media, Agents, Tools)
  inherit root layout default: "Andrzej Czajkowski-Nazim — Logbook"
- Should show e.g. "Blog | Admin | ..." for each section

### P3 — robots.txt has placeholder sitemap URL
- `Sitemap: https://yourdomain.com/sitemap.xml` — not the real domain
- Must be updated before public VPS deployment

### P3 — Draft link ?title= param ignored (pre-existing, confirmed still present)
- /admin/blog/new?title=... does not pre-fill the title input
- Draft → links from agent report pages are broken

## What PASSED
- Login/logout/auth guard all working correctly
- Dashboard: stat cards, agent insights, platform connections all render
- Blog CRUD: list, create, edit (PUT), delete all work via API; MDEditor renders correctly
- Blog AI: generate-outline (suggest topics) and generate-content both return 200
- Projects CRUD: list, create (POST), edit (PUT), delete all work; all 4 type options present
- Skills CRUD: list, add, delete all work; Sync from GitHub button present
- Experience: add and delete work; 0-entry empty state renders correctly
- Agents: all 9 agents listed with badges/unread counts; Blog Suggester ran successfully;
  report detail renders with Draft→ links and Create drafts button
- CV: page loads; summary editable; cv.pdf accessible (200); projects shown with checkboxes;
  CvTargetForm visible; Run now and Save & Render PDF buttons present
- Media: upload (201) and delete (204) work; empty state renders; file stored in public/uploads
- Tools: existing n8n shortcut renders; add and delete work
- Mobile (375px): hamburger present; sidebar hidden off-canvas; table overflow handled;
  no horizontal scroll clipping observed
- Auth protection: all /admin/* pages → 307 redirect; /api/admin/* → 401 when unauthenticated
- Contact form rate limit: 429 on 6th request — correct
- sitemap.xml: 200 application/xml
- cv.pdf: 200, 637KB
