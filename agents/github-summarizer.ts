import { runAgent } from "../src/lib/agents/run-agent";
import { runGithubSummarizer } from "../src/lib/agents/github-summarizer";

runAgent(
  {
    id: "agent-github-summarizer",
    name: "GitHub Summarizer",
    type: "GITHUB_SUMMARIZER",
    description: "Summarizes recent public GitHub activity",
    schedule: "0 9 * * 1",
    config: { username: process.env.GITHUB_USERNAME ?? "" },
  },
  runGithubSummarizer
).catch((e) => {
  console.error("[github-summarizer] Error:", e);
  process.exit(1);
});
