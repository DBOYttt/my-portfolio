/**
 * Blog Topic Suggester Agent — CLI runner
 *
 * Business logic lives in src/lib/agents/blog-suggester.ts
 * Requires ANTHROPIC_API_KEY in environment.
 *
 * Run manually: npx tsx agents/blog-suggester.ts
 * Schedule via cron: 0 10 * * 1 (every Monday at 10am)
 */

import { PrismaClient } from "@prisma/client";
import { runBlogSuggester } from "../src/lib/agents/blog-suggester";

const prisma = new PrismaClient();

async function run() {
  console.log("[blog-suggester] Starting...");

  const agent = await prisma.agent.upsert({
    where: { id: "agent-blog-suggester" },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: "agent-blog-suggester",
      name: "Blog Topic Suggester",
      type: "BLOG_SUGGESTER",
      description: "Suggests new blog post topics based on existing content",
      enabled: true,
      schedule: "0 10 * * 1",
      config: {},
      lastRunAt: new Date(),
    },
  });

  const result = await runBlogSuggester();

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: result.title,
      summary: result.summary,
      sources: result.sources,
      rawData: result.rawData as object,
    },
  });

  console.log("[blog-suggester] Report saved:", result.title);
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[blog-suggester] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
