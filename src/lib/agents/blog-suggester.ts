import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

export interface BlogSuggestion {
  title: string;
  tags: string[];
  rationale: string;
}

export interface BlogSeries {
  seriesTitle: string;
  posts: BlogSuggestion[];
}

interface HNStory {
  title: string;
  url: string;
  points: number;
}

interface DevToArticle {
  title: string;
  tag_list: string[];
  positive_reactions_count: number;
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

// BS-A: Fetch HackerNews trending stories from the last 7 days
async function fetchHNTrending(ownerTags: string[]): Promise<string[]> {
  try {
    const since = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i>${since}&hitsPerPage=50`,
      { headers: { "User-Agent": "portfolio-agent/1.0" } }
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { hits?: HNStory[] };
    const hits = data.hits ?? [];

    const lowerTags = ownerTags.map((t) => t.toLowerCase());
    const relevant = hits.filter((story) => {
      const titleLower = story.title.toLowerCase();
      return lowerTags.some((tag) => titleLower.includes(tag));
    });

    return relevant
      .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
      .slice(0, 5)
      .map((s) => s.title);
  } catch {
    return [];
  }
}

// BS-B: Fetch Dev.to trending articles from the last 7 days
async function fetchDevToTrending(ownerTags: string[]): Promise<string[]> {
  try {
    const res = await fetch("https://dev.to/api/articles?top=7&per_page=30", {
      headers: { "User-Agent": "portfolio-agent/1.0" },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as DevToArticle[];
    if (!Array.isArray(data)) return [];

    const lowerTags = ownerTags.map((t) => t.toLowerCase());
    const relevant = data.filter((article) => {
      const articleTags = (article.tag_list ?? []).map((t: string) =>
        t.toLowerCase()
      );
      return lowerTags.some((tag) => articleTags.includes(tag));
    });

    return relevant
      .sort(
        (a, b) =>
          (b.positive_reactions_count ?? 0) - (a.positive_reactions_count ?? 0)
      )
      .slice(0, 5)
      .map((a) => a.title);
  } catch {
    return [];
  }
}

export async function runBlogSuggester(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");
  const posts = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, tags: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  const existingTopics = posts.length;

  const ownerTags = Array.from(
    new Set(posts.flatMap((p) => p.tags.map((t) => t.name)))
  );
  if (ownerTags.length === 0) {
    ownerTags.push("robotics", "embedded", "typescript", "rust");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const summary = formatSuggestionsMarkdown(FALLBACK_SUGGESTIONS);
    return {
      title: `Blog Topic Suggestions — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
      summary: `## Blog Topic Suggestions\n\nANTHROPIC_API_KEY is not configured. Showing fallback suggestions.\n\n${summary}`,
      sources: [],
      rawData: { suggestions: FALLBACK_SUGGESTIONS, series: [], existingTopics },
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

  // BS-A + BS-B: fetch trending context
  const [hnTitles, devToTitles] = await Promise.all([
    fetchHNTrending(ownerTags),
    fetchDevToTrending(ownerTags),
  ]);

  const hnSection =
    hnTitles.length > 0
      ? `\nHackerNews trending (last 7 days, relevant to owner's topics):\n${hnTitles.map((t) => `- ${t}`).join("\n")}`
      : "";

  const devToSection =
    devToTitles.length > 0
      ? `\nDev.to trending (last 7 days, tags matching owner):\n${devToTitles.map((t) => `- ${t}`).join("\n")}\nWeight suggestions toward topics trending on dev.to but absent from the owner's blog.`
      : "";

  // BS-C: updated prompt requesting both suggestions and optional series
  const prompt = `You are a blog topic advisor for a software engineer and robotics enthusiast.

Their existing posts cover:
${postList}
${hnSection}
${devToSection}

Return a JSON object with two keys:
1. "suggestions": array of 5 standalone blog post ideas
2. "series": array of 0-2 content series (each 2-4 related posts forming a sequence; return empty array if no good series opportunity exists)

JSON shape:
{
  "suggestions": [{"title":"...","tags":["tag1","tag2"],"rationale":"one sentence"}],
  "series": [{"seriesTitle":"...","posts":[{"title":"...","tags":["tag1"],"rationale":"one sentence"}]}]
}

Return ONLY valid JSON, no explanation.
Focus on: robotics, embedded systems, software engineering, specific technical tutorials, lessons learned.
Avoid topics already covered. Make titles specific and searchable.`;

  const client = new Anthropic({ apiKey });

  let suggestions: BlogSuggestion[] = FALLBACK_SUGGESTIONS;
  let series: BlogSeries[] = [];

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = msg.content[0];
    const text = content.type === "text" ? content.text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in response");

    const parsed = JSON.parse(jsonMatch[0]) as {
      suggestions?: unknown[];
      series?: unknown[];
    };

    const rawSuggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions
      : [];
    const rawSeries = Array.isArray(parsed.series) ? parsed.series : [];

    suggestions = rawSuggestions
      .map((item: unknown) => parseSuggestion(item))
      .filter((s): s is BlogSuggestion => s !== null);

    series = rawSeries
      .map((item: unknown) => parseSeries(item))
      .filter((s): s is BlogSeries => s !== null);

    if (suggestions.length === 0) suggestions = FALLBACK_SUGGESTIONS;
  } catch {
    suggestions = FALLBACK_SUGGESTIONS;
    series = [];
  }

  let summary = `## Blog Topic Suggestions\n\n${formatSuggestionsMarkdown(suggestions)}`;
  if (series.length > 0) {
    summary += "\n\n## Content Series Ideas\n\n";
    summary += series
      .map(
        (s) =>
          `**${s.seriesTitle}**\n${s.posts
            .map((p, i) => `${i + 1}. ${p.title}`)
            .join("\n")}`
      )
      .join("\n\n");
  }

  return {
    title: `Blog Topic Suggestions — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary,
    sources: [],
    rawData: { suggestions, series, existingTopics },
  };
}

function parseSuggestion(item: unknown): BlogSuggestion | null {
  if (
    typeof item !== "object" ||
    item === null ||
    typeof (item as Record<string, unknown>).title !== "string" ||
    !Array.isArray((item as Record<string, unknown>).tags) ||
    typeof (item as Record<string, unknown>).rationale !== "string"
  ) {
    return null;
  }
  const s = item as Record<string, unknown>;
  return {
    title: s.title as string,
    tags: (s.tags as unknown[]).filter((t): t is string => typeof t === "string"),
    rationale: s.rationale as string,
  };
}

function parseSeries(item: unknown): BlogSeries | null {
  if (
    typeof item !== "object" ||
    item === null ||
    typeof (item as Record<string, unknown>).seriesTitle !== "string" ||
    !Array.isArray((item as Record<string, unknown>).posts)
  ) {
    return null;
  }
  const s = item as Record<string, unknown>;
  const posts = (s.posts as unknown[])
    .map((p) => parseSuggestion(p))
    .filter((p): p is BlogSuggestion => p !== null);
  if (posts.length === 0) return null;
  return { seriesTitle: s.seriesTitle as string, posts };
}

function formatSuggestionsMarkdown(suggestions: BlogSuggestion[]): string {
  return suggestions
    .map(
      (s, i) =>
        `**${i + 1}. ${s.title}**\n${s.rationale}\nTags: ${s.tags.join(", ")}`
    )
    .join("\n\n");
}
