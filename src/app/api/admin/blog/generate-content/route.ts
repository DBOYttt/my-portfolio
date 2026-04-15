import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { title, tags, excerpt } = (await req.json()) as {
    title: string;
    tags?: string[];
    excerpt?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const tagLine = tags && tags.length > 0 ? `Tags: ${tags.join(", ")}` : "";
  const excerptLine = excerpt?.trim() ? `Excerpt/hook: ${excerpt.trim()}` : "";

  const prompt = `Write a complete, high-quality blog post for a software engineer and robotics enthusiast.

Title: "${title}"
${tagLine}
${excerptLine}

Requirements:
- Write in Markdown with proper headings (##, ###)
- Length: 600–1000 words
- Tone: technical but approachable, first-person, opinionated
- Include: introduction, 2-4 main sections with code examples or diagrams where appropriate, conclusion
- Make it specific and practical — avoid generic filler
- Write as if the author has real hands-on experience with the topic
- Return ONLY the markdown content, no frontmatter, no title heading (the title is set separately)`;

  const client = new Anthropic({ apiKey });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response from Claude" }, { status: 500 });
  }

  return NextResponse.json({ content: content.text });
}
