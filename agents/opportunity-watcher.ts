/**
 * Opportunity Watcher Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/opportunity-watcher.ts
 * Uses Remotive public API (no key needed). ANTHROPIC_API_KEY enables LLM digest.
 *
 * Run manually: npx tsx agents/opportunity-watcher.ts
 * Schedule via cron: 0 8 * * 1 (every Monday at 8am)
 */

import { prisma } from "../src/lib/prisma";
import { runOpportunityWatcher } from "../src/lib/agents/opportunity-watcher";

async function run() {
  console.log("[opportunity-watcher] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-opportunity-watcher" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-opportunity-watcher",
      name: "Opportunity Watcher",
      type: "OPPORTUNITY_WATCHER",
      description: "Weekly digest of relevant job opportunities from Remotive",
      enabled: true,
      schedule: "0 8 * * 1",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runOpportunityWatcher();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[opportunity-watcher] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[opportunity-watcher] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
