# Feature Audit — Buttons, Redirections & Expected Outcomes

This document is the QA reference for Milestone 4.12. Every interactive element, form, button, link, redirection, and API route is listed with its expected outcome. Use this as the test matrix during end-user testing.

---

## Public Surface

### `/` — Homepage

| Element | Expected outcome |
|---|---|
| Nav anchor links (About, Skills, Experience, Projects, Robotics, Blog, Contact) | Smooth-scroll to the relevant section |
| "Download CV" button in Nav | Triggers browser download of `/cv.pdf` |
| Mobile hamburger menu | Toggles mobile nav open/closed |
| "View All Projects" link in Projects section | Navigates to `/projects` |
| "Read More" / blog post card links in Blog Preview | Navigates to `/blog/[slug]` |
| Contact form — Name, Email, Message (all required) | Required validation fires on empty submit |
| Contact form — Email field | Rejects non-email values |
| Contact form — Honeypot field (hidden) | Invisible to users; if filled (bots), request silently returns 200 without sending email |
| Contact form — Submit button | POST `/api/contact` → success message shown; email sent via Resend |
| Contact form — Submit (rate limit exceeded) | POST `/api/contact` → 429 → error message shown |
| Contact form — Submit (RESEND_API_KEY missing) | Returns 200 (mock mode), no email sent, success message shown |
| Email link in Contact section | Opens mailto: in email client |
| LinkedIn / GitHub social links | Opens external URL in new tab |

---

### `/projects` — Projects Index

| Element | Expected outcome |
|---|---|
| "All" filter tab | Navigates to `/projects` (clears type filter) |
| "SOFTWARE" / "ROBOTICS" / "HARDWARE" / "RESEARCH" tab | Navigates to `/projects?type=[TYPE]`; shows only matching cards |
| Project card — click anywhere on card | Navigates to `/projects/[slug]` |
| Project card — GitHub icon button | Opens `githubUrl` in new tab (hidden if githubUrl is null) |
| Project card — Live demo icon button | Opens `liveUrl` in new tab (hidden if liveUrl is null) |
| Visiting `/projects?type=INVALID` | Shows 0 results or all results (graceful fallback) |

---

### `/projects/[slug]` — Project Case Study

| Element | Expected outcome |
|---|---|
| "← Projects" back link | Navigates to `/projects` |
| GitHub button | Opens `githubUrl` in new tab (hidden if null) |
| Live Demo button | Opens `liveUrl` in new tab (hidden if null) |
| Table of Contents links (desktop sidebar / mobile collapsible) | Smooth-scrolls to heading anchor on page |
| Mobile ToC toggle | Expands/collapses the ToC (only shown when 3+ headings) |
| Code block "Copy" button | Copies code content to clipboard |
| `/projects/nonexistent-slug` | 404 page |

---

### `/blog` — Blog Listing

| Element | Expected outcome |
|---|---|
| Blog post row / card click | Navigates to `/blog/[slug]` |
| `/blog` with no published posts | Shows empty state message |

---

### `/blog/[slug]` — Blog Post

| Element | Expected outcome |
|---|---|
| "← Blog" back link | Navigates to `/blog` |
| Table of Contents links | Smooth-scrolls to heading anchor |
| Mobile ToC toggle | Expands/collapses ToC (3+ headings only) |
| Code block "Copy" button | Copies code to clipboard |
| `/blog/nonexistent-slug` | 404 page |

---

### `/cv.pdf` — CV Download

| Element | Expected outcome |
|---|---|
| Direct URL access | Browser opens or downloads the PDF |
| URL when file does not exist | 404 |

---

## Admin Surface — Auth

### `/admin/login`

| Element | Expected outcome |
|---|---|
| Email + Password — correct credentials | Redirects to `/admin` (or `callbackUrl` if set) |
| Email + Password — wrong credentials | Stays on login page; shows "Invalid email or password" |
| Email field — empty | Required validation fires |
| Password field — empty | Required validation fires |
| Submit button | Disabled while form is submitting (useFormStatus) |
| Visiting `/admin/*` without session | Redirects to `/admin/login?callbackUrl=[original path]` |
| Visiting `/admin/login` with valid session | Redirected away from login to admin dashboard |

---

## Admin Surface — Dashboard

### `/admin`

| Element | Expected outcome |
|---|---|
| Stats cards (Total Posts, Published, Projects, Skills) | Shows accurate DB counts |
| Agent Insights widget | Shows latest unread report per agent; badge count |
| "New post" quick action link | Navigates to `/admin/blog/new` |
| "New project" quick action link | Navigates to `/admin/projects/new` |
| "View agents" link | Navigates to `/admin/agents` |
| Platform Connections — GitHub | Green indicator if `GITHUB_USERNAME` env is set |
| Platform Connections — X/Twitter | Grey with hint if `TWITTER_BEARER_TOKEN` not set |
| Platform Connections — LinkedIn | Shows "Export data" link to LinkedIn settings |

---

## Admin Surface — Blog

### `/admin/blog`

| Element | Expected outcome |
|---|---|
| "New post" button | Navigates to `/admin/blog/new` |
| "Edit" button per row | Navigates to `/admin/blog/[id]` |
| "Delete" button per row | Calls server action `deletePost`; row disappears immediately; revalidates public `/blog` |
| Post status badges | Shows DRAFT / PUBLISHED / SCHEDULED with correct color |

### `/admin/blog/new` and `/admin/blog/[id]`

| Element | Expected outcome |
|---|---|
| Title field (required) | Auto-generates slug if slug hasn't been manually edited |
| Slug field | Editable; must be URL-safe; validated before submit |
| "💡 Suggest topics" button (AgentSuggestPanel) | Calls Blog Suggester agent inline; shows 5 suggestion pills |
| Suggestion pill — click | Sets title, auto-generates slug, adds associated tags |
| "Generate content" button | POST `/api/admin/blog/generate-content` with title+tags+excerpt; fills markdown editor; requires `ANTHROPIC_API_KEY` |
| "Generate content" — no title set | Button disabled or shows inline error "Title required" |
| "Generate content" — no API key | Returns 503; error shown in UI |
| Markdown editor | Full MDEditor with preview toggle |
| Tags — add tag | Chip appears; tag created in DB on save |
| Tags — remove tag (× on chip) | Chip removed |
| Status selector | DRAFT / PUBLISHED / SCHEDULED |
| Scheduled datetime picker | Appears only when SCHEDULED selected |
| SEO fields (collapsible section) | Expands to show seoTitle and seoDesc |
| "Create post" / "Update post" button | POST `/api/admin/posts` or PUT `/api/admin/posts/[id]`; success → button shows green "Saved"; error → red message |
| "Cancel" button | Navigates to `/admin/blog` without saving |

---

## Admin Surface — Projects

### `/admin/projects`

| Element | Expected outcome |
|---|---|
| "Import from GitHub" button (RunAgentButton) | POST `/api/admin/agents/agent-github-project-importer/run`; spinner during run; on success redirects to `/admin/agents/reports/[reportId]` |
| "Import from GitHub" — already running | Returns 409; button shows "Failed" with tooltip "Agent is already running" |
| "New project" button | Navigates to `/admin/projects/new` |
| "Edit" button per row | Navigates to `/admin/projects/[id]` |
| "Delete" button per row | Calls server action `deleteProject`; row disappears immediately; revalidates `/admin/projects`, `/projects`, `/` |
| Published/Draft status badges | Reflects `publishedAt` presence |

### `/admin/projects/new` and `/admin/projects/[id]`

| Element | Expected outcome |
|---|---|
| Title field (required) | Auto-generates slug |
| Slug (required) | Editable, URL-safe |
| Summary (required) | Plain text |
| Content | Markdown editor |
| Type selector | SOFTWARE / ROBOTICS / HARDWARE / RESEARCH |
| Order field | Integer; controls sort order in public listing |
| Featured checkbox | Marks project for homepage display |
| Tech tags | Add/remove chips; stored as string array |
| GitHub URL / Live URL | Optional; shown as buttons on public case study page |
| "Create project" / "Update project" | POST or PUT; success → green "Saved"; error → red message |
| "Cancel" | Navigates to `/admin/projects` |

---

## Admin Surface — Skills

### `/admin/skills`

| Element | Expected outcome |
|---|---|
| "Sync from GitHub" button (RunAgentButton) | POST `.../agent-skills-inference/run`; on success redirects to report |
| Add skill form — Name (required) | Creates skill with given name |
| Add skill form — Category (required) | LANGUAGE / FRAMEWORK / TOOL / ROBOTICS / EMBEDDED / DATABASE / OTHER |
| Add skill form — Level (optional) | FAMILIAR / PROFICIENT / EXPERT; omit if not set |
| "Add" submit button | Server action `addSkill`; new skill appears in correct category group immediately |
| Level dropdown per skill | Editable inline select |
| "✓" save level button | Server action `updateSkillLevel`; updates level immediately |
| "Remove" button per skill | Server action `deleteSkill`; skill disappears immediately |

---

## Admin Surface — Experience

### `/admin/experience`

| Element | Expected outcome |
|---|---|
| Add experience form — Company, Role, Start Date (required) | Server action `addExperience` on submit; new entry appears immediately |
| "Current" checkbox | Hides end date field; shows "Present" in UI |
| End date field | Hidden if "Current" checked |
| Type selector | FULLTIME / PARTTIME / CONTRACT / INTERNSHIP / VOLUNTEER |
| "Add" submit button | Server action `addExperience`; entry appears immediately |
| "Remove" button per entry | Server action `deleteExperience`; entry disappears immediately |

---

## Admin Surface — Media

### `/admin/media`

| Element | Expected outcome |
|---|---|
| "Upload image" button (MediaUploader) | Opens OS file picker; accepts JPEG, PNG, WebP, GIF |
| File selected (single or multiple) | POST `/api/admin/media/upload` for each; thumbnail appears in grid; progress/error shown |
| File > 5 MB | Returns 400; error shown |
| Non-image file | Returns 400; error shown |
| "Open" button per asset | Opens image URL in new tab |
| "Del" button per asset | Server action `deleteAsset`; removes file from disk + DB; thumbnail disappears immediately |

---

## Admin Surface — CV

### `/admin/cv`

CV generation via `@react-pdf/renderer` has been removed. The `/api/admin/cv/run` and `/api/admin/cv/render` routes no longer exist. The CV page now shows a simple manual upload interface only. CV generation and targeting is handled by the career-ops service via `/admin/career`.

| Element | Expected outcome |
|---|---|
| "Open PDF" button | Opens `/cv.pdf` in new tab (only visible if file exists) |
| "Upload manual PDF" section | Upload interface for placing a PDF directly at `public/cv.pdf` |
| Manual PDF file input | Accepts `.pdf` only; max 5 MB |
| Manual "Upload" button | POST `/api/admin/cv/upload`; writes to `public/cv.pdf` |
| Manual upload — file > 5 MB | Returns 400; error shown |
| Manual upload — non-PDF | Returns 400; error shown |

---

## Admin Surface — Career

### `/admin/career`

| Element | Expected outcome |
|---|---|
| Profile editor — 5 collapsible sections | Contact info, compensation, narrative, target roles, and preferences; changes auto-saved with debounce |
| Job URL input field | Paste any job posting URL |
| "Evaluate" button | POST `/api/admin/career/evaluate`; triggers career-ops evaluation; returns jobId immediately |
| Evaluation status | Polls `GET /api/admin/career/status/:jobId`; shows live status until complete |
| Pipeline table | Lists all evaluated jobs from `GET /api/admin/career/pipeline`; shows score, status, and link |
| "Publish master CV" button | POST `/api/admin/career/cv/publish`; copies `cv_output/master.pdf` to `public/cv.pdf`; confirms success |
| "Sync" button | POST `/api/admin/career/sync`; pushes current profile config + CV markdown to career-ops-server |

---

## Admin Surface — Agents

### `/admin/agents`

| Element | Expected outcome |
|---|---|
| RunAgentButton ("Run now") per agent | POST `/api/admin/agents/[id]/run`; status cycles idle → running → idle/error |
| RunAgentButton — disabled when agent already running | Button disabled (opacity 40) |
| RunAgentButton — 409 response | Button shows red "Failed" with tooltip showing API error message |
| RunAgentButton — 500 / any error | Button shows red "Failed" with tooltip showing error string (e.g. "GITHUB_USERNAME not set in environment") |
| RunAgentButton — success (with redirectOnSuccess) | Redirects to `/admin/agents/reports/[reportId]` |
| RunAgentButton — success (without redirectOnSuccess) | Shows green "Done ✓"; page refreshes |
| "View reports" link per agent | Navigates to `/admin/agents/[agentId]` |
| Enabled/Disabled badge | Reflects agent.enabled value; disabled agents' Run button is disabled |

### `/admin/agents/[agentId]` — Agent Report List

| Element | Expected outcome |
|---|---|
| "← Back" link | Navigates to `/admin/agents` |
| RunAgentButton at top | Same as above |
| Report title link | Navigates to `/admin/agents/reports/[reportId]` |
| "Mark read" button per report | Server action; unread badge clears; button disappears |
| "Delete" (✕) button per report | Server action `deleteReport`; row disappears immediately |
| "Delete all reports" button | Server action `deleteAllReports`; all rows disappear; count resets to 0 |

### `/admin/agents/reports/[reportId]` — Report Detail

| Element | Expected outcome |
|---|---|
| "← [Agent Name]" back link | Navigates to `/admin/agents/[agentId]` |
| "Mark as read" button | Server action; badge clears; button disappears |
| Error banner (`?error=slug-exists`) | Shows red banner: "A project with this slug already exists — edit the slug in the Projects page before trying again." |
| **SKILLS_DIFF reports** | | 
| "Apply" button per skill-to-add row | Server action `applySkillAdd`; creates skill in DB; button changes to "Applied" or disappears |
| "Apply" button per skill-to-upgrade row | Server action `applySkillUpgrade`; updates level in DB |
| "Already exists" state on skill rows | Button disabled; skill already in DB |
| **PROJECT_CREATED reports** | |
| "Edit draft →" link per created project | Navigates to `/admin/projects/[projectId]` |
| **PROJECT_SUGGESTIONS reports (legacy)** | |
| "Create as Draft" button per suggestion | Server action `createProjectDraft`; on success redirects to `/admin/projects/[newProjectId]`; on slug conflict redirects to `?error=slug-exists` |
| Sources list | Each source URL is a clickable external link |
| "Raw data" collapsible | Expands to show formatted JSON |

---

## Admin Surface — Tools

### `/admin/tools`

| Element | Expected outcome |
|---|---|
| Tool card link (tool name) | Opens tool URL (new tab if `openInNewTab = true`) |
| "Remove" button per tool | Server action `deleteTool`; card disappears immediately |
| Add tool form — Name, URL (required) | Validated before submit |
| URL field | type="url" validation |
| Icon field | Emoji or short string (max 4 chars) |
| "Open in new tab" checkbox | Default: checked |
| "Add" submit button | Server action `addTool`; new card appears immediately |

---

## Admin Surface — Global Shell

### Sidebar

| Element | Expected outcome |
|---|---|
| All nav links (Dashboard, Blog, Projects, Skills, Experience, Media, Agents, CV, Tools) | Navigates to the correct admin page |
| Active link | Highlighted based on current pathname |

### TopBar

| Element | Expected outcome |
|---|---|
| User email display | Shows logged-in user's email |
| "Sign out" button | Signs out via Auth.js; redirects to `/admin/login` |

---

## API Routes — Full Reference

### Public

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/api/contact` | None | 200 `{ success: true }` — email sent | 400 invalid fields · 429 rate limited · 500 Resend failure |

### Admin — Posts

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/posts` | Required | 200 posts array | 401 |
| POST | `/api/admin/posts` | Required | 201 created post | 400 missing fields · 401 |
| GET | `/api/admin/posts/[id]` | Required | 200 post | 401 · 404 |
| PUT | `/api/admin/posts/[id]` | Required | 200 updated post | 401 · 404 |
| DELETE | `/api/admin/posts/[id]` | Required | 200 | 401 · 404 |

### Admin — Projects

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/projects` | Required | 200 projects array | 401 |
| POST | `/api/admin/projects` | Required | 201 created project | 400 · 401 |
| GET | `/api/admin/projects/[id]` | Required | 200 project | 401 · 404 |
| PUT | `/api/admin/projects/[id]` | Required | 200 updated project | 401 · 404 |
| DELETE | `/api/admin/projects/[id]` | Required | 200 | 401 · 404 |

### Admin — Skills

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/skills` | Required | 200 skills array | 401 |
| POST | `/api/admin/skills` | Required | 201 created skill | 400 · 401 |
| PUT | `/api/admin/skills/[id]` | Required | 200 updated skill | 401 · 404 |
| DELETE | `/api/admin/skills/[id]` | Required | 200 | 401 · 404 |

### Admin — Experience

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/experience` | Required | 200 experience array | 401 |
| POST | `/api/admin/experience` | Required | 201 created entry | 400 · 401 |
| PUT | `/api/admin/experience/[id]` | Required | 200 updated entry | 401 · 404 |
| DELETE | `/api/admin/experience/[id]` | Required | 200 | 401 · 404 |

### Admin — Media

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/api/admin/media/upload` | Required | 201 `{ url, id }` | 400 no file / wrong type / too large · 401 |
| GET | `/api/admin/media` | Required | 200 assets array | 401 |
| DELETE | `/api/admin/media/[id]` | Required | 200 | 401 · 404 |

### Admin — Blog Content Generation

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/api/admin/blog/generate-content` | Required | 200 `{ content: markdown }` | 400 missing title · 401 · 503 no API key · 500 LLM error |

### Admin — Agents

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/agents` | Required | 200 agents with latest report | 401 |
| POST | `/api/admin/agents/[id]/run` | Required | 200 `{ ok, title, rawData, reportId }` | 400 disabled/no runner · 401 · 404 not found · 409 already running · 500 runner error |
| GET | `/api/admin/agents/reports/[id]` | Required | 200 report | 401 · 404 |
| PATCH | `/api/admin/agents/reports/[id]/read` | Required | 200 | 401 · 404 |

### Admin — CV

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/cv` | Required | 200 `{ cvContent, cvGeneratedAt, cvSource }` | 401 |
| PUT | `/api/admin/cv` | Required | 200 updated cvContent | 401 |
| POST | `/api/admin/cv/render` | Required | 200 `{ ok: true }` | 401 · 500 render error |
| POST | `/api/admin/cv/upload` | Required | 201 `{ url: "/cv.pdf" }` | 400 wrong type / too large · 401 |
| POST | `/api/admin/cv/run` | Required | 200 `{ ok, title }` | 401 · 500 |

### Admin — Tools

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| GET | `/api/admin/tools` | Required | 200 tools array | 401 |
| POST | `/api/admin/tools` | Required | 201 created tool | 400 · 401 |
| DELETE | `/api/admin/tools/[id]` | Required | 200 | 401 · 404 |

### Admin — LinkedIn Import

| Method | Route | Auth | Success | Errors |
|---|---|---|---|---|
| POST | `/api/admin/linkedin/import` | Required | 200 import preview/summary | 400 invalid file · 401 |

---

## Redirections — Complete List

| Trigger | From | Redirects to |
|---|---|---|
| Unauthenticated access to any `/admin/*` page | Any admin page | `/admin/login?callbackUrl=[original path]` |
| Successful login | `/admin/login` | `/admin` or `callbackUrl` |
| Sign out | Any admin page | `/admin/login` |
| "Cancel" in PostForm | `/admin/blog/new` or `/admin/blog/[id]` | `/admin/blog` |
| "Cancel" in ProjectForm | `/admin/projects/new` or `/admin/projects/[id]` | `/admin/projects` |
| Successful post create/update | PostForm | `/admin/blog` |
| Successful project create/update | ProjectForm | `/admin/projects` |
| Agent run success (redirectOnSuccess=true) | Any page with RunAgentButton | `/admin/agents/reports/[reportId]` |
| "Import from GitHub" success | `/admin/projects` | `/admin/agents/reports/[reportId]` |
| "Sync from GitHub" success | `/admin/skills` | `/admin/agents/reports/[reportId]` |
| CV Generator run success | `/admin/cv` | `/admin/agents/reports/[reportId]` |
| `createProjectDraft` success | Report page | `/admin/projects/[newProjectId]` |
| `createProjectDraft` — slug collision | Report page | `/admin/agents/reports/[reportId]?error=slug-exists` |
| `/projects/[slug]` — slug not found | Project slug page | Next.js 404 page |
| `/blog/[slug]` — slug not found | Blog slug page | Next.js 404 page |

---

## Server Actions — Complete List

| Action | File | Trigger | DB operation | Revalidates | Outcome |
|---|---|---|---|---|---|
| `deletePost` | blog/page.tsx | Delete button in post list | `prisma.post.delete` | `/admin/blog`, `/blog`, `/` | Row disappears immediately |
| `deleteProject` | projects/page.tsx | Delete button in project list | `prisma.project.delete` | `/admin/projects`, `/projects`, `/` | Row disappears immediately |
| `addSkill` | skills/page.tsx | Add skill form submit | `prisma.skill.create` | `/admin/skills`, `/` | New skill appears in category group |
| `updateSkillLevel` | skills/page.tsx | ✓ button per skill | `prisma.skill.update` | `/admin/skills` | Level updates inline |
| `deleteSkill` | skills/page.tsx | Remove button per skill | `prisma.skill.delete` | `/admin/skills`, `/` | Skill disappears |
| `addExperience` | experience/page.tsx | Add experience form submit | `prisma.experience.create` | `/admin/experience`, `/` | New entry appears |
| `deleteExperience` | experience/page.tsx | Remove button per entry | `prisma.experience.delete` | `/admin/experience`, `/` | Entry disappears |
| `addTool` | tools/page.tsx | Add tool form submit | `prisma.toolShortcut.create` | `/admin/tools` | New card appears |
| `deleteTool` | tools/page.tsx | Remove button per tool | `prisma.toolShortcut.delete` | `/admin/tools` | Card disappears |
| `deleteAsset` | media/page.tsx | Del button per asset | File delete + `prisma.mediaAsset.delete` | `/admin/media` | Thumbnail disappears |
| `markRead` | agents/[id]/page.tsx and reports/[reportId]/page.tsx | "Mark as read" button | `prisma.agentReport.update` | `/admin/agents`, `/admin` | Unread badge clears |
| `deleteReport` | agents/[id]/page.tsx | ✕ button per report | `prisma.agentReport.delete` | `/admin/agents/[id]`, `/admin` | Row disappears |
| `deleteAllReports` | agents/[id]/page.tsx | "Delete all" button | `prisma.agentReport.deleteMany` | `/admin/agents/[id]`, `/admin` | All rows disappear |
| `applySkillAdd` | reports/[reportId]/page.tsx | "Apply" on skill-to-add row | `prisma.skill.upsert` | `/admin/skills`, `/admin/agents/reports/[id]` | Row marked applied; public Skills section updated |
| `applySkillUpgrade` | reports/[reportId]/page.tsx | "Apply" on skill-to-upgrade row | `prisma.skill.update` | `/admin/skills`, `/admin/agents/reports/[id]` | Level updated; row marked applied |
| `createProjectDraft` | reports/[reportId]/page.tsx | "Create as Draft" on suggestion | `prisma.project.create` | `/admin/projects` | Redirect to edit page; or `?error=slug-exists` on conflict |
