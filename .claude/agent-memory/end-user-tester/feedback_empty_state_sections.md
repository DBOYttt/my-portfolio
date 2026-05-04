---
name: Homepage sections fully suppressed when DB empty, breaking nav anchors
description: Experience and Projects preview sections render nothing (not even a heading) when DB has no rows, causing nav anchor links to scroll to top instead of the section
type: feedback
---

When the DB has no experience rows, the Experience section component renders null/empty — no `id="experience"` anchor exists in the DOM. Same for the Projects preview section with no projects. The nav links `#experience` and `#projects` then resolve to the top of the page.

**Why:** Components conditionally render based on data presence without always rendering their anchor wrapper. This breaks in freshly seeded DBs and would break in production if the owner clears all experience/projects.
**How to apply:** Each section should always render its anchor container with `id=`, even if the content inside shows an empty state message. Check ExperienceSection and ProjectsPreview components.
