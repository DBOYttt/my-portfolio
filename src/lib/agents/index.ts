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

export const AGENT_RUNNERS: Partial<Record<AgentType, () => Promise<AgentRunResult>>> = {
  GITHUB_SUMMARIZER: runGithubSummarizer,
  ROBOTICS_NEWS: runRoboticsNews,
  BLOG_SUGGESTER: runBlogSuggester,
  OPPORTUNITY_WATCHER: runOpportunityWatcher,
  BRAND_MONITOR: runBrandMonitor,
  CV_GENERATOR: runCvGenerator,
  SKILLS_INFERENCE: runSkillsInference,
  GITHUB_PROJECT_IMPORTER: runGithubProjectImporter,
  PLATFORM_SYNC: runPlatformSync,
};
