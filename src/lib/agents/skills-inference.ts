import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

interface GitHubRepo {
  name: string;
  description: string | null;
  html_url: string;
  updated_at: string;
  topics?: string[];
}

interface SkillAddSuggestion {
  name: string;
  category: "LANGUAGE" | "FRAMEWORK" | "TOOL" | "ROBOTICS" | "EMBEDDED" | "DATABASE" | "OTHER";
  level: "FAMILIAR" | "PROFICIENT" | "EXPERT";
  evidence: string;
}

interface SkillUpgradeSuggestion {
  name: string;
  currentLevel: string;
  suggestedLevel: string;
  evidence: string;
}

interface SkillStaleSuggestion {
  name: string;
  reason: string;
}

interface SkillsDiff {
  add: SkillAddSuggestion[];
  upgrade: SkillUpgradeSuggestion[];
  stale: SkillStaleSuggestion[];
}

interface GraphQLRepoNode {
  name: string;
  primaryLanguage: { name: string } | null;
  languages: {
    edges: Array<{ size: number; node: { name: string } }>;
  };
}

interface GraphQLResponse {
  data?: {
    user?: {
      repositories: {
        nodes: GraphQLRepoNode[];
      };
    };
  };
  errors?: Array<{ message: string }>;
}

export function normaliseCategoryEnum(raw: string): string {
  const map: Record<string, string> = {
    LANGUAGE: "LANGUAGES",
    FRAMEWORK: "FRAMEWORKS",
    DATABASE: "DATABASES",
    TOOL: "TOOLS",
    ROBOTICS: "CONCEPTS",
    EMBEDDED: "CONCEPTS",
    OTHER: "TOOLS",
  };
  return map[raw] ?? "TOOLS";
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

async function fetchLanguagesViaGraphQL(first: number): Promise<Record<string, number>> {
  if (!GITHUB_TOKEN) {
    throw new Error("No GITHUB_TOKEN for GraphQL");
  }
  const query = `
    query($login: String!, $first: Int!) {
      user(login: $login) {
        repositories(first: $first, ownerAffiliations: OWNER, privacy: PUBLIC) {
          nodes {
            name
            primaryLanguage { name }
            languages(first: 10) {
              edges { size node { name } }
            }
          }
        }
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "portfolio-agent/1.0",
      Authorization: `bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query, variables: { login: GITHUB_USERNAME, first } }),
  });
  if (!res.ok) {
    throw new Error(`GitHub GraphQL error: ${res.status}`);
  }
  const json = (await res.json()) as GraphQLResponse;
  if (json.errors && json.errors.length > 0) {
    throw new Error(`GitHub GraphQL errors: ${json.errors.map((e) => e.message).join(", ")}`);
  }
  const nodes = json.data?.user?.repositories?.nodes ?? [];
  const aggregated: Record<string, number> = {};
  for (const node of nodes) {
    for (const edge of node.languages.edges) {
      const langName = edge.node.name;
      aggregated[langName] = (aggregated[langName] ?? 0) + edge.size;
    }
  }
  return aggregated;
}

async function fetchRepoLanguagesRest(repoName: string): Promise<Record<string, number>> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
    { headers: makeHeaders() }
  );
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, number>>;
}

async function buildSkillsDiff(
  repoLanguages: Record<string, number>,
  repoTopics: string[],
  techTags: string[],
  postTags: string[],
  existingSkills: Array<{ name: string; category: string; level: string | null }>
): Promise<SkillsDiff> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { add: [], upgrade: [], stale: [] };
  }

  const repoLangText = Object.entries(repoLanguages)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, bytes]) => `${lang}: ${bytes.toLocaleString()} bytes`)
    .join(", ");

  const existingSkillsText = existingSkills
    .map((s) => `${s.name} (${s.category}, ${s.level ?? "no level"})`)
    .join(", ");

  const topicsText = repoTopics.length > 0 ? repoTopics.join(", ") : "none";

  const prompt = `You are analyzing a developer's GitHub profile to build a complete, accurate skills list for their portfolio.

Technologies detected in their GitHub repos (language: bytes of code):
${repoLangText || "none"}

Repo topics/tags: ${topicsText}
Technologies in their projects: ${techTags.length > 0 ? techTags.join(", ") : "none"}
Technologies in their blog posts: ${postTags.length > 0 ? postTags.join(", ") : "none"}

Their existing skills already in portfolio: ${existingSkillsText || "none (portfolio is empty — infer ALL skills from the evidence above)"}

Your goal: produce a COMPLETE diff so the portfolio reflects everything visible in their GitHub. Return ONLY valid JSON, no markdown, no explanation:
{
  "add": [{"name":"...","category":"LANGUAGE|FRAMEWORK|TOOL|ROBOTICS|EMBEDDED|DATABASE|OTHER","level":"FAMILIAR|PROFICIENT|EXPERT","evidence":"..."}],
  "upgrade": [{"name":"...","currentLevel":"...","suggestedLevel":"...","evidence":"..."}],
  "stale": [{"name":"...","reason":"..."}]
}

Rules:
- Add EVERY technology visible in the evidence (languages, frameworks, tools, topics) — do not skip any
- If existing skills list is empty, treat all detected technologies as additions
- Don't add skills already in the existing list (exact name match, case-insensitive)
- Level guide: FAMILIAR = any presence, PROFICIENT = significant bytes or repeated use, EXPERT = dominant language across many repos
- Infer frameworks from topics/tags (e.g. topic "react" → add React as FRAMEWORK)
- Only suggest upgrades if evidence clearly supports a higher level
- Stale = skills that appear nowhere in the evidence
- There is no cap on the number of suggestions — return all of them`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  if (content.type !== "text") return { add: [], upgrade: [], stale: [] };

  try {
    const jsonText = content.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonText) as SkillsDiff;
    return {
      add: Array.isArray(parsed.add) ? parsed.add : [],
      upgrade: Array.isArray(parsed.upgrade) ? parsed.upgrade : [],
      stale: Array.isArray(parsed.stale) ? parsed.stale : [],
    };
  } catch {
    return { add: [], upgrade: [], stale: [] };
  }
}

export async function runSkillsInference(): Promise<AgentRunResult> {
  if (!GITHUB_USERNAME) {
    throw new Error("GITHUB_USERNAME not set in environment");
  }

  const { prisma } = await import("@/lib/prisma");

  const repos = await fetchRepos();
  const topRepos = repos.slice(0, 30);

  // SI-D: Try GraphQL first (single request for all language data), fall back to REST per-repo
  let aggregatedLanguages: Record<string, number>;
  try {
    aggregatedLanguages = await fetchLanguagesViaGraphQL(30);
  } catch {
    aggregatedLanguages = {};
    for (const repo of topRepos) {
      const langs = await fetchRepoLanguagesRest(repo.name);
      for (const [lang, bytes] of Object.entries(langs)) {
        aggregatedLanguages[lang] = (aggregatedLanguages[lang] ?? 0) + bytes;
      }
    }
  }

  const allTopics: string[] = [];
  for (const repo of topRepos) {
    if (repo.topics) allTopics.push(...repo.topics);
  }
  const uniqueTopics = [...new Set(allTopics)];

  // Read DB data
  const [existingSkills, projects, tags] = await Promise.all([
    prisma.skill.findMany(),
    prisma.project.findMany({ select: { techTags: true } }),
    prisma.tag.findMany(),
  ]);

  const techTags = [...new Set(projects.flatMap((p) => p.techTags))];
  const postTags = tags.map((t) => t.name);

  const diff = await buildSkillsDiff(
    aggregatedLanguages,
    uniqueTopics,
    techTags,
    postTags,
    existingSkills.map((s) => ({ name: s.name, category: s.category, level: s.level }))
  );

  const addCount = diff.add.length;
  const upgradeCount = diff.upgrade.length;
  const staleCount = diff.stale.length;

  const summaryLines = [
    "## Skills Analysis",
    "",
    `Found **${addCount}** skill${addCount !== 1 ? "s" : ""} to add, **${upgradeCount}** upgrade${upgradeCount !== 1 ? "s" : ""} suggested, and **${staleCount}** possibly stale.`,
    "",
  ];

  if (addCount > 0) {
    summaryLines.push("### Suggested Additions");
    for (const s of diff.add) {
      summaryLines.push(`- **${s.name}** (${s.category}, ${s.level}) — ${s.evidence}`);
    }
    summaryLines.push("");
  }

  if (upgradeCount > 0) {
    summaryLines.push("### Suggested Upgrades");
    for (const s of diff.upgrade) {
      summaryLines.push(
        `- **${s.name}**: ${s.currentLevel} → ${s.suggestedLevel} — ${s.evidence}`
      );
    }
    summaryLines.push("");
  }

  if (staleCount > 0) {
    summaryLines.push("### Possibly Stale");
    for (const s of diff.stale) {
      summaryLines.push(`- **${s.name}** — ${s.reason}`);
    }
  }

  const sources = topRepos.slice(0, 5).map((r) => r.html_url);
  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return {
    title: `Skills Analysis — ${monthYear}`,
    summary: summaryLines.join("\n"),
    sources,
    rawData: {
      type: "SKILLS_DIFF",
      add: diff.add.map((s) => ({ ...s, category: normaliseCategoryEnum(s.category) })),
      upgrade: diff.upgrade,
      stale: diff.stale,
    },
  };
}
