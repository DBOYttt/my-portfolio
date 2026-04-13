import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

interface BlogSuggestion {
  title: string;
  tags: string[];
  rationale: string;
}

const FALLBACK_SUGGESTIONS: BlogSuggestion[] = [
  {
    title: "Building a ROS 2 Navigation Stack from Scratch",
    tags: ["robotics", "ros2", "navigation"],
    rationale: "ROS 2 nav stack tutorials are scarce and highly searched by robotics engineers.",
  },
  {
    title: "Embedded Rust: Writing a Safe UART Driver",
    tags: ["embedded", "rust", "hardware"],
    rationale: "Embedded Rust is growing fast and safety-critical driver walkthroughs attract senior engineers.",
  },
  {
    title: "Lessons Learned Shipping a Side Project in 30 Days",
    tags: ["software-engineering", "career", "productivity"],
    rationale: "Candid post-mortems consistently outperform generic tutorials in engagement and recruiter visibility.",
  },
];

export async function runBlogSuggester(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, tags: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const existingTopics = posts.length;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const summary = formatSuggestionsMarkdown(FALLBACK_SUGGESTIONS);
    return {
      title: `Blog Topic Suggestions — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
      summary: `## Blog Topic Suggestions\n\nANTHROPIC_API_KEY is not configured. Showing fallback suggestions.\n\n${summary}`,
      sources: [],
      rawData: { suggestions: FALLBACK_SUGGESTIONS, existingTopics },
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

  const prompt = `You are a blog topic advisor for a software engineer and robotics enthusiast.

Their existing posts cover:
${postList}

Suggest 5 new blog post topics. Return ONLY valid JSON array, no explanation:
[{"title":"...","tags":["tag1","tag2"],"rationale":"One sentence on why this topic is timely or valuable"}]

Focus on: robotics, embedded systems, software engineering, specific technical tutorials, lessons learned.
Avoid topics already covered. Make titles specific and searchable.`;

  const client = new Anthropic({ apiKey });

  let suggestions: BlogSuggestion[];

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = msg.content[0];
    const text = content.type === "text" ? content.text : "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");

    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) throw new Error("Parsed value is not an array");

    suggestions = parsed.map((item: unknown) => {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as Record<string, unknown>).title !== "string" ||
        !Array.isArray((item as Record<string, unknown>).tags) ||
        typeof (item as Record<string, unknown>).rationale !== "string"
      ) {
        throw new Error("Invalid suggestion shape");
      }
      const s = item as Record<string, unknown>;
      return {
        title: s.title as string,
        tags: (s.tags as unknown[]).filter((t): t is string => typeof t === "string"),
        rationale: s.rationale as string,
      };
    });
  } catch {
    suggestions = FALLBACK_SUGGESTIONS;
  }

  const summary = formatSuggestionsMarkdown(suggestions);

  return {
    title: `Blog Topic Suggestions — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary: `## Blog Topic Suggestions\n\n${summary}`,
    sources: [],
    rawData: { suggestions, existingTopics },
  };
}

function formatSuggestionsMarkdown(suggestions: BlogSuggestion[]): string {
  return suggestions
    .map(
      (s, i) =>
        `**${i + 1}. ${s.title}**\n${s.rationale}\nTags: ${s.tags.join(", ")}`
    )
    .join("\n\n");
}
