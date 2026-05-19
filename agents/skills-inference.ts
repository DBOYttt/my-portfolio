import { runAgent } from "../src/lib/agents/run-agent";
import { runSkillsInference } from "../src/lib/agents/skills-inference";

runAgent(
  {
    id: "agent-skills-inference",
    name: "Skills Inference",
    type: "SKILLS_INFERENCE",
    description: "Infers skill changes from recent GitHub activity and blog posts",
    schedule: "0 9 * * 2",
  },
  runSkillsInference
).catch((e) => {
  console.error("[skills-inference] Error:", e);
  process.exit(1);
});
