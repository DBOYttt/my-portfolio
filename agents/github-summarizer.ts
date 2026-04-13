/**
 * GitHub Summarizer Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/github-summarizer.ts
 * This script handles DB persistence and is safe to run standalone via cron.
 *
 * Run manually: npx tsx agents/github-summarizer.ts
 * Schedule via cron: 0 9 * * 1 (every Monday at 9am)
 */

import { PrismaClient } from "@prisma/client";
import { runGithubSummarizer } from "../src/lib/agents/github-summarizer";

const prisma = new PrismaClient();

async function run() {
  console.log("[github-summarizer] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-github-summarizer" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-github-summarizer",
      name: "GitHub Summarizer",
      type: "GITHUB_SUMMARIZER",
      description: "Summarizes recent public GitHub activity",
      enabled: true,
      schedule: "0 9 * * 1",
      config: { username: process.env.GITHUB_USERNAME ?? "" },
      lastRunAt: new Date(),
    },
  });

  const result = await runGithubSummarizer();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[github-summarizer] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[github-summarizer] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
