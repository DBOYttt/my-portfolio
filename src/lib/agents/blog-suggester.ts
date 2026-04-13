import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

export async function runBlogSuggester(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, tags: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      title: `Blog Topic Suggestions — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
      summary:
        "## Blog Topic Suggestions\n\nANTHROPIC_API_KEY is not configured. Set it in your .env file to enable AI-powered blog topic suggestions.",
      sources: [],
      rawData: { posts: posts.map((p) => p.title) },
    };
  }

  const postList =
    posts.length > 0
      ? posts
          .map((p) => {
            const tags = p.tags.map((t) => t.name).join(", ");
            return `- "${p.title}"${tags ? ` [${tags}]` : ""}`;
          })
          .join("\n")
      : "No published posts yet.";

  const prompt = `You are helping a software engineer and robotics enthusiast grow their technical blog.

Existing published posts:
${postList}

Suggest 5 specific blog topic ideas that would complement the existing content and attract potential employers. For each suggestion use exactly this format:

**Title**: <proposed post title>
**Why**: <one sentence on why this topic is valuable>
**Angle**: <one sentence on the unique perspective or approach to take>

Focus on topics relevant to software engineering, robotics, embedded systems, or career growth. Be specific — avoid generic titles.`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 768,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  const text = content.type === "text" ? content.text : "No suggestions generated.";

  return {
    title: `Blog Topic Suggestions — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary: `## Blog Topic Suggestions\n\n${text}`,
    sources: [],
    rawData: { posts: posts.map((p) => p.title) },
  };
}
