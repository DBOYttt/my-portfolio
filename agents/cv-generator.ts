/**
 * CV Generator Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/cv-generator.ts
 * This script handles DB persistence and is safe to run standalone via cron.
 *
 * Run manually: npx tsx agents/cv-generator.ts
 * Schedule via cron: 0 0 * * 0 (every Sunday at midnight)
 */

import { prisma } from "../src/lib/prisma";
import { runCvGenerator } from "../src/lib/agents/cv-generator";

async function run() {
  console.log("[cv-generator] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-cv-generator" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-cv-generator",
      name: "CV Generator",
      type: "CV_GENERATOR",
      description: "Generates a PDF CV from your DB profile data using Claude",
      enabled: true,
      schedule: "0 0 * * 0",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runCvGenerator();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[cv-generator] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[cv-generator] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
