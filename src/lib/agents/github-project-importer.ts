import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

// GPI-C: Configurable batch size — env var, default 5, clamp to 1-20
function getBatchSize(): number {
  const raw = parseInt(process.env.GITHUB_IMPORT_BATCH ?? "5", 10);
  if (isNaN(raw)) return 5;
  return Math.min(20, Math.max(1, raw));
}

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  topics: string[];
  updated_at: string;
}

interface GitHubReadme {
  content: string;
  encoding: string;
}

interface ProjectSuggestion {
  title: string;
  slug: string;
  summary: string;
  content: string;
  type: "SOFTWARE" | "ROBOTICS" | "HARDWARE" | "RESEARCH";
  techTags: string[];
  githubUrl: string;
}

export interface ProjectSyncUpdate {
  slug: string;
  field: "summary" | "techTags" | "type";
  currentValue: string;
  suggestedValue: string;
  reason: string;
}

export interface ProjectSyncDiffRawData {
  type: "PROJECT_SYNC_DIFF";
  updates: ProjectSyncUpdate[];
}

// GPI-B: README quality scoring
export interface ReadmeScore {
  score: number;
  note: string | null;
}

function scoreReadme(readme: string): ReadmeScore {
  if (!readme) return { score: 0, note: "README is thin — consider improving before featuring." };

  let score = 0;
  if (/^# /m.test(readme)) score++;
  const descMatch = readme.match(/^[^#\n].{100,}/m);
  if (descMatch) score++;
  if (/install|usage/i.test(readme)) score++;
  if (/```/.test(readme)) score++;
  if (/http/.test(readme)) score++;

  const note = score <= 2 ? "README is thin — consider improving before featuring." : null;
  return { score, note };
}

function makeHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "portfolio-agent/1.0",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

async function fetchRepos(): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30&type=public`,
    { headers: makeHeaders() }
  );
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<GitHubRepo[]>;
}

async function fetchReadme(repoName: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      { headers: makeHeaders() }
    );
    if (!res.ok) return "";
    const data = (await res.json()) as GitHubReadme;
    if (data.encoding !== "base64") return "";
    return Buffer.from(data.content, "base64").toString("utf-8").slice(0, 2000);
  } catch {
    return "";
  }
}

async function fetchLanguages(repoName: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
      { headers: makeHeaders() }
    );
    if (!res.ok) return {};
    return res.json() as Promise<Record<string, number>>;
  } catch {
    return {};
  }
}

function inferTypeFromRepo(repo: GitHubRepo): "SOFTWARE" | "ROBOTICS" | "HARDWARE" | "RESEARCH" {
  const haystack = [
    repo.name,
    repo.description ?? "",
    ...(repo.topics ?? []),
  ]
    .join(" ")
    .toLowerCase();

  if (/ros|robot|slam|lidar|navigation/.test(haystack)) return "ROBOTICS";
  if (/arduino|stm32|embedded|firmware|pcb/.test(haystack)) return "HARDWARE";
  if (/thesis|paper|dataset|analysis/.test(haystack)) return "RESEARCH";
  return "SOFTWARE";
}

function formatRepoName(name: string): string {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface RepoData {
  repo: GitHubRepo;
  readme: string;
  languages: Record<string, number>;
}

async function suggestWithLLM(repoDataList: RepoData[]): Promise<ProjectSuggestion[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return repoDataList.map(({ repo }) => ({
      title: formatRepoName(repo.name),
      slug: toSlug(repo.name),
      summary: repo.description ?? `A ${inferTypeFromRepo(repo).toLowerCase()} project.`,
      content: `## ${formatRepoName(repo.name)}\n\n${repo.description ?? "No description available."}\n\nThis project was imported from GitHub.`,
      type: inferTypeFromRepo(repo),
      techTags: repo.language ? [repo.language] : [],
      githubUrl: repo.html_url,
    }));
  }

  const repoDescriptions = repoDataList
    .map(({ repo, readme, languages }) => {
      const langBytes = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .map(([l, b]) => `${l}:${b}`)
        .join(", ");
      const topics = (repo.topics ?? []).join(", ");
      return [
        `Repository: ${repo.name}`,
        `Description: ${repo.description ?? "none"}`,
        `Primary language: ${repo.language ?? "unknown"}`,
        `Languages (bytes): ${langBytes || "none"}`,
        `Topics: ${topics || "none"}`,
        `README excerpt: ${readme ? readme.slice(0, 500) : "none"}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  const prompt = `You are helping a developer build their portfolio. For each GitHub repository below, suggest a portfolio project entry.
Return ONLY a JSON array, no explanation or markdown:
[{"title":"...","slug":"...","summary":"One sentence description.","content":"2-3 paragraphs of markdown describing the project, its technical challenges, and outcomes.","type":"SOFTWARE|ROBOTICS|HARDWARE|RESEARCH","techTags":["TypeScript","React"],"githubUrl":"https://github.com/..."}]

Repository data:
${repoDescriptions}

Rules for type:
- ROBOTICS if repo has ros, robot, slam, lidar, navigation in name/description/topics
- HARDWARE if has arduino, stm32, embedded, firmware, pcb
- RESEARCH if has thesis, paper, dataset, analysis
- SOFTWARE otherwise
- slug must be URL-safe lowercase with hyphens, unique (use repo name as base)`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  if (content.type !== "text") return [];

  const tryParse = (text: string): ProjectSuggestion[] | null => {
    try {
      const parsed = JSON.parse(text) as ProjectSuggestion[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(content.text);
  if (direct) return direct;

  const match = content.text.match(/\[[\s\S]*\]/);
  if (match) {
    const fromFences = tryParse(match[0]);
    if (fromFences) return fromFences;
  }

  return repoDataList.map(({ repo }) => ({
    title: formatRepoName(repo.name),
    slug: toSlug(repo.name),
    summary: repo.description ?? `A ${inferTypeFromRepo(repo).toLowerCase()} project built in ${repo.language ?? "multiple languages"}.`,
    content: `## ${formatRepoName(repo.name)}\n\n${repo.description ?? "No description available."}\n\nThis project was imported from GitHub.`,
    type: inferTypeFromRepo(repo),
    techTags: repo.language ? [repo.language] : [],
    githubUrl: repo.html_url,
  }));
}

interface CreatedProject {
  id: string;
  title: string;
  slug: string;
  type: string;
  githubUrl: string;
  readmeScore: number;
  readmeNote: string | null;
}

// GPI-A: Re-sync existing projects
async function runSyncMode(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const [repos, existingProjects] = await Promise.all([
    fetchRepos(),
    prisma.project.findMany({
      select: { slug: true, githubUrl: true, summary: true, techTags: true, type: true },
    }),
  ]);

  const urlToProject = new Map(
    existingProjects
      .filter((p) => p.githubUrl)
      .map((p) => [p.githubUrl!.toLowerCase(), p])
  );

  // Find repos already in DB
  const reposToSync = repos.filter((r) => urlToProject.has(r.html_url.toLowerCase()));
  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  if (reposToSync.length === 0) {
    return {
      title: `GitHub Project Sync — ${monthYear}`,
      summary: "## GitHub Project Sync\n\nNo matching repositories found in the DB to sync.",
      sources: [],
      rawData: { type: "PROJECT_SYNC_DIFF", updates: [] } satisfies ProjectSyncDiffRawData,
    };
  }

  // Fetch fresh data for each matched repo
  const syncData = await Promise.all(
    reposToSync.slice(0, 10).map(async (repo) => {
      const [readme, languages] = await Promise.all([
        fetchReadme(repo.name),
        fetchLanguages(repo.name),
      ]);
      return {
        repo,
        readme: readme.slice(0, 500),
        languages,
        dbEntry: urlToProject.get(repo.html_url.toLowerCase())!,
      };
    })
  );

  let updates: ProjectSyncUpdate[] = [];

  if (apiKey) {
    const repoList = syncData
      .map(({ repo, readme, languages, dbEntry }) => {
        const langList = Object.keys(languages).join(", ") || repo.language || "unknown";
        const topics = (repo.topics ?? []).join(", ");
        return [
          `Repo: ${repo.name} (slug: ${dbEntry.slug})`,
          `Current DB summary: ${dbEntry.summary}`,
          `Current DB type: ${dbEntry.type}`,
          `Current DB techTags: ${(dbEntry.techTags ?? []).join(", ")}`,
          `Fresh GitHub description: ${repo.description ?? "none"}`,
          `Fresh languages: ${langList}`,
          `Fresh topics: ${topics || "none"}`,
          `Fresh README excerpt: ${readme || "none"}`,
        ].join("\n");
      })
      .join("\n\n---\n\n");

    const prompt = `You are reviewing portfolio project entries against fresh GitHub data.
For each entry below, suggest updates as a diff. Return ONLY a JSON object, no markdown:
{"updates":[{"slug":"...","field":"summary|techTags|type","currentValue":"...","suggestedValue":"...","reason":"..."}]}

Only suggest changes when the fresh GitHub data meaningfully contradicts or improves the current DB value.
If the current value is fine, omit that field from updates.
For techTags, suggestedValue must be a JSON array string like ["TypeScript","React"].

Entries:
${repoList}`;

    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const content = msg.content[0];
      if (content.type === "text") {
        const tryParse = (text: string): ProjectSyncUpdate[] | null => {
          try {
            const parsed = JSON.parse(text) as { updates?: ProjectSyncUpdate[] };
            return Array.isArray(parsed.updates) ? parsed.updates : null;
          } catch {
            return null;
          }
        };

        const direct = tryParse(content.text);
        if (direct) {
          updates = direct;
        } else {
          const match = content.text.match(/\{[\s\S]*\}/);
          if (match) {
            const fromFences = tryParse(match[0]);
            if (fromFences) updates = fromFences;
          }
        }
      }
    } catch {
      // LLM failed — return empty updates
    }
  }

  const summary = [
    "## GitHub Project Sync",
    "",
    `Scanned **${syncData.length}** existing portfolio project${syncData.length !== 1 ? "s" : ""} against fresh GitHub data.`,
    updates.length > 0
      ? `\n**${updates.length} suggested update${updates.length !== 1 ? "s" : ""}** — review and apply below.`
      : "\nAll portfolio entries appear up-to-date.",
  ].join("\n");

  return {
    title: `GitHub Project Sync — ${monthYear}`,
    summary,
    sources: reposToSync.map((r) => r.html_url),
    rawData: { type: "PROJECT_SYNC_DIFF", updates } satisfies ProjectSyncDiffRawData,
  };
}

export async function runGithubProjectImporter(syncMode = false): Promise<AgentRunResult> {
  if (!GITHUB_USERNAME) {
    throw new Error("GITHUB_USERNAME not set in environment");
  }

  if (syncMode) {
    return runSyncMode();
  }

  const batchSize = getBatchSize();
  const { prisma } = await import("@/lib/prisma");

  const [repos, existingProjects] = await Promise.all([
    fetchRepos(),
    prisma.project.findMany({ select: { githubUrl: true, slug: true } }),
  ]);

  const existingUrls = new Set(
    existingProjects.map((p) => p.githubUrl?.toLowerCase()).filter(Boolean) as string[]
  );
  const existingSlugs = new Set(existingProjects.map((p) => p.slug.toLowerCase()));

  // GPI-C: use configurable batch size
  const newRepos = repos.filter((r) => !existingUrls.has(r.html_url.toLowerCase())).slice(0, batchSize);

  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  if (newRepos.length === 0) {
    return {
      title: `GitHub Project Import — ${monthYear}`,
      summary: `## GitHub Project Import\n\nAll ${repos.length} public repositories are already in the portfolio.`,
      sources: [],
      rawData: {
        type: "PROJECT_CREATED",
        created: [],
        skipped: existingProjects.length,
      },
    };
  }

  // Fetch README + languages in parallel
  const repoDataList: RepoData[] = await Promise.all(
    newRepos.map(async (repo) => {
      const [readme, languages] = await Promise.all([
        fetchReadme(repo.name),
        fetchLanguages(repo.name),
      ]);
      return { repo, readme, languages };
    })
  );

  const suggestions = await suggestWithLLM(repoDataList);

  // Always overwrite githubUrl with the authoritative URL from the GitHub API — never trust LLM
  for (let i = 0; i < suggestions.length; i++) {
    const authoritative = repoDataList[i]?.repo.html_url;
    if (authoritative) suggestions[i].githubUrl = authoritative;
  }

  // Auto-create project drafts — skip any whose slug conflicts with an existing project
  const created: CreatedProject[] = [];
  for (let si = 0; si < suggestions.length; si++) {
    const s = suggestions[si];
    if (!s.slug?.trim() || !s.title?.trim()) continue;
    if (existingSlugs.has(s.slug.toLowerCase()) || existingUrls.has(s.githubUrl.toLowerCase())) continue;

    // GPI-B: score the README for this repo using the matching repoData by index
    const repoData = repoDataList[si];
    const { score: readmeScore, note: readmeNote } = scoreReadme(repoData?.readme ?? "");

    try {
      const project = await prisma.project.create({
        data: {
          title: s.title,
          slug: s.slug,
          summary: s.summary,
          content: s.content,
          type: s.type,
          techTags: s.techTags,
          githubUrl: s.githubUrl,
          featured: false,
          order: 0,
          publishedAt: null,
        },
      });
      created.push({
        id: project.id,
        title: s.title,
        slug: s.slug,
        type: s.type,
        githubUrl: s.githubUrl,
        readmeScore,
        readmeNote,
      });
      existingSlugs.add(s.slug.toLowerCase());
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code !== "P2002") throw e;
      // slug or URL collision — skip silently
    }
  }

  const summary = [
    "## GitHub Project Import",
    "",
    `Scanned **${newRepos.length}** new repositor${newRepos.length !== 1 ? "ies" : "y"} and automatically created **${created.length}** project draft${created.length !== 1 ? "s" : ""}.`,
    "",
    created.map((p) => `- **${p.title}** (${p.type})`).join("\n"),
  ].join("\n");

  return {
    title: `GitHub Project Import — ${monthYear}`,
    summary,
    sources: newRepos.map((r) => r.html_url),
    rawData: {
      type: "PROJECT_CREATED",
      created,
      skipped: existingProjects.length,
    },
  };
}
