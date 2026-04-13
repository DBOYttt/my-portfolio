/**
 * Robotics News Curator Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/robotics-news.ts
 * This script handles DB persistence and is safe to run standalone via cron.
 *
 * Run manually: npx tsx agents/robotics-news.ts
 * Schedule via cron: 0 8 * * 5 (every Friday at 8am)
 *
 * Legal note: Only public RSS feeds are used. RSS is explicitly designed
 * for programmatic consumption. No scraping, no ToS violation.
 */

import { prisma } from "../src/lib/prisma";
import { runRoboticsNews } from "../src/lib/agents/robotics-news";

async function run() {
  console.log("[robotics-news] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-robotics-news" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-robotics-news",
      name: "Robotics News Curator",
      type: "ROBOTICS_NEWS",
      description: "Weekly digest from public robotics RSS feeds",
      enabled: true,
      schedule: "0 8 * * 5",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runRoboticsNews();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[robotics-news] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[robotics-news] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
