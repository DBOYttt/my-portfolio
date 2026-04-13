/**
 * Skills Inference Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/skills-inference.ts
 * Requires GITHUB_USERNAME and optionally ANTHROPIC_API_KEY in environment.
 *
 * Run manually: npx tsx agents/skills-inference.ts
 * Schedule via cron: 0 9 * * 1 (every Monday at 9am)
 */

import { prisma } from "../src/lib/prisma";
import { runSkillsInference } from "../src/lib/agents/skills-inference";

async function run() {
  console.log("[skills-inference] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-skills-inference" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-skills-inference",
      name: "Skills Inference",
      type: "SKILLS_INFERENCE",
      description: "Analyzes GitHub repos and projects to suggest skill updates",
      enabled: true,
      schedule: "0 9 * * 1",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runSkillsInference();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[skills-inference] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[skills-inference] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
