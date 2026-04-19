import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

interface OutlineSection {
  heading: string;
  description: string;
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { title, tags } = (await req.json()) as {
    title: string;
    tags?: string[];
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const tagLine = tags && tags.length > 0 ? ` Tags: ${tags.join(", ")}.` : "";

  const prompt = `Generate a blog post outline for the title "${title}".${tagLine} Return 4-6 H2 section headings with one-sentence descriptions. Return JSON only: { "outline": [{ "heading": "string", "description": "string" }] }`;

  const client = new Anthropic({ apiKey });

  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const content = msg.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "Unexpected response from Claude" }, { status: 500 });
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Failed to parse outline" }, { status: 500 });
  }

  let outline: OutlineSection[];
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { outline?: unknown[] };
    const raw = Array.isArray(parsed.outline) ? parsed.outline : [];
    outline = raw
      .filter(
        (item): item is OutlineSection =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).heading === "string" &&
          typeof (item as Record<string, unknown>).description === "string"
      )
      .map((item) => ({
        heading: (item as OutlineSection).heading,
        description: (item as OutlineSection).description,
      }));
  } catch {
    return NextResponse.json({ error: "Failed to parse outline" }, { status: 500 });
  }

  return NextResponse.json({ outline });
}
