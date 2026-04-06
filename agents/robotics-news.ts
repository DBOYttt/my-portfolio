/**
 * Robotics News Curator Agent
 *
 * Fetches items from curated public RSS feeds, filters for relevance,
 * and stores a structured weekly digest as an AgentReport.
 *
 * Run manually: npx tsx agents/robotics-news.ts
 * Schedule via cron: 0 8 * * 5 (every Friday at 8am)
 *
 * Legal note: Only public RSS feeds are used. RSS is explicitly designed
 * for programmatic consumption. No scraping, no ToS violation.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    // Simple XML title+link extraction — use a proper RSS parser in production
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
  } catch (e) {
    console.warn(`[robotics-news] Failed to fetch ${feed.name}:`, e);
    return [];
  }
}

async function run() {
  console.log("[robotics-news] Fetching RSS feeds...");

  const allItems: FeedItem[] = [];
  for (const feed of RSS_FEEDS) {
    const items = await fetchRSSFeed(feed);
    allItems.push(...items);
    console.log(`[robotics-news] ${feed.name}: ${items.length} items`);
  }

  const summaryLines = allItems
    .slice(0, 15)
    .map((item) => `- **[${item.title}](${item.link})** — *${item.source}*`)
    .join("\n");

  const summary = `## Robotics & Tech News\n\n*Week of ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}*\n\n${summaryLines}\n\n*Sources: IEEE Spectrum, Hackaday, The Robot Report (public RSS feeds)*`;

  const agent = await prisma.agent.upsert({
    where: { id: "agent-robotics-news" },
    update: { lastRunAt: new Date() },
    create: {
      id: "agent-robotics-news",
      name: "Robotics News Curator",
      type: "ROBOTICS_NEWS",
      description: "Weekly digest from public robotics RSS feeds",
      enabled: true,
      schedule: "0 8 * * 5",
      config: { feeds: RSS_FEEDS.map((f) => f.url) },
      lastRunAt: new Date(),
    },
  });

  await prisma.agentReport.create({
    data: {
      agentId: agent.id,
      title: `Robotics News — Week of ${new Date().toLocaleDateString("en-GB", { month: "long", day: "numeric" })}`,
      summary,
      sources: allItems.map((i) => i.link),
      rawData: { items: allItems },
    },
  });

  console.log("[robotics-news] Report saved");
  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("[robotics-news] Error:", e);
  prisma.$disconnect();
  process.exit(1);
});
