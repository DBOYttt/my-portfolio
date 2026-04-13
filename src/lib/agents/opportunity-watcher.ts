import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

interface RemotiveJob {
  title: string;
  company_name: string;
  url: string;
  tags: string[];
  candidate_required_location: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

const KEYWORDS = ["robotics", "embedded", "ros", "firmware", "c++", "autonomous", "hardware"];

export async function runOpportunityWatcher(): Promise<AgentRunResult> {
  const response = await fetch(
    "https://remotive.com/api/remote-jobs?category=software-dev&limit=50",
    { headers: { "User-Agent": "portfolio-agent/1.0" } }
  );

  if (!response.ok) {
    throw new Error(`Remotive API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as RemotiveResponse;

  const matched = data.jobs.filter((job) => {
    const titleLower = job.title.toLowerCase();
    const tagLowers = job.tags.map((t) => t.toLowerCase());
    return KEYWORDS.some(
      (kw) => titleLower.includes(kw) || tagLowers.some((tag) => tag.includes(kw))
    );
  });

  const title = `Opportunity Watch — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;

  if (matched.length === 0) {
    return {
      title,
      summary:
        "## Opportunity Watch\n\nNo matching remote jobs found this run. Check back later or broaden the keyword list.",
      sources: [],
      rawData: { matched: 0, total: data.jobs.length },
    };
  }

  const sources = matched.slice(0, 10).map((j) => j.url);
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const lines = matched
      .slice(0, 10)
      .map((j) => `- **[${j.title}](${j.url})** — ${j.company_name} (${j.candidate_required_location || "Remote"})`)
      .join("\n");

    return {
      title,
      summary: `## Opportunity Watch\n\n${matched.length} matching remote jobs found:\n\n${lines}\n\n*Set ANTHROPIC_API_KEY to enable AI-generated digest.*`,
      sources,
      rawData: { matched: matched.length, total: data.jobs.length, jobs: matched.slice(0, 10) },
    };
  }

  const jobList = matched
    .slice(0, 15)
    .map(
      (j) =>
        `- **${j.title}** at ${j.company_name} (${j.candidate_required_location || "Remote"}) — ${j.url}`
    )
    .join("\n");

  const prompt = `You are helping a software engineer and robotics enthusiast find relevant remote job opportunities.

Matching remote jobs (filtered for robotics/embedded/hardware relevance):
${jobList}

Write a brief digest covering:
1. Top 3–5 most interesting opportunities and why they stand out
2. Any market trends you notice (common requirements, tech stacks, locations)

Keep it under 250 words. Plain markdown.`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  const text = content.type === "text" ? content.text : jobList;

  return {
    title,
    summary: `## Opportunity Watch\n\n${text}`,
    sources,
    rawData: { matched: matched.length, total: data.jobs.length, jobs: matched.slice(0, 10) },
  };
}
