# Agent Improvements Catalog

Improvement ideas for every agent in `src/lib/agents/`. Each item is lettered so it can be approved individually. Status column is updated as items are implemented.

Items marked **[BUG]** are correctness fixes, not enhancements — they should be prioritised regardless of which features are approved.

---

## CV Generator (`src/lib/agents/cv-generator.ts`)

| ID | Item | Status |
|----|------|--------|
| CV-A | Portfolio mode (non-job-specific) | ⬜ |
| CV-B | Job-targeting mode — paste JD text | ⬜ |
| CV-C | Job-targeting mode — scrape JD from URL | ⬜ |
| CV-D | Model upgrade: Haiku → Sonnet, max_tokens 1500 → 4096 | ⬜ |
| CV-E | Two variants in one run (robotics-heavy vs software-heavy) | ⬜ |
| CV-F | ATS keyword gap report | ⬜ |

### CV-A — Portfolio mode (non-job-specific)
A separate generation mode that writes a compelling public-facing CV emphasising breadth, side projects, and the candidate's unique robotics + software mix. This is the one that overwrites `public/cv.pdf` and sits behind the "Download CV" button on the public site. It should never be overwritten by a job-targeted run. The LLM prompt is oriented toward impressing a general technical audience rather than passing an ATS for a specific role.

### CV-B — Job-targeting mode (paste JD text)
Add a text area in the `/admin/cv` page: the owner pastes a job description. The agent receives the JD alongside full DB data and rewrites the summary and experience bullet points to match the JD's keywords and priorities. The output is saved as a separate PDF (`public/cv-targeted-[timestamp].pdf`) so it never overwrites the portfolio CV. The report detail shows both the standard and tailored CVs side-by-side.

### CV-C — Job-targeting mode (scrape JD from URL)
Same as CV-B but the owner provides a URL. The backend fetches the page and strips HTML to readable plain text before passing it to the agent. Works for most public JD pages (Greenhouse, Workable, Lever, company career pages). Gracefully falls back to "paste text" if the URL returns a non-200 status or the content appears to be a login wall.

Implementation notes:
- Use `fetch()` with a browser-like User-Agent
- Strip HTML with a regex or a lightweight DOM parser (no headless browser needed)
- Truncate scraped text to ~3000 chars before sending to LLM to stay within token budget
- New API route: `POST /api/admin/cv/scrape-jd` — accepts `{ url: string }`, returns `{ text: string }`

### CV-D — Model upgrade
Switch from `claude-haiku-4-5-20251001` to `claude-sonnet-4-6` and raise `max_tokens` from 1500 to 4096. The CV is the most important output of this whole system — using the weakest model here is a false economy. The extra cost per run (~$0.01) is negligible. Also add `temperature: 0` for more consistent, deterministic output.

### CV-E — Two variants in one run
When running with a JD (CV-B or CV-C), generate two tailored variants in a single LLM call:
1. **Robotics-heavy** — leads with embedded/ROS experience, puts Languages and Concepts at the top of Skills
2. **Software-heavy** — leads with full-stack/backend experience, front-loads Frameworks & Libraries

Both are rendered to separate PDFs. The report detail page shows both previews and links to both downloads.

### CV-F — ATS keyword gap report
After generating a job-targeted CV, produce a two-column table in the report detail:
- **Column 1:** JD keywords that appear in the generated CV (green)
- **Column 2:** JD keywords that are absent from the CV but exist in the owner's DB skills/experience (amber — "could legitimately add")
- Optionally a third column of JD keywords that the owner simply doesn't have (red — for awareness)

This is shown inline in the report detail page, not baked into the PDF.

---

## GitHub Summarizer (`src/lib/agents/github-summarizer.ts`)

| ID | Item | Status |
|----|------|--------|
| GH-A | Actionable audit replacing narrative prose | ⬜ |
| GH-B | Cross-reference repos with portfolio | ⬜ |
| GH-C | Commit activity classification | ⬜ |
| GH-D | Profile consistency check | ⬜ |

### GH-A — Actionable audit
Replace the 2–3 paragraph LLM narrative with a structured report the owner can act on immediately. The LLM role becomes classification and prioritisation, not writing. Output sections:

- **Missing descriptions** — repos with no description field set
- **Missing README** — repos with no README (or a README under 200 bytes)
- **Missing topics/tags** — repos with zero GitHub topics
- **Portfolio gaps** — repos with ≥1 star or recent commits (last 90 days) that are not in the portfolio DB

Each item in these lists is directly actionable. The narrative section can remain as a brief intro paragraph but should not be the main output.

### GH-B — Cross-reference with portfolio
Query `prisma.project.findMany({ select: { githubUrl: true } })` and diff against the full public repo list. Highlight repos that look portfolio-worthy (stars > 0, has README, pushed within 90 days) but haven't been imported. Link each such item to `/admin/projects/new?githubUrl=<url>` for a one-click import shortcut.

### GH-C — Commit activity classification
For each repo, use `pushed_at` to classify:
- **Active** — pushed within 30 days
- **Recent** — pushed 30–90 days ago
- **Dormant** — pushed 90+ days ago

Flag any active projects not currently featured in the portfolio — the owner is building something they're not showing publicly.

### GH-D — Profile consistency check
Compare GitHub profile fields (`bio`, `location`, `blog`) against the DB (`User.name`, `OWNER` object values, `ExternalLink` rows). Report mismatches per field. Example: "GitHub bio is empty — your DB bio is: '…'". This surfaces stale GitHub profiles quickly without manual checking.

---

## Skills Inference (`src/lib/agents/skills-inference.ts`)

| ID | Item | Status |
|----|------|--------|
| SI-A | **[BUG]** Fix category enum mismatch | ⬜ |
| SI-B | Batch apply button for additions | ⬜ |
| SI-C | Job-market relevance tag per suggestion | ⬜ |
| SI-D | Replace N REST calls with single GraphQL query | ⬜ |

### SI-A — Fix category enum mismatch [BUG]
The inference agent returns categories `"LANGUAGE"`, `"FRAMEWORK"`, `"TOOL"`, `"ROBOTICS"`, `"EMBEDDED"`, `"DATABASE"`, `"OTHER"` in its `add` suggestions, but the CV generator's `categoryMap` expects `"LANGUAGES"`, `"FRAMEWORKS"`, `"DATABASES"`, `"TOOLS"`, `"CONCEPTS"`. Skills applied via the inference agent end up in the wrong CV section or get rendered with raw enum names. Fix by normalising the category values before they are inserted into the DB, mapping them to the canonical set used everywhere else.

### SI-B — Batch apply button
Currently each suggested skill must be approved one at a time. Add an "Apply all additions" server action that bulk-inserts all `diff.add` items in a single `prisma.skill.createMany()` call. Keep per-row approval for upgrades and stale suggestions (those are higher risk). The batch button should be clearly labelled with the count of items it will apply.

### SI-C — Job-market relevance tag
For each `add` suggestion, cross-reference against the current Remotive job listing set (already fetched by Opportunity Watcher). Show how many active remote listings mention that skill name. Helps the owner prioritise which skills to add to their public profile first. Can be implemented as a lightweight keyword search against the cached Remotive response rather than a new API call.

### SI-D — Replace N REST calls with single GraphQL query
Currently fetches language bytes for each repo with a separate REST call (`/repos/{user}/{repo}/languages`). With 30 repos, this is 30 API calls. Replace with a single GitHub GraphQL query that fetches `primaryLanguage` and `languages { nodes }` for all repos in one request. Eliminates rate-limit risk when running without a token.

---

## Opportunity Watcher (`src/lib/agents/opportunity-watcher.ts`)

| ID | Item | Status |
|----|------|--------|
| OW-A | Configurable keywords stored in DB/admin | ⬜ |
| OW-B | Multi-source aggregation | ⬜ |
| OW-C | Deduplication across runs | ⬜ |
| OW-D | Per-job match score | ⬜ |
| OW-E | Email alert for high-match jobs | ⬜ |

### OW-A — Configurable keywords
Move `KEYWORDS` from a hardcoded array in source to a JSON field on the Agent DB row (`config Json?` column — may need schema addition). Add a small editor in the agent detail page: comma-separated keyword list, save button. Default value seeded from the current hardcoded list on first run. No code deploy required to change targeting.

### OW-B — Multi-source aggregation
Add additional job sources alongside Remotive:
- **We Work Remotely** — public RSS feed (`https://weworkremotely.com/categories/remote-programming-jobs.rss`), no key needed
- **HackerNews "Who's Hiring"** — monthly thread, indexed by Algolia (`https://hn.algolia.com/api/v1/search?query=who+is+hiring&tags=ask_hn&hitsPerPage=1` to find the latest thread, then search it for keywords)
- **Stack Overflow Jobs RSS** (if still active) — `https://stackoverflow.com/jobs/feed?r=true&tags=robotics`

Each source is fetched independently; failures are swallowed silently and noted in the report.

### OW-C — Deduplication across runs
Add a `seenUrls` JSON field to the Agent row (or a separate `SeenOpportunity` table with `(agentId, url, seenAt)`). Each run:
1. Loads previously seen URLs
2. Filters them out of the current fetch results
3. Reports only new jobs
4. Appends new URLs to the seen set after reporting

Report header: "X new jobs this run (Y total matching, Z already seen)."

### OW-D — Per-job match score
After fetching and deduplicating, pass the job list to the LLM with the owner's current skills and experience summary. Ask the LLM to score each job 1–10 for fit and provide one-sentence rationale. Report renders jobs sorted by score descending. Top 3 get a highlighted "strong match" badge in the report detail view.

### OW-E — Email alert for high-match jobs
If any job scores ≥ 8/10 (configurable via `OPPORTUNITY_ALERT_THRESHOLD` env var, default 8), send a Resend email to the owner address (`ADMIN_EMAIL`) after saving the report. Email contains job title, company, URL, and match rationale. Guarded by `OPPORTUNITY_ALERT_EMAIL=true` env var (opt-in, default off).

---

## Brand Monitor (`src/lib/agents/brand-monitor.ts`)

| ID | Item | Status |
|----|------|--------|
| BM-A | Google Alerts RSS implementation | ⬜ |
| BM-B | GitHub star/fork delta tracking | ⬜ |
| BM-C | Dev.to mention detection | ⬜ |

### BM-A — Google Alerts RSS
Google Alerts allows setting up keyword alerts (your name, GitHub username, notable project names) and subscribing to the results as an RSS feed. Zero cost, no API key — just a URL. Implementation:
1. Owner sets up alerts at `google.com/alerts` and copies the RSS feed URLs
2. URLs stored in `.env` as `GOOGLE_ALERTS_RSS_1`, `GOOGLE_ALERTS_RSS_2`, etc. (or as a comma-separated `GOOGLE_ALERTS_RSS_FEEDS`)
3. Agent fetches and parses each feed using the same RSS parser pattern as `robotics-news.ts`
4. Deduplicates against previous run (store seen GUIDs on the Agent row)
5. Passes new mentions to LLM for sentiment classification (positive/neutral/negative) if `ANTHROPIC_API_KEY` is set

### BM-B — GitHub star/fork delta tracking
Use the GitHub API to fetch `stargazers_count` and `forks_count` for all public repos. Compare against the snapshot stored in the previous report's `rawData`. Report the delta per repo: "+3 stars on `portfolio-site`", "+1 fork on `ros-nav-stack`". Pure signal with zero external dependency beyond `GITHUB_USERNAME`.

### BM-C — Dev.to mention detection
Dev.to exposes a public API at `https://dev.to/api/articles?tag=<tag>` and a search endpoint. Search for the owner's GitHub username and full name in article content and comments. No API key required. Surface any articles that reference the owner's work. Combine with BM-B to give a "people are noticing your work" signal.

---

## Blog Suggester (`src/lib/agents/blog-suggester.ts`)

| ID | Item | Status |
|----|------|--------|
| BS-A | HackerNews trending topics feed | ⬜ |
| BS-B | Dev.to trending cross-reference | ⬜ |
| BS-C | Content series suggestion | ⬜ |
| BS-D | Draft outline generation integration | ⬜ |

### BS-A — HackerNews trending topics
The HackerNews Algolia API is free and public. Fetch top stories from the last 7 days (`https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>X&hitsPerPage=50`) and filter for tags/titles matching the owner's topic areas (robotics, embedded, Rust, TypeScript, etc.). Feed trending story titles alongside existing post titles to the LLM. Suggestions become timely rather than generic.

### BS-B — Dev.to trending
`https://dev.to/api/articles?top=7` returns the top articles of the past 7 days with full tag lists and view counts. Filter by tags that overlap with the owner's existing post tags. Pass the top-10 titles to the LLM alongside existing posts. Weight suggestions toward topics that are trending on dev.to but absent from the owner's blog.

### BS-C — Content series suggestion
Extend the suggestion schema: alongside standalone post ideas, the LLM may return a `series` field — an array of 2–4 related posts that form a sequence. The admin report detail renders series as a connected group with sequence numbers and a "Create all as drafts" button. A series drives better SEO (internal links) and return visits compared to standalone posts.

### BS-D — Draft outline generation integration
When the owner clicks a suggestion in the `AgentSuggestPanel` inside `PostForm.tsx`, instead of immediately generating the full post body, generate a structured outline first: H2 section headings with one-sentence descriptions. The outline renders as a preview card; the owner can edit section titles before triggering full content generation. This reduces wasted generation when the initial direction is wrong.

---

## Robotics News (`src/lib/agents/robotics-news.ts`)

| ID | Item | Status |
|----|------|--------|
| RN-A | LLM digest with relevance filter | ⬜ |
| RN-B | Configurable feed list | ⬜ |
| RN-C | Deduplication across runs | ⬜ |

### RN-A — LLM digest with relevance filter
Currently dumps up to 15 raw links with no curation. Add LLM summarisation (same pattern as Opportunity Watcher): pick the 5 most relevant items to a robotics engineer/job-seeker and write a one-sentence "why this matters" for each. The raw link list is still included for completeness but the digest is the primary output.

### RN-B — Configurable feed list
RSS URLs are hardcoded. Move to `ROBOTICS_RSS_FEEDS` env var (comma-separated URLs) with the current feeds as the default. Lets the owner add/remove feeds without a code deploy. Suggested additions to document in `.env.example`: ROS Discourse (`https://discourse.ros.org/latest.rss`), Embedded.fm podcast feed, r/robotics RSS (`https://www.reddit.com/r/robotics/.rss`).

### RN-C — Deduplication across runs
Same problem as Opportunity Watcher — same articles appear every run. Store seen item URLs in the Agent row's `rawData` or a dedicated field. Only surface new items since the last run. Report header shows "X new articles this week".

---

## GitHub Project Importer (`src/lib/agents/github-project-importer.ts`)

| ID | Item | Status |
|----|------|--------|
| GPI-A | Re-sync existing projects | ⬜ |
| GPI-B | README quality scoring | ⬜ |
| GPI-C | Configurable import batch size | ⬜ |

### GPI-A — Re-sync existing projects
Currently skips any repo already in the DB by `githubUrl`. Add a `--sync` mode that re-fetches description, topics, language bytes, and the first 500 bytes of README for repos already imported. The LLM produces a suggested update diff: new summary, updated techTags, updated type classification. Owner reviews diffs in the report detail page and applies per-field. Nothing is auto-applied.

### GPI-B — README quality scoring
Before importing a repo, score its README on a 0–5 scale:
- +1 if it has a title (H1)
- +1 if it has a description paragraph (>100 chars)
- +1 if it has an installation or usage section
- +1 if it has code blocks
- +1 if it has links (badges, screenshots, demo)

Show the score in the import report alongside each created draft. Add a note for repos scoring 0–2: "README is thin — consider improving it before featuring this project." Do not block the import, just inform.

### GPI-C — Configurable import batch size
Currently hard-capped at 5 new repos per run (`newRepos.slice(0, 5)`). Move this to a `GITHUB_IMPORT_BATCH` env var (default 5, range 1–20). Document in `.env.example`. Lets users with many new repos on first setup import more without code changes.

---

## Platform Sync (`src/lib/agents/platform-sync.ts`)

| ID | Item | Status |
|----|------|--------|
| PS-A | LinkedIn CSV cross-reference | ⬜ |
| PS-B | Cross-platform consistency report | ⬜ |
| PS-C | Make Twitter/X optional, not a hard dependency | ⬜ |

### PS-A — LinkedIn CV import cross-reference
The LinkedIn CSV import route (`POST /api/admin/linkedin/import`) already parses `Positions.csv`. Platform Sync should query the DB for experience rows and compare against the last-imported LinkedIn positions. Report: experience entries in LinkedIn but not in the portfolio DB, and vice versa. This surfaces gaps without requiring the owner to manually reconcile two lists.

### PS-B — Cross-platform consistency report
Compare the following across sources:
- **Name:** GitHub display name vs `User.name` in DB
- **Bio/headline:** GitHub bio vs DB bio / OWNER object
- **Website URL:** GitHub `blog` field vs `ExternalLink` rows of type `OTHER`
- **Location:** GitHub `location` vs any location stored in DB

Report mismatches in a simple table: field, GitHub value, DB value, status (match/mismatch/missing). One actionable table is more useful than a paragraph describing the same information.

### PS-C — Make Twitter/X optional
The Twitter API v2 now requires a paid developer account and the bearer token frequently breaks. Remove `twitter-profile.ts` as a hard dependency of Platform Sync. Make the Twitter fetch conditional on `TWITTER_BEARER_TOKEN` being set (already partially the case) and ensure the agent succeeds and produces a useful report even when Twitter returns a non-200 response. Refocus the default Platform Sync report on GitHub profile enrichment, which is free and reliable.
