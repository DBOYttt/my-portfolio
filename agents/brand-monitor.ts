/**
 * Brand Monitor Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/brand-monitor.ts
 * Currently a stub — set BRAND_MONITOR_API_KEY to enable real monitoring.
 *
 * Run manually: npx tsx agents/brand-monitor.ts
 * Schedule via cron: 0 9 * * 3 (every Wednesday at 9am)
 */

import { PrismaClient } from "@prisma/client";
import { runBrandMonitor } from "../src/lib/agents/brand-monitor";

const prisma = new PrismaClient();

async function run() {
  console.log("[brand-monitor] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-brand-monitor" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-brand-monitor",
      name: "Brand Monitor",
      type: "BRAND_MONITOR",
      description: "Monitors online mentions of the portfolio owner",
      enabled: true,
      schedule: "0 9 * * 3",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runBrandMonitor();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[brand-monitor] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[brand-monitor] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
