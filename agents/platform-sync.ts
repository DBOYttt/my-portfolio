/**
 * Platform Sync Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/platform-sync.ts
 * This script handles DB persistence and is safe to run standalone via cron.
 *
 * Run manually: npx tsx agents/platform-sync.ts
 * Schedule via cron: 0 8 * * 1 (every Monday at 8am)
 */

import { prisma } from "../src/lib/prisma";
import { runPlatformSync } from "../src/lib/agents/platform-sync";

async function run() {
  console.log("[platform-sync] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-platform-sync" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-platform-sync",
      name: "Platform Sync",
      type: "PLATFORM_SYNC",
      description: "Syncs your public profile data from GitHub and X/Twitter",
      enabled: true,
      schedule: "0 8 * * 1",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runPlatformSync();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[platform-sync] Done:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[platform-sync] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
