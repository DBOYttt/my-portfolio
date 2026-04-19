import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

const DEFAULT_RSS_FEEDS = [
  {
    name: "IEEE Spectrum Robotics",
    url: "https://spectrum.ieee.org/feeds/topic/robotics.rss",
  },
  {
    name: "Hackaday",
    url: "https://hackaday.com/feed/",
  },
  {
    name: "The Robot Report",
    url: "https://www.therobotreport.com/feed/",
  },
];

// RN-B: Configurable feed list — read from env var or fall back to hardcoded defaults
function getRssFeeds(): { name: string; url: string }[] {
  const envFeeds = process.env.ROBOTICS_RSS_FEEDS;
  if (!envFeeds) return DEFAULT_RSS_FEEDS;

  return envFeeds
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean)
    .map((url, i) => ({ name: `Feed ${i + 1}`, url }));
}

interface FeedItem {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
}

export interface DigestItem {
  title: string;
  url: string;
  why: string;
}

export interface RoboticsDigestRawData {
  type: "ROBOTICS_DIGEST";
  digest: DigestItem[];
  rawItems: { title: string; url: string; source: string }[];
  newItemCount: number;
  seenCount: number;
}

async function fetchRSSFeed(feed: { name: string; url: string }): Promise<FeedItem[]> {
  try {
    const response = await fetch(feed.url, {
      headers: { "User-Agent": "portfolio-agent/1.0 (RSS reader)" },
    });

    if (!response.ok) return [];

    const text = await response.text();

    const items: FeedItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
    const linkRegex = /<link>(.*?)<\/link>|<link href="(.*?)"/;

    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const itemText = match[1] ?? "";
      const titleMatch = titleRegex.exec(itemText);
      const linkMatch = linkRegex.exec(itemText);

      const title = titleMatch?.[1] ?? titleMatch?.[2] ?? "";
      const link = linkMatch?.[1] ?? linkMatch?.[2] ?? "";

      if (title && link) {
        items.push({ title: title.trim(), link: link.trim(), source: feed.name });
      }

      if (items.length >= 5) break;
    }

    return items;
  } catch {
    return [];
  }
}

// RN-A: LLM digest — pick 5 most relevant items with "why this matters"
async function generateDigest(items: FeedItem[]): Promise<DigestItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || items.length === 0) return [];

  const itemList = items
    .map((item, i) => `${i + 1}. "${item.title}" — ${item.link} (source: ${item.source})`)
    .join("\n");

  const prompt = `You are a robotics engineer reviewing recent news for a robotics/software job-seeker.

From the following articles, pick the 5 most relevant and write a one-sentence "why this matters" for each.
Focus on: new robotics platforms, job market signals, key tech advances, and industry movements.

Articles:
${itemList}

Return ONLY a JSON object, no explanation or markdown:
{"digest":[{"title":"...","url":"...","why":"One sentence why this matters to a robotics engineer."}]}`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = msg.content[0];
    if (content.type !== "text") return [];

    const tryParse = (text: string): DigestItem[] | null => {
      try {
        const parsed = JSON.parse(text) as { digest?: DigestItem[] };
        return Array.isArray(parsed.digest) && parsed.digest.length > 0
          ? parsed.digest
          : null;
      } catch {
        return null;
      }
    };

    const direct = tryParse(content.text);
    if (direct) return direct;

    const match = content.text.match(/\{[\s\S]*\}/);
    if (match) {
      const fromFences = tryParse(match[0]);
      if (fromFences) return fromFences;
    }

    return [];
  } catch {
    return [];
  }
}

export async function runRoboticsNews(agentConfig?: Record<string, unknown>): Promise<AgentRunResult> {
  const feeds = getRssFeeds();

  const allItems: FeedItem[] = [];
  for (const feed of feeds) {
    const items = await fetchRSSFeed(feed);
    allItems.push(...items);
  }

  // RN-C: Deduplication — load seenUrls from agent config
  const seenUrls: string[] = Array.isArray(agentConfig?.seenUrls)
    ? (agentConfig.seenUrls as string[])
    : [];
  const seenSet = new Set(seenUrls);
  const seenCount = seenUrls.length;

  // Filter to only new items
  const newItems = allItems.filter((item) => !seenSet.has(item.link));
  const newItemCount = newItems.length;

  // RN-A: Generate LLM digest from new items (fall back to empty if no API key)
  const digest = await generateDigest(newItems.slice(0, 15));

  // RN-C: Update seenUrls — append new URLs and cap at 1000 entries
  const updatedSeenUrls = [
    ...seenUrls,
    ...newItems.map((item) => item.link),
  ].slice(-1000);

  const rawItems = newItems.map((item) => ({
    title: item.title,
    url: item.link,
    source: item.source,
  }));

  const summaryLines = newItems
    .slice(0, 15)
    .map((item) => `- **[${item.title}](${item.link})** — *${item.source}*`)
    .join("\n");

  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const summary = [
    `## Robotics & Tech News`,
    ``,
    `*Week of ${dateStr}*`,
    ``,
    newItemCount > 0
      ? summaryLines
      : `_No new articles since last run (${seenCount} previously seen)._`,
    ``,
    `*Sources: ${feeds.map((f) => f.name).join(", ")} (public RSS feeds)*`,
  ].join("\n");

  const rawData: RoboticsDigestRawData = {
    type: "ROBOTICS_DIGEST",
    digest,
    rawItems,
    newItemCount,
    seenCount,
  };

  return {
    title: `Robotics News — Week of ${new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric" })}`,
    summary,
    sources: newItems.map((i) => i.link),
    rawData,
    // Carry updated seenUrls back so the CLI runner can persist it
    _updatedConfig: { seenUrls: updatedSeenUrls },
  };
}
