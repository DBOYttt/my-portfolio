import { runAgent } from "../src/lib/agents/run-agent";
import { runRoboticsNews } from "../src/lib/agents/robotics-news";
import { prisma } from "../src/lib/prisma";

const AGENT_ID = "agent-robotics-news";

prisma.agent
  .findUnique({ where: { id: AGENT_ID }, select: { config: true } })
  .then((existing) => {
    const agentConfig = (existing?.config as Record<string, unknown>) ?? {};
    return runAgent(
      {
        id: AGENT_ID,
        name: "Robotics News Digest",
        type: "ROBOTICS_NEWS",
        description: "Curates robotics and embedded systems news",
        schedule: "0 7 * * 1",
      },
      () => runRoboticsNews(agentConfig)
    );
  })
  .catch((e: unknown) => {
    console.error("[robotics-news] Error:", e);
    process.exit(1);
  });
