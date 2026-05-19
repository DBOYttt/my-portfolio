import { runAgent } from "../src/lib/agents/run-agent";
import { runGithubProjectImporter } from "../src/lib/agents/github-project-importer";

const syncMode = process.argv.includes("--sync");

runAgent(
  {
    id: "agent-github-project-importer",
    name: "GitHub Project Importer",
    type: "GITHUB_PROJECT_IMPORTER",
    description: "Syncs GitHub repos as portfolio projects",
    schedule: "0 10 * * 2",
  },
  () => runGithubProjectImporter(syncMode)
).catch((e) => {
  console.error("[github-project-importer] Error:", e);
  process.exit(1);
});
