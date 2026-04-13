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

async function fetchRepoLanguages(repoName: string): Promise<Record<string, number>> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`,
    { headers: makeHeaders() }
  );
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, number>>;
}

async function buildSkillsDiff(
  repoLanguages: Record<string, number>,
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

  const prompt = `You are analyzing a developer's portfolio to suggest skill updates.

Technologies detected in their GitHub repos (language: bytes of code):
${repoLangText || "none"}

Technologies in their projects: ${techTags.length > 0 ? techTags.join(", ") : "none"}
Technologies in their blog posts: ${postTags.length > 0 ? postTags.join(", ") : "none"}

Their existing skills: ${existingSkillsText || "none"}

Produce a JSON diff of suggested changes. Return ONLY valid JSON, no explanation:
{
  "add": [{"name":"...","category":"LANGUAGE|FRAMEWORK|TOOL|ROBOTICS|EMBEDDED|DATABASE|OTHER","level":"FAMILIAR|PROFICIENT|EXPERT","evidence":"..."}],
  "upgrade": [{"name":"...","currentLevel":"...","suggestedLevel":"...","evidence":"..."}],
  "stale": [{"name":"...","reason":"..."}]
}

Rules:
- Only add skills with strong evidence (significant code bytes or repeated use)
- Don't add skills already in existing list (exact name match, case-insensitive)
- Only suggest upgrades if evidence clearly supports higher level
- Stale = skills that appear nowhere in the evidence
- Return at most 10 additions, 5 upgrades, 5 stale`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  if (content.type !== "text") return { add: [], upgrade: [], stale: [] };

  try {
    const parsed = JSON.parse(content.text) as SkillsDiff;
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
  const topRepos = repos.slice(0, 15);

  // Aggregate language bytes across top repos
  const aggregatedLanguages: Record<string, number> = {};
  for (const repo of topRepos) {
    const langs = await fetchRepoLanguages(repo.name);
    for (const [lang, bytes] of Object.entries(langs)) {
      aggregatedLanguages[lang] = (aggregatedLanguages[lang] ?? 0) + bytes;
    }
  }

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
      add: diff.add,
      upgrade: diff.upgrade,
      stale: diff.stale,
    },
  };
}
