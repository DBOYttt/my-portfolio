import { runAgent } from "../src/lib/agents/run-agent";
import { runBlogSuggester } from "../src/lib/agents/blog-suggester";

runAgent(
  {
    id: "agent-blog-suggester",
    name: "Blog Topic Suggester",
    type: "BLOG_SUGGESTER",
    description: "Suggests new blog post topics based on existing content",
    schedule: "0 10 * * 1",
  },
  runBlogSuggester
).catch((e) => {
  console.error("[blog-suggester] Error:", e);
  process.exit(1);
});
