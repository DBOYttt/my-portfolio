import { runAgent } from "../src/lib/agents/run-agent";
import { runPlatformSync } from "../src/lib/agents/platform-sync";

runAgent(
  {
    id: "agent-platform-sync",
    name: "Platform Sync",
    type: "PLATFORM_SYNC",
    description: "Checks consistency across GitHub, LinkedIn, and portfolio DB",
    schedule: "0 11 * * 3",
  },
  runPlatformSync
).catch((e) => {
  console.error("[platform-sync] Error:", e);
  process.exit(1);
});
