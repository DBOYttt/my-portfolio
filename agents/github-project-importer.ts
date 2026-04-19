/**
 * GitHub Project Importer Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/github-project-importer.ts
 * Requires GITHUB_USERNAME and optionally ANTHROPIC_API_KEY in environment.
 *
 * Run manually:  npx tsx agents/github-project-importer.ts
 * Re-sync mode:  npx tsx agents/github-project-importer.ts --sync
 * Schedule via cron: 0 10 * * 1 (every Monday at 10am)
 */

import { prisma } from "../src/lib/prisma";
import { runGithubProjectImporter } from "../src/lib/agents/github-project-importer";

async function run() {
  // GPI-A: support --sync flag for re-sync mode
  const syncMode = process.argv.includes("--sync");

  console.log(`[github-project-importer] Starting... (mode: ${syncMode ? "sync" : "import"})`);

  const agent = await prisma.agent.upsert({
    where: { id: "agent-github-project-importer" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-github-project-importer",
      name: "GitHub Project Importer",
      type: "GITHUB_PROJECT_IMPORTER",
      description: "Finds GitHub repos not yet in the portfolio and suggests project drafts",
      enabled: true,
      schedule: "0 10 * * 1",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runGithubProjectImporter(syncMode);

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[github-project-importer] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[github-project-importer] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
