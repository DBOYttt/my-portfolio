import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

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
      const langList = Object.keys(languages).join(", ") || repo.language || "unknown";
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

  // Try direct parse first, then strip markdown fences
  const direct = tryParse(content.text);
  if (direct) return direct;

  const match = content.text.match(/\[[\s\S]*\]/);
  if (match) {
    const fromFences = tryParse(match[0]);
    if (fromFences) return fromFences;
  }

  // LLM failed — fall back to basic entries built from repo metadata
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
}

export async function runGithubProjectImporter(): Promise<AgentRunResult> {
  if (!GITHUB_USERNAME) {
    throw new Error("GITHUB_USERNAME not set in environment");
  }

  const { prisma } = await import("@/lib/prisma");

  const [repos, existingProjects] = await Promise.all([
    fetchRepos(),
    prisma.project.findMany({ select: { githubUrl: true, slug: true } }),
  ]);

  const existingUrls = new Set(
    existingProjects.map((p) => p.githubUrl?.toLowerCase()).filter(Boolean) as string[]
  );
  const existingSlugs = new Set(existingProjects.map((p) => p.slug.toLowerCase()));

  const newRepos = repos.filter((r) => !existingUrls.has(r.html_url.toLowerCase())).slice(0, 5);

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

  // Auto-create project drafts — skip any whose slug conflicts with an existing project
  const created: CreatedProject[] = [];
  for (const s of suggestions) {
    if (existingSlugs.has(s.slug.toLowerCase()) || existingUrls.has(s.githubUrl.toLowerCase())) continue;
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
    created.push({ id: project.id, title: s.title, slug: s.slug, type: s.type, githubUrl: s.githubUrl });
    existingSlugs.add(s.slug.toLowerCase());
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
