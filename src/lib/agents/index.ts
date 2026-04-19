import { AgentType } from "@prisma/client";
import type { AgentRunResult } from "./types";
import { runGithubSummarizer } from "./github-summarizer";
import { runRoboticsNews } from "./robotics-news";
import { runBlogSuggester } from "./blog-suggester";
import { runOpportunityWatcher } from "./opportunity-watcher";
import { runBrandMonitor } from "./brand-monitor";
import { runCvGenerator } from "./cv-generator";
import { runSkillsInference } from "./skills-inference";
import { runGithubProjectImporter } from "./github-project-importer";
import { runPlatformSync } from "./platform-sync";

export type { AgentRunResult };

// Wrap runRoboticsNews so that when called from the admin "Run now" button it
// loads the agent's persisted config (seenUrls for dedup) from the DB, matching
// the behaviour of the CLI runner.
async function runRoboticsNewsWithConfig(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");
  const agent = await prisma.agent.findUnique({
    where: { id: "agent-robotics-news" },
    select: { config: true },
  });
  const agentConfig =
    agent?.config && typeof agent.config === "object"
      ? (agent.config as Record<string, unknown>)
      : {};
  return runRoboticsNews(agentConfig);
}

export const AGENT_RUNNERS: Partial<Record<AgentType, () => Promise<AgentRunResult>>> = {
  GITHUB_SUMMARIZER: runGithubSummarizer,
  ROBOTICS_NEWS: runRoboticsNewsWithConfig,
  BLOG_SUGGESTER: runBlogSuggester,
  OPPORTUNITY_WATCHER: runOpportunityWatcher,
  BRAND_MONITOR: runBrandMonitor,
  CV_GENERATOR: runCvGenerator,
  SKILLS_INFERENCE: runSkillsInference,
  GITHUB_PROJECT_IMPORTER: runGithubProjectImporter,
  PLATFORM_SYNC: runPlatformSync,
};
