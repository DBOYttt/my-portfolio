---
name: Blog Pages — Logbook Redesign Audit Findings
description: Bugs found during logbook redesign audit of /blog and /blog/[slug]; old design system classes not migrated
type: project
---

Blog listing and post detail pages were NOT updated during the Engineering Logbook redesign. They still reference the old design system classes (`section-container`, `section-heading`, `accent-line`, `card`, `tag`, `btn-secondary`) which are absent from the new `globals.css`. Also affects `/projects`, `/projects/[slug]`, and not-found pages.

**Why:** The redesign updated `globals.css`, `Nav.tsx`, `Footer.tsx`, and homepage section components, but left the standalone page routes (`/blog`, `/blog/[slug]`, `/projects`, `/projects/[slug]`) on the old class set.

**How to apply:** When the owner asks to "fix the blog/projects styling," these are the specific files to update. The replacement pattern is: `section-container` → `page`, `section-heading` → `section-title` (with logbook-row layout), `accent-line` → `<HandRule />`, `card` → `entry`, `tag` → use `.entry-tags` span pattern, `btn-secondary` → `btn-link`.

Known bugs from this run:
- [P1] blog/page.tsx: section-container, section-heading, accent-line, card, tag — all undefined CSS classes (zero visual styling)
- [P1] blog/[slug]/page.tsx: section-container, tag — undefined CSS classes
- [P1] projects/page.tsx: section-container, section-heading, accent-line, tag — undefined
- [P1] projects/[slug]/page.tsx: section-container, tag, btn-secondary — undefined
- [P1] blog/[slug]/not-found.tsx, projects/[slug]/not-found.tsx: section-container — undefined
- [P2] JSON-LD url field hardcoded to "https://yourdomain.com" — NEXT_PUBLIC_BASE_URL not set in .env
- [P3] Nav theme toggle button text always SSR-renders as "☀  light" regardless of stored preference — minor flash on dark-mode visitors; no hydration error but label flickers
