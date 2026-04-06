/**
 * GitHub Summarizer Agent
 *
 * Fetches public GitHub activity for the configured username,
 * sends to an LLM for summarization, and stores the result as
 * an AgentReport in the database.
 *
 * Run manually: npx tsx agents/github-summarizer.ts
 * Schedule via cron: 0 9 * * 1 (every Monday at 9am)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "portfolio-agent/1.0",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20&type=public`,
    { headers }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<GitHubRepo[]>;
}

async function summarizeWithLLM(repoData: GitHubRepo[]): Promise<string> {
  // TODO: Replace stub with real LLM call
  // Example with Anthropic:
  //
  // import Anthropic from "@anthropic-ai/sdk";
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const msg = await client.messages.create({
  //   model: "claude-opus-4-6",
  //   max_tokens: 1024,
  //   messages: [{ role: "user", content: prompt }],
  // });

  const repoList = repoData
    .slice(0, 10)
    .map((r) => `- **${r.name}** (${r.language ?? "unknown"}) — ${r.description ?? "no description"} [${r.stargazers_count}⭐]`)
    .join("\n");

  return `## GitHub Activity Summary\n\n### Recently Updated Repositories\n\n${repoList}\n\n*This summary was generated automatically. LLM summarization will be enabled once ANTHROPIC_API_KEY is configured.*`;
}

async function run() {
  if (!GITHUB_USERNAME) {
    console.error("❌ GITHUB_USERNAME not set in environment");
    process.exit(1);
  }

  console.log(`[github-summarizer] Running for user: ${GITHUB_USERNAME}`);

  // Find or create the agent record
  const agent = await prisma.agent.upsert({
    where: { id: "agent-github-summarizer" },
    update: { lastRunAt: new Date() },
    create: {
      id: "agent-github-summarizer",
      name: "GitHub Summarizer",
      type: "GITHUB_SUMMARIZER",
      description: "Summarizes recent public GitHub activity",
      enabled: true,
      schedule: "0 9 * * 1",
      config: { username: GITHUB_USERNAME },
      lastRunAt: new Date(),
    },
  });

  const repos = await fetchGitHubRepos();
  console.log(`[github-summarizer] Fetched ${repos.length} repos`);

  const summary = await summarizeWithLLM(repos);
  const sources = repos.slice(0, 10).map((r) => r.html_url);

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: `GitHub Activity — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
      summary,
      sources,
      rawData: { repos: repos.slice(0, 10) },
    },
  });

  console.log("[github-summarizer] Report saved to database");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[github-summarizer] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
