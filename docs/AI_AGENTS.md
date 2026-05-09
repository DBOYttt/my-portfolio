# AI Agents

## Overview

Agents are standalone TypeScript scripts in the `agents/` directory. They run as separate Node.js processes, triggered by system cron or manually. Each agent:

1. Fetches data from public APIs or RSS feeds
2. Optionally summarises with an LLM (Anthropic Claude)
3. Writes an `AgentReport` row to the database
4. Never modifies public content directly

Agents are **research assistants**, not autonomous actors. They surface information; the owner decides what to do with it. In Milestone 7, an MCP server will expose the full content API so AI agents can also *write* content — creating posts, updating projects, and populating the portfolio programmatically via the Model Context Protocol.

---

## Legal and Ethical Boundaries

All agents must comply with these rules. Do not implement anything that violates them.

| Rule | Detail |
|---|---|
| Public data only | Never access private accounts, scrape behind login walls, or use stolen credentials |
| Respect robots.txt | If fetching a website directly, check `robots.txt` first |
| Use official APIs | Prefer official APIs over scraping. Use RSS where designed for it. |
| Rate limits | Stay within free tier limits. Add delays between requests if needed. |
| No LinkedIn scraping | LinkedIn's ToS explicitly prohibits scraping. Use job board APIs instead. |
| Store links, not full content | For news/articles, store title + URL + excerpt. Do not reproduce full text. |
| User-configurable | Each agent's target topics/repos/keywords are stored in the DB `Agent.config` JSON, not hardcoded. |

---

## Agent Architecture

```
agents/
├── github-summarizer.ts       ← Weekly GitHub activity + profile sync
├── robotics-news.ts           ← Weekly RSS digest (robotics/tech feeds)
├── blog-suggester.ts          ← Monthly content ideas
├── brand-monitor.ts           ← Web mention monitoring
├── skills-inference.ts        ← GitHub/project/post analysis → skill diff
├── github-project-importer.ts ← Auto-create project drafts from GitHub repos
└── platform-sync.ts           ← GitHub profile + Twitter combined report
```

### Agent script structure

Every agent script follows this pattern:

```typescript
// CRITICAL: Always import from the singleton — never use new PrismaClient()
// The PrismaPg adapter is only set up in the singleton; direct instantiation fails.
import { prisma } from "../src/lib/prisma";

async function run() {
  // 1. Upsert the Agent configuration record
  const agent = await prisma.agent.upsert({ ... });

  // 2. Fetch data from external sources
  const data = await fetchData();

  // 3. Summarize with LLM (optional)
  const summary = await summarize(data);

  // 4. Write AgentReport
  await prisma.agentReport.create({ data: { agentId: agent.id, ... } });

  // 5. Update lastRunAt
  await prisma.agent.update({ where: { id: agent.id }, data: { lastRunAt: new Date() } });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### LLM integration pattern

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function summarize(content: string): Promise<string> {
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",  // Use Haiku for cost efficiency on agents
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Summarize the following in clear Markdown. Be concise and factual.\n\n${content}`
    }]
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}
```

Use `claude-haiku-4-5-20251001` for agents — it's cheap and fast for summarization tasks. Reserve Sonnet/Opus for complex reasoning if needed.

---

## Implemented Agents

### GitHub Summarizer (`agents/github-summarizer.ts`)

**Purpose:** Weekly summary of public GitHub activity.

| Property | Value |
|---|---|
| Schedule | `0 9 * * 1` (Monday 9am) |
| Data source | GitHub public API — `/users/{username}/repos`, `/users/{username}/events` |
| LLM | Yes — summary of activity and notable repos |
| Rate limit | 5000 req/hr with token; 60/hr without |
| Auth | `GITHUB_TOKEN` env var (optional but recommended) |

**Current state:** Fully implemented. Fetches repos + full GitHub profile (`/users/{username}`). rawData includes `{ repos: [...], profile: { bio, location, blog, twitter_username, followers } }`. Requires `ANTHROPIC_API_KEY` for LLM summary; falls back to structured output without it.

**Config JSON shape:**
```json
{ "username": "yourusername" }
```

---

### Robotics News Curator (`agents/robotics-news.ts`)

**Purpose:** Weekly digest of robotics and tech news from public RSS feeds.

| Property | Value |
|---|---|
| Schedule | `0 8 * * 5` (Friday 8am) |
| Data source | Public RSS feeds (IEEE Spectrum, Hackaday, The Robot Report) |
| LLM | Optional — add summaries per item in Milestone 4 |
| Rate limit | RSS is pull-based; no rate limits |
| Auth | None required |

**Current state:** Implemented. Fetches and parses RSS feeds. Reports written to DB.

**Config JSON shape:**
```json
{
  "feeds": [
    "https://spectrum.ieee.org/feeds/topic/robotics.rss",
    "https://hackaday.com/feed/"
  ]
}
```

---

## Additional Implemented Agents

### Blog Topic Suggester (`agents/blog-suggester.ts`)

**Purpose:** Monthly content idea generation based on owner's activity.

**Inputs:** Existing post titles + tags (DB), trending Hacker News API stories
**Output:** `{ suggestions: [{ title, tags, rationale }], existingTopics: N }`
**Schedule:** `0 9 1 * *` (1st of each month)
**Admin UI:** Inline "💡 Suggest topics" panel in blog editor; clicking a suggestion pill pre-fills title, slug, tags.

---

### Personal Brand Monitor (`agents/brand-monitor.ts`)

**Purpose:** Find new public web mentions of the owner's name and projects.

**Data source:** Brave Search API or SerpAPI (official APIs only — no scraping)
**Output:** List of new URLs with title + snippet; deduplicates against previous reports
**Schedule:** `0 9 * * 3` (Wednesday 9am)

---

### Skills Inference (`agents/skills-inference.ts`)

**Purpose:** Keep the Skills section evidence-based and up to date without manual editing.

**Inputs:** GitHub repo languages + topics, `Project.techTags`, `Post.tags`
**LLM:** Claude haiku produces `{ add: [...], upgrade: [...], stale: [...] }` diff
**Admin UI:** Apply/Upgrade tables in report detail — **never auto-writes to DB; always owner-approved**
**Schedule:** Weekly, after GitHub Summarizer

---

### GitHub Project Importer (`agents/github-project-importer.ts`)

**Purpose:** Auto-create draft Project rows from new public GitHub repos.

**Process:** Fetch up to 5 new repos → README + languages → Claude haiku generates title/summary/content → `prisma.project.create()` as draft (unpublished)
**rawData:** `{ type: "PROJECT_CREATED", created: [...], skipped: N }`
**Slug collision:** Wrapped in try-catch; P2002 skipped silently; `existingSlugs` set updated after each insert to prevent intra-batch collisions
**Admin UI:** Projects page "Import from GitHub" button; report shows "Edit draft →" links

---

### Platform Sync (`agents/platform-sync.ts`)

**Purpose:** Combined GitHub profile + X/Twitter snapshot report.

**Sources:** GitHub `/users/{username}` profile API + Twitter API v2 (graceful null if `TWITTER_BEARER_TOKEN` unset)
**Output:** Markdown report combining both platform summaries
**Admin UI:** Admin dashboard "Platform Connections" card shows status of each platform integration

---

## Career-Ops Integration

Career-ops is an isolated Docker service (not a portfolio agent) that handles job evaluation and CV targeting using Claude Code CLI. It is triggered via the admin Career panel, not cron. The admin can submit a job URL for evaluation, view the scored pipeline, and publish the resulting master CV to `public/cv.pdf`. The `career-ops-server` wrapper exposes HTTP endpoints: `POST /evaluate`, `GET /status/:jobId`, `POST /cv/master`, `GET /pipeline`, `POST /sync`, `GET /health`. Communication uses a shared bearer secret (`CAREER_OPS_INTERNAL_SECRET`).

The service runs in a `career-ops-internal` bridge network that has no access to PostgreSQL — only the Next.js app can reach it. A shared `cv_output` Docker volume is used for PDF hand-off: career-ops writes `master.pdf` there; the portfolio admin panel publishes it to `public/cv.pdf` via `POST /api/admin/career/cv/publish`.

---

## Running Agents

### Manual execution
```bash
npx tsx agents/github-summarizer.ts
npx tsx agents/robotics-news.ts
npx tsx agents/blog-suggester.ts
npx tsx agents/brand-monitor.ts
npx tsx agents/skills-inference.ts           # seeds DB row on first run
npx tsx agents/github-project-importer.ts    # seeds DB row on first run
npx tsx agents/platform-sync.ts              # seeds DB row on first run
```

### Cron setup (system crontab)
```bash
crontab -e
```

Add:
```
# GitHub Summarizer — every Monday 9am
0 9 * * 1 cd /path/to/my-portfolio && npx tsx agents/github-summarizer.ts >> /var/log/portfolio-agents.log 2>&1

# Robotics News — every Friday 8am
0 8 * * 5 cd /path/to/my-portfolio && npx tsx agents/robotics-news.ts >> /var/log/portfolio-agents.log 2>&1
```

### Manual trigger from admin panel
The `/admin/agents` page has a "Run now" button for each agent.
This calls `POST /api/admin/agents/[id]/run`. The route uses an atomic `updateMany` lock so concurrent clicks cannot create duplicate reports — only the first request claiming the `status: { not: "running" }` condition wins; others receive 409.

---

## Displaying Reports in Admin

Reports are fetched from the `AgentReport` table and displayed in:
- `/admin/agents` — list of agents with last report summary
- `/admin/agents/reports/[id]` — full report with sources
- `/admin` dashboard — "Agent Insights" widget showing latest unread report per agent

Unread badge: `AgentReport.readAt === null`
Mark as read: `PATCH /api/admin/agents/reports/[id]/read`

---

## Planned: MCP Server (Milestone 7)

The existing cron-based agents write `AgentReport` rows to the DB. They cannot modify content directly.

Milestone 7 adds an MCP (Model Context Protocol) server that exposes the full portfolio as a read/write API for AI clients (Claude Desktop, Claude Code, n8n, custom agents):

- **Resources:** read portfolio content (posts, projects, skills, experience, owner bio, CV, agent reports)
- **Tools:** create/update posts + projects, manage skills and experience, trigger agents, generate CV
- **Auth:** bearer token (HTTP mode) or local-access-only (stdio mode)
- **Writes:** every tool call goes through the same Prisma models as the admin panel; all writes logged to `AuditLog`

See `docs/MCP_SETUP.md` (created in M7) for setup instructions for Claude Desktop, Claude Code, and n8n.

### Why MCP over direct DB access?
MCP gives AI clients a structured, typed interface with field validation and auth. Direct DB access would require sharing production credentials with every agent. MCP tools can also enforce business logic (e.g. slug uniqueness, status transitions) that raw SQL cannot.
