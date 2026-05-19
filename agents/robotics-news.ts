import { runAgent } from "../src/lib/agents/run-agent";
import { runRoboticsNews } from "../src/lib/agents/robotics-news";

runAgent(
  {
    id: "agent-robotics-news",
    name: "Robotics News Digest",
    type: "ROBOTICS_NEWS",
    description: "Curates robotics and embedded systems news",
    schedule: "0 7 * * 1",
  },
  runRoboticsNews
).catch((e) => {
  console.error("[robotics-news] Error:", e);
  process.exit(1);
});
