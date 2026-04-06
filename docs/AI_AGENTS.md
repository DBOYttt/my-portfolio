# AI Agents

## Overview

Agents are standalone TypeScript scripts in the `agents/` directory. They run as separate Node.js processes, triggered by system cron or manually. Each agent:

1. Fetches data from public APIs or RSS feeds
2. Optionally summarises with an LLM (Anthropic Claude)
3. Writes an `AgentReport` row to the database
4. Never modifies public content directly

Agents are **research assistants**, not autonomous actors. They surface information; the owner decides what to do with it.

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
├── github-summarizer.ts     ← Weekly GitHub activity
├── robotics-news.ts         ← Weekly RSS digest
├── blog-suggester.ts        ← Monthly content ideas  [TODO: Milestone 4]
├── brand-monitor.ts         ← Brand/mention monitoring [TODO: Milestone 4]
└── opportunity-watcher.ts   ← Job listing monitor    [TODO: Milestone 4]
```

### Agent script structure

Every agent script follows this pattern:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

**Current state:** Data fetching complete. LLM call is a stub — wire `ANTHROPIC_API_KEY` to activate.

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

**Current state:** RSS fetching and basic XML parsing complete. Uses regex — replace with `rss-parser` npm package in Milestone 4 for robustness.

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

## Planned Agents (Milestone 4)

### Blog Topic Suggester

**Purpose:** Monthly content idea generation based on owner's activity.

**Inputs:**
- Existing post titles and tags (from DB)
- Recent GitHub activity (from AgentReport of GitHub Summarizer)
- Recent news digest (from AgentReport of Robotics News Curator)
- Trending topics from Hacker News API (`https://hacker-news.firebaseio.com/v0/topstories.json` — fully public)

**Output:** 5 suggested post titles with 1-line rationale each.

**Schedule:** `0 9 1 * *` (1st of each month)

**Admin UI:** "Content Ideas" card on dashboard — click suggestion → pre-fills new post form.

---

### Personal Brand Monitor

**Purpose:** Find new public web mentions of the owner's name and projects.

**Inputs:** Owner name, GitHub username, project names (from `Agent.config`)
**Data source:** Brave Search API (`search.brave.com/api`) or SerpAPI — both have free tiers
**Output:** List of new URLs mentioning the owner, with title and snippet

**Deduplication:** Hash source URLs and skip ones already in previous reports.

**Schedule:** `0 9 * * 3` (Wednesday 9am — bi-weekly effective)

**Legal note:** Only public search results via official API. No scraping of indexed pages.

---

### Career Opportunity Watcher

**Purpose:** Surface relevant job postings automatically.

**Data source options (no scraping):**
- Adzuna API (`api.adzuna.com`) — free tier, 1000 req/day
- Remotive API (`remotive.com/api/remote-jobs`) — fully public, no auth
- Arbeitnow API (`arbeitnow.com/api/job-board-api`) — free, EU-focused

**Output:** New matching listings with title, company, link, location, and LLM-assessed fit score.

**Schedule:** `0 9 * * 1,4` (Monday and Thursday 9am)

**Important:** Do NOT implement LinkedIn scraping. It violates ToS and can result in IP bans.

---

## Running Agents

### Manual execution
```bash
npx tsx agents/github-summarizer.ts
npx tsx agents/robotics-news.ts
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

### Manual trigger from admin panel (Milestone 4)
The `/admin/agents` page will have a "Run now" button for each agent.
This calls `POST /api/admin/agents/[id]/run` which spawns the script as a child process.

---

## Displaying Reports in Admin

Reports are fetched from the `AgentReport` table and displayed in:
- `/admin/agents` — list of agents with last report summary
- `/admin/agents/reports/[id]` — full report with sources
- `/admin` dashboard — "Agent Insights" widget showing latest unread report per agent

Unread badge: `AgentReport.readAt === null`
Mark as read: `PATCH /api/admin/agents/reports/[id]/read`
