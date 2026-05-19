import { runAgent } from "../src/lib/agents/run-agent";
import { runBrandMonitor } from "../src/lib/agents/brand-monitor";

runAgent(
  {
    id: "agent-brand-monitor",
    name: "Brand Monitor",
    type: "BRAND_MONITOR",
    description: "Monitors brand mentions across GitHub, Google, and Dev.to",
    schedule: "0 8 * * *",
  },
  runBrandMonitor
).catch((e) => {
  console.error("[brand-monitor] Error:", e);
  process.exit(1);
});
