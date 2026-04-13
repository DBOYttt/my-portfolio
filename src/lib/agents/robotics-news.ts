import type { AgentRunResult } from "./types";

const RSS_FEEDS = [
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

interface FeedItem {
  title: string;
  link: string;
  source: string;
  pubDate?: string;
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

export async function runRoboticsNews(): Promise<AgentRunResult> {
  const allItems: FeedItem[] = [];
  for (const feed of RSS_FEEDS) {
    const items = await fetchRSSFeed(feed);
    allItems.push(...items);
  }

  const summaryLines = allItems
    .slice(0, 15)
    .map((item) => `- **[${item.title}](${item.link})** — *${item.source}*`)
    .join("\n");

  const summary = `## Robotics & Tech News\n\n*Week of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}*\n\n${summaryLines}\n\n*Sources: IEEE Spectrum, Hackaday, The Robot Report (public RSS feeds)*`;

  return {
    title: `Robotics News — Week of ${new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric" })}`,
    summary,
    sources: allItems.map((i) => i.link),
    rawData: { items: allItems },
  };
}
