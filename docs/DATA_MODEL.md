# Data Model Reference

Source of truth: `prisma/schema.prisma`

This document explains the intent and usage of each model. Always update this file when the schema changes.

---

## Auth

### User
Single admin user. No registration flow — created via `npm run db:seed`.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | Primary key |
| email | String (unique) | Login credential |
| passwordHash | String | bcrypt hash, cost factor 12 |
| name | String? | Display name in admin |
| careerConfig | Json? | Stores career profile configuration (contact info, compensation, narrative, etc.) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Session
Present in the schema for Auth.js compatibility. **Not actively used** — Auth.js v5 with the Credentials provider requires `strategy: "jwt"`, so sessions are stored in signed cookies, not the database. This table is kept in the schema to avoid migration conflicts if Auth.js writes to it internally.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | |
| sessionToken | String (unique) | Auth.js token identifier |
| userId | String | FK → User |
| expires | DateTime | Token expiry |
| createdAt | DateTime | |

---

## Blog

### Post
Blog articles. Content stored as Markdown, rendered to HTML on display.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | |
| title | String | Display title |
| slug | String (unique) | URL segment — auto-generated from title, editable |
| content | String | Markdown body |
| excerpt | String? | 1-2 sentence summary for listings |
| featuredImage | String? | URL to stored image (R2 or local) |
| status | PostStatus | DRAFT / PUBLISHED / SCHEDULED |
| publishedAt | DateTime? | Set when status → PUBLISHED |
| scheduledFor | DateTime? | Cron checks and publishes at this time |
| seoTitle | String? | Overrides `title` in `<title>` tag |
| seoDesc | String? | Meta description |
| categoryId | String? | FK → Category |

**Relations:** many-to-many with `Tag` via `PostTags`

### Tag
Flat list of tags. Reused across posts. Slugs used in URL filtering.

### Category
Hierarchical grouping (one per post). Examples: "Robotics", "Software", "Career".

---

## Portfolio

### Project
Portfolio projects and case studies.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | |
| title | String | |
| slug | String (unique) | URL for case study page |
| summary | String | One-paragraph overview (used in cards) |
| content | String | Full Markdown case study |
| coverImage | String? | URL to cover image |
| techTags | String[] | Array of tech labels e.g. ["ROS2", "Python"] |
| type | ProjectType | SOFTWARE / ROBOTICS / HARDWARE / RESEARCH |
| githubUrl | String? | |
| liveUrl | String? | |
| featured | Boolean | Show on homepage (max 3) |
| order | Int | Manual sort order |
| publishedAt | DateTime? | Null = hidden from public |
| year | String? | Display year e.g. "2024" — used in logbook entry header |
| sketchLabel | String? | Label for the engineering sketch placeholder e.g. "FIG. 01 — chassis + sensor mast" |

### Skill
Individual skills displayed in the Skills section.

| Field | Type | Notes |
|---|---|---|
| name | String | e.g. "Python" |
| category | SkillCategory | LANGUAGE / FRAMEWORK / TOOL / ROBOTICS / EMBEDDED / DATABASE / OTHER |
| level | SkillLevel? | FAMILIAR / PROFICIENT / EXPERT (optional — don't show if subjective) |
| order | Int | Sort within category |

### Experience
Career timeline entries.

| Field | Type | Notes |
|---|---|---|
| company | String | |
| role | String | Job title |
| description | String | What you built/achieved (not responsibilities) |
| startDate | DateTime | |
| endDate | DateTime? | Null if current |
| current | Boolean | Shows "Present" in UI |
| location | String? | |
| type | WorkType | FULLTIME / PARTTIME / CONTRACT / INTERNSHIP / VOLUNTEER |
| order | Int | Manual sort (usually newest first = lowest order number) |

### ExternalLink
Social and platform links shown in footer and About section.

| Field | Type | Notes |
|---|---|---|
| label | String | Display name e.g. "GitHub" |
| url | String | Full URL |
| type | LinkType | GITHUB / LINKEDIN / TWITTER / YOUTUBE / EMAIL / OTHER |
| icon | String? | Icon identifier for UI |
| order | Int | Display order |

---

## Media

### MediaAsset
Tracks uploaded files (images, documents).

| Field | Type | Notes |
|---|---|---|
| filename | String | Original filename |
| url | String | Public access URL (R2 or local) |
| mimeType | String | e.g. "image/webp" |
| sizeBytes | Int | For storage management |
| uploadedAt | DateTime | |

---

## AI Agents

### Agent
Configuration record for each agent type. One row per agent type in the DB.

| Field | Type | Notes |
|---|---|---|
| name | String | Display name e.g. "GitHub Summarizer" |
| type | AgentType | See enum below |
| description | String | What the agent does |
| enabled | Boolean | Toggle without deleting |
| schedule | String | Cron expression e.g. "0 9 * * 1" |
| config | Json | Agent-specific settings (search terms, repos, feed URLs) |
| status | String | `"idle"` / `"running"` / `"error"` — updated atomically via `updateMany` |
| lastError | String? | Error message from last failed run |
| lastRunAt | DateTime? | Updated after each successful run |

**AgentType enum:**
- `GITHUB_SUMMARIZER` — Weekly GitHub activity + profile sync
- `BRAND_MONITOR` — Web mentions of owner name/projects
- `ROBOTICS_NEWS` — Weekly RSS digest from robotics feeds
- `BLOG_SUGGESTER` — Monthly content ideas
- `SKILLS_INFERENCE` — GitHub/project/post analysis → skill diff (owner-approved)
- `GITHUB_PROJECT_IMPORTER` — Auto-create draft Project rows from new public repos
- `PLATFORM_SYNC` — Combined GitHub + Twitter profile report

### AgentReport
Output from each agent run. Immutable once created.

| Field | Type | Notes |
|---|---|---|
| agentId | String | FK → Agent |
| title | String | Report headline e.g. "GitHub Activity — April 2026" |
| summary | String | Markdown-formatted LLM summary |
| rawData | Json? | Raw API response data (not shown publicly) |
| sources | String[] | List of source URLs |
| readAt | DateTime? | Null = unread (shows badge in admin) |
| createdAt | DateTime | |

### MonitoredTopic
User-defined topics for agents to track. Referenced in agent `config` JSON.

| Field | Type | Notes |
|---|---|---|
| name | String | e.g. "ROS2 developments" |
| keywords | String[] | Search terms |
| sources | String[] | RSS URLs, GitHub repo paths |
| active | Boolean | |

---

## Admin

### ToolShortcut
Links to self-hosted tools shown in the admin Tools panel.

| Field | Type | Notes |
|---|---|---|
| name | String | e.g. "n8n" |
| url | String | Internal or VPN URL |
| description | String? | Short description |
| icon | String? | Emoji or icon identifier |
| openInNewTab | Boolean | Default: true |
| order | Int | Display order |

### AuditLog
Immutable record of admin actions. Used for accountability and debugging.

| Field | Type | Notes |
|---|---|---|
| action | String | e.g. "post.published", "agent.triggered", "admin.login" |
| entityId | String? | ID of the affected record |
| metadata | Json? | Additional context |
| createdAt | DateTime | |

**Log everything that modifies data:**
- `post.created`, `post.updated`, `post.deleted`, `post.published`
- `project.created`, `project.updated`, `project.deleted`
- `agent.triggered`, `agent.completed`, `agent.failed`
- `admin.login`, `admin.logout`
- `media.uploaded`, `media.deleted`

---

## Schema Change Process

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate -- --name describe_what_changed`
3. Run `npm run db:generate` (updates Prisma client types)
4. Update this document
5. Commit both the schema file and the new migration file
6. If the change is breaking (removing/renaming fields), handle existing data in the migration SQL

Never use `db:push` in production — it skips migration history.
