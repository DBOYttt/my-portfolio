import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";
import { prisma } from "@/lib/prisma";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

// ─── GitHub API types ─────────────────────────────────────────────────────────

interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  updated_at: string;
  pushed_at: string;
  topics: string[];
  has_readme?: boolean;
}

interface GitHubProfileData {
  bio: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
}

// ─── Output types ─────────────────────────────────────────────────────────────

export type ActivityLevel = "active" | "recent" | "dormant";

export interface PortfolioGapItem {
  repo: string;
  url: string;
  stars: number;
  pushedAt: string;
  activity: ActivityLevel;
  importUrl: string;
}

export interface RepoRef {
  repo: string;
  url: string;
}

export interface ProfileField {
  field: string;
  githubValue: string | null;
  dbValue: string | null;
  status: "match" | "mismatch" | "missing";
}

export interface GitHubAuditRawData {
  type: "GITHUB_AUDIT";
  missingDescriptions: RepoRef[];
  missingReadmes: RepoRef[];
  missingTopics: RepoRef[];
  portfolioGaps: PortfolioGapItem[];
  profile: {
    bio: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    followers: number;
  };
  profileConsistency: ProfileField[];
  summary: string;
  repoCount: number;
  activitySummary: { active: number; recent: number; dormant: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGitHubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "portfolio-agent/1.0",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

function classifyActivity(pushedAt: string): ActivityLevel {
  const now = Date.now();
  const pushed = new Date(pushedAt).getTime();
  const days = (now - pushed) / (1000 * 60 * 60 * 24);
  if (days <= 30) return "active";
  if (days <= 90) return "recent";
  return "dormant";
}

// ─── GitHub API fetchers ──────────────────────────────────────────────────────

async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=public`,
    { headers: buildGitHubHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as Record<string, unknown>[];
  return data.map((r) => ({
    name: r.name as string,
    description: (r.description as string | null) ?? null,
    stargazers_count: (r.stargazers_count as number) ?? 0,
    language: (r.language as string | null) ?? null,
    html_url: r.html_url as string,
    updated_at: r.updated_at as string,
    pushed_at: r.pushed_at as string,
    topics: Array.isArray(r.topics) ? (r.topics as string[]) : [],
  }));
}

export async function fetchGitHubProfile(): Promise<GitHubProfileData | null> {
  if (!GITHUB_USERNAME) return null;

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}`,
      { headers: buildGitHubHeaders() }
    );

    if (!response.ok) return null;

    const data = await response.json() as Record<string, unknown>;

    return {
      bio: (data.bio as string | null) ?? null,
      location: (data.location as string | null) ?? null,
      blog: (data.blog as string | null) ?? null,
      twitter_username: (data.twitter_username as string | null) ?? null,
      public_repos: (data.public_repos as number) ?? 0,
      followers: (data.followers as number) ?? 0,
    };
  } catch {
    return null;
  }
}

async function checkReadmeExists(repoName: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      { headers: buildGitHubHeaders() }
    );
    return response.ok;
  } catch {
    return false;
  }
}

// ─── DB cross-reference ───────────────────────────────────────────────────────

async function fetchDbPortfolioUrls(): Promise<Set<string>> {
  try {
    const dbProjects = await prisma.project.findMany({ select: { githubUrl: true } });
    return new Set(
      dbProjects
        .map((p) => p.githubUrl?.toLowerCase())
        .filter((u): u is string => typeof u === "string" && u.length > 0)
    );
  } catch {
    return new Set();
  }
}

async function fetchDbUserForConsistency(): Promise<{
  bio: string | null;
  name: string | null;
  externalLinks: { type: string; url: string }[];
} | null> {
  try {
    const user = await prisma.user.findFirst({
      select: { bio: true, name: true },
    });
    const links = await prisma.externalLink.findMany({
      select: { type: true, url: true },
    });
    return {
      bio: null, // User model has no bio field
      name: user?.name ?? null,
      externalLinks: links,
    };
  } catch {
    return null;
  }
}

// ─── Profile consistency check ────────────────────────────────────────────────

function buildProfileConsistency(
  profile: GitHubProfileData,
  dbData: { bio: string | null; name: string | null; externalLinks: { type: string; url: string }[] } | null
): ProfileField[] {
  if (!dbData) return [];

  const fields: ProfileField[] = [];

  // bio — DB User has no bio field; skip
  // location — DB has no location field; skip
  // blog (GitHub profile website) — compare to ExternalLink OTHER or GITHUB type
  const websiteLink = dbData.externalLinks.find(
    (l) => l.type === "OTHER" || l.type === "GITHUB"
  );
  const dbBlog = websiteLink?.url ?? null;
  if (profile.blog !== null || dbBlog !== null) {
    const gh = profile.blog || null;
    const db = dbBlog || null;
    const status: ProfileField["status"] =
      gh === null && db === null
        ? "missing"
        : gh === db
        ? "match"
        : "mismatch";
    fields.push({
      field: "website / blog",
      githubValue: gh,
      dbValue: db,
      status,
    });
  }

  // twitter_username — compare to ExternalLink TWITTER
  const twitterLink = dbData.externalLinks.find((l) => l.type === "TWITTER");
  const dbTwitter = twitterLink?.url ?? null;
  if (profile.twitter_username !== null || dbTwitter !== null) {
    const gh = profile.twitter_username
      ? `https://twitter.com/${profile.twitter_username}`
      : null;
    const db = dbTwitter || null;
    const status: ProfileField["status"] =
      gh === null && db === null
        ? "missing"
        : gh === db
        ? "match"
        : "mismatch";
    fields.push({
      field: "twitter / X",
      githubValue: gh,
      dbValue: db,
      status,
    });
  }

  return fields;
}

// ─── LLM summary ─────────────────────────────────────────────────────────────

async function generateAuditSummary(
  repos: GitHubRepo[],
  profile: GitHubProfileData | null,
  gaps: PortfolioGapItem[],
  activitySummary: { active: number; recent: number; dormant: number }
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const fallback = `${repos.length} public repos — ${activitySummary.active} active, ${activitySummary.recent} recent, ${activitySummary.dormant} dormant. ${gaps.length} repo(s) not yet in the portfolio.`;

  if (!apiKey) return fallback;

  const repoList = repos
    .slice(0, 15)
    .map(
      (r) =>
        `- ${r.name} (${activitySummary}⭐${r.stargazers_count}, ${classifyActivity(r.pushed_at)}): ${r.description ?? "no description"}`
    )
    .join("\n");

  const prompt = `You are writing a brief 1–2 sentence intro paragraph for a GitHub activity audit report.

Stats: ${repos.length} public repos, ${activitySummary.active} active, ${activitySummary.recent} recently active, ${activitySummary.dormant} dormant. ${gaps.length} repos not yet featured in the portfolio.
Profile bio: ${profile?.bio ?? "(none)"}

Top repos:
${repoList}

Write a concise, factual intro (max 50 words). Plain text only, no markdown.`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    });

    const content = msg.content[0];
    return content.type === "text" ? content.text : fallback;
  } catch {
    return fallback;
  }
}

// ─── Main runner ──────────────────────────────────────────────────────────────

export async function runGithubSummarizer(): Promise<AgentRunResult> {
  if (!GITHUB_USERNAME) {
    throw new Error("GITHUB_USERNAME not set in environment");
  }

  const [repos, profile, dbUrls, dbUserData] = await Promise.all([
    fetchGitHubRepos(),
    fetchGitHubProfile(),
    fetchDbPortfolioUrls(),
    fetchDbUserForConsistency(),
  ]);

  // Activity classification
  const activitySummary = { active: 0, recent: 0, dormant: 0 };
  for (const repo of repos) {
    activitySummary[classifyActivity(repo.pushed_at)]++;
  }

  // GH-A: Missing descriptions
  const missingDescriptions: RepoRef[] = repos
    .filter((r) => !r.description || r.description.trim() === "")
    .map((r) => ({ repo: r.name, url: r.html_url }));

  // GH-A: Missing topics
  const missingTopics: RepoRef[] = repos
    .filter((r) => r.topics.length === 0)
    .map((r) => ({ repo: r.name, url: r.html_url }));

  // GH-A: Missing READMEs — check first 20 repos to avoid rate limit
  const readmeChecks = await Promise.all(
    repos.slice(0, 20).map(async (r) => {
      const exists = await checkReadmeExists(r.name);
      return { repo: r, exists };
    })
  );
  const missingReadmes: RepoRef[] = readmeChecks
    .filter((c) => !c.exists)
    .map((c) => ({ repo: c.repo.name, url: c.repo.html_url }));

  // GH-B + GH-C: Portfolio gaps — repos not in DB with stars>0 OR pushed within 90 days
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const portfolioGaps: PortfolioGapItem[] = repos
    .filter((r) => {
      const inDb = dbUrls.has(r.html_url.toLowerCase());
      if (inDb) return false;
      const pushedRecently = new Date(r.pushed_at).getTime() > ninetyDaysAgo;
      return r.stargazers_count > 0 || pushedRecently;
    })
    .map((r) => ({
      repo: r.name,
      url: r.html_url,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      activity: classifyActivity(r.pushed_at),
      importUrl: `/admin/projects/new?githubUrl=${encodeURIComponent(r.html_url)}&title=${encodeURIComponent(r.name)}`,
    }));

  // GH-D: Profile consistency
  const profileConsistency = buildProfileConsistency(
    profile ?? {
      bio: null,
      location: null,
      blog: null,
      twitter_username: null,
      public_repos: 0,
      followers: 0,
    },
    dbUserData
  );

  const summary = await generateAuditSummary(repos, profile, portfolioGaps, activitySummary);

  const rawData: GitHubAuditRawData = {
    type: "GITHUB_AUDIT",
    missingDescriptions,
    missingReadmes,
    missingTopics,
    portfolioGaps,
    profile: {
      bio: profile?.bio ?? null,
      location: profile?.location ?? null,
      blog: profile?.blog ?? null,
      twitter_username: profile?.twitter_username ?? null,
      followers: profile?.followers ?? 0,
    },
    profileConsistency,
    summary,
    repoCount: repos.length,
    activitySummary,
  };

  const markdownBody = [
    `## GitHub Audit — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    "",
    summary,
    "",
    `**${repos.length} repos** · ${activitySummary.active} active · ${activitySummary.recent} recent · ${activitySummary.dormant} dormant`,
    "",
    portfolioGaps.length > 0
      ? `**${portfolioGaps.length} portfolio gap(s):** ${portfolioGaps.map((g) => g.repo).join(", ")}`
      : "All notable repos are in the portfolio.",
    "",
    missingDescriptions.length > 0
      ? `**Missing descriptions (${missingDescriptions.length}):** ${missingDescriptions.map((r) => r.repo).join(", ")}`
      : "",
    missingReadmes.length > 0
      ? `**Missing READMEs (${missingReadmes.length}):** ${missingReadmes.map((r) => r.repo).join(", ")}`
      : "",
    missingTopics.length > 0
      ? `**Missing topics (${missingTopics.length}):** ${missingTopics.map((r) => r.repo).join(", ")}`
      : "",
  ]
    .filter((l) => l !== "")
    .join("\n");

  return {
    title: `GitHub Audit — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary: markdownBody,
    sources: repos.slice(0, 10).map((r) => r.html_url),
    rawData,
  };
}
