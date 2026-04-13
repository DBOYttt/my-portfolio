import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

const GITHUB_USERNAME = process.env.GITHUB_USERNAME ?? "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";

interface GitHubRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  updated_at: string;
}

interface GitHubProfileData {
  bio: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
}

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

async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20&type=public`,
    { headers: buildGitHubHeaders() }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<GitHubRepo[]>;
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

async function summarizeWithLLM(repos: GitHubRepo[], profile: GitHubProfileData | null): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const repoList = repos
    .slice(0, 10)
    .map(
      (r) =>
        `- **${r.name}** (${r.language ?? "unknown"}) — ${r.description ?? "no description"} [${r.stargazers_count}⭐]`
    )
    .join("\n");

  const profileLine =
    profile?.bio
      ? `\n\n*Profile: ${profile.bio}*`
      : "";

  if (!apiKey) {
    return `## GitHub Activity Summary\n\n### Recently Updated Repositories\n\n${repoList}${profileLine}\n\n*LLM summarization will be enabled once ANTHROPIC_API_KEY is configured.*`;
  }

  const prompt = `You are summarizing a software engineer's GitHub activity for their portfolio admin panel.\n\nRecently updated repositories:\n${repoList}${profile?.bio ? `\n\nProfile bio: ${profile.bio}` : ""}\n\nWrite a concise 2–3 paragraph summary covering: what types of projects are active, any interesting patterns, and what to highlight publicly. Max 300 words. Plain markdown.`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  const text = content.type === "text" ? content.text : repoList;

  return `## GitHub Activity Summary\n\n${profileLine ? profileLine + "\n\n" : ""}${text}`;
}

export async function runGithubSummarizer(): Promise<AgentRunResult> {
  if (!GITHUB_USERNAME) {
    throw new Error("GITHUB_USERNAME not set in environment");
  }

  const [repos, profile] = await Promise.all([
    fetchGitHubRepos(),
    fetchGitHubProfile(),
  ]);

  const summary = await summarizeWithLLM(repos, profile);
  const sources = repos.slice(0, 10).map((r) => r.html_url);

  return {
    title: `GitHub Activity — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary,
    sources,
    rawData: { repos: repos.slice(0, 10), profile: profile ?? null },
  };
}
