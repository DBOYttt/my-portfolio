import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";

export interface GoogleAlertItem {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  sentiment?: string;
}

export interface GithubRepoStat {
  repo: string;
  stars: number;
  forks: number;
  starDelta: number;
  forkDelta: number;
}

export interface DevToMention {
  id: number;
  title: string;
  url: string;
  author: string;
  publishedAt: string;
}

interface BrandMonitorConfig {
  seenGuids?: string[];
  repoSnapshot?: Record<string, { stars: number; forks: number }>;
  seenDevToIds?: number[];
}

interface GitHubRepo {
  name: string;
  stargazers_count: number;
  forks_count: number;
}

interface DevToArticle {
  id: number;
  title: string;
  url: string;
  user: { name: string; username: string };
  published_at: string;
  tag_list: string[];
}

async function fetchGoogleAlerts(
  feedUrls: string[],
  seenGuids: Set<string>
): Promise<GoogleAlertItem[]> {
  const newItems: GoogleAlertItem[] = [];

  for (const url of feedUrls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "portfolio-agent/1.0 (RSS reader)" },
      });
      if (!res.ok) continue;

      const text = await res.text();
      const itemRegex = /<entry>([\s\S]*?)<\/entry>|<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/s;
      const linkRegex = /<link[^>]*href="([^"]+)"|<link>(.*?)<\/link>/;
      const guidRegex = /<id>(.*?)<\/id>|<guid[^>]*>(.*?)<\/guid>/;
      const dateRegex = /<published>(.*?)<\/published>|<updated>(.*?)<\/updated>|<pubDate>(.*?)<\/pubDate>/;

      let match;
      while ((match = itemRegex.exec(text)) !== null) {
        const itemText = match[1] ?? match[2] ?? "";

        const titleMatch = titleRegex.exec(itemText);
        const linkMatch = linkRegex.exec(itemText);
        const guidMatch = guidRegex.exec(itemText);
        const dateMatch = dateRegex.exec(itemText);

        const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? "").trim();
        const link = (linkMatch?.[1] ?? linkMatch?.[2] ?? "").trim();
        const guid = (guidMatch?.[1] ?? guidMatch?.[2] ?? link).trim();
        const pubDate = (dateMatch?.[1] ?? dateMatch?.[2] ?? dateMatch?.[3] ?? "").trim();

        if (title && link && guid && !seenGuids.has(guid)) {
          newItems.push({ guid, title, link, pubDate });
        }
      }
    } catch {
      // skip failing feed
    }
  }

  return newItems;
}

async function classifyAlertSentiments(
  items: GoogleAlertItem[],
  apiKey: string
): Promise<GoogleAlertItem[]> {
  if (items.length === 0) return items;

  const client = new Anthropic({ apiKey });

  const prompt = `Classify the sentiment of each news item title as "positive", "neutral", or "negative" from the perspective of the person being mentioned.

Items:
${items.map((item, i) => `${i + 1}. ${item.title}`).join("\n")}

Return ONLY a JSON array of strings, one per item in the same order:
["positive","neutral","negative",...]`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = msg.content[0]?.type === "text" ? msg.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return items;

    const sentiments = JSON.parse(jsonMatch[0]) as string[];
    return items.map((item, i) => ({
      ...item,
      sentiment: sentiments[i] ?? "neutral",
    }));
  } catch {
    return items;
  }
}

async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    "User-Agent": "portfolio-agent/1.0",
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=public`,
      { headers }
    );
    if (!res.ok) return [];
    const data = await res.json() as GitHubRepo[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchDevToArticles(username: string): Promise<DevToArticle[]> {
  const results: DevToArticle[] = [];

  try {
    const res = await fetch(
      `https://dev.to/api/articles?username=${username}&per_page=10`,
      { headers: { "User-Agent": "portfolio-agent/1.0" } }
    );
    if (res.ok) {
      const data = await res.json() as DevToArticle[];
      if (Array.isArray(data)) results.push(...data);
    }
  } catch {
    // skip
  }

  return results;
}

async function fetchDevToByTag(
  tag: string,
  ownerName: string,
  ownerUsername: string,
  seenIds: Set<number>
): Promise<DevToMention[]> {
  const mentions: DevToMention[] = [];

  try {
    const res = await fetch(
      `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=20`,
      { headers: { "User-Agent": "portfolio-agent/1.0" } }
    );
    if (!res.ok) return mentions;

    const data = await res.json() as DevToArticle[];
    if (!Array.isArray(data)) return mentions;

    const lowerName = ownerName.toLowerCase();
    const lowerUsername = ownerUsername.toLowerCase();

    for (const article of data) {
      if (seenIds.has(article.id)) continue;
      const titleLower = article.title.toLowerCase();
      if (titleLower.includes(lowerName) || titleLower.includes(lowerUsername)) {
        mentions.push({
          id: article.id,
          title: article.title,
          url: article.url,
          author: article.user?.name ?? article.user?.username ?? "unknown",
          publishedAt: article.published_at,
        });
      }
    }
  } catch {
    // skip
  }

  return mentions;
}

export async function runBrandMonitor(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");

  const agent = await prisma.agent.findFirst({
    where: { type: "BRAND_MONITOR" },
  });

  const savedConfig = (agent?.config ?? {}) as BrandMonitorConfig;
  const seenGuids = new Set<string>(savedConfig.seenGuids ?? []);
  const prevSnapshot: Record<string, { stars: number; forks: number }> =
    savedConfig.repoSnapshot ?? {};
  const seenDevToIds = new Set<number>(savedConfig.seenDevToIds ?? []);

  const githubUsername = process.env.GITHUB_USERNAME ?? "";
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // BM-A: Google Alerts RSS
  const alertFeedsRaw = process.env.GOOGLE_ALERTS_RSS_FEEDS ?? "";
  const alertFeedUrls = alertFeedsRaw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  let googleAlerts: GoogleAlertItem[] = [];
  if (alertFeedUrls.length > 0) {
    const newAlerts = await fetchGoogleAlerts(alertFeedUrls, seenGuids);
    googleAlerts = apiKey
      ? await classifyAlertSentiments(newAlerts, apiKey)
      : newAlerts;
  }

  // BM-B: GitHub star/fork delta
  let githubDelta: GithubRepoStat[] = [];
  const newSnapshot: Record<string, { stars: number; forks: number }> = {};
  if (githubUsername) {
    const repos = await fetchGitHubRepos(githubUsername);
    for (const repo of repos) {
      newSnapshot[repo.name] = {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      };
      const prev = prevSnapshot[repo.name] ?? { stars: 0, forks: 0 };
      githubDelta.push({
        repo: repo.name,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        starDelta: repo.stargazers_count - prev.stars,
        forkDelta: repo.forks_count - prev.forks,
      });
    }
    githubDelta = githubDelta.sort((a, b) => b.stars - a.stars);
  }

  // BM-C: Dev.to mention detection
  let devToMentions: DevToMention[] = [];
  if (githubUsername) {
    const ownerArticles = await fetchDevToArticles(githubUsername);
    for (const article of ownerArticles) {
      if (!seenDevToIds.has(article.id)) {
        devToMentions.push({
          id: article.id,
          title: article.title,
          url: article.url,
          author: article.user?.name ?? article.user?.username ?? "unknown",
          publishedAt: article.published_at,
        });
      }
    }

    const firstTag = ownerArticles[0]?.tag_list?.[0] ?? "programming";
    const tagMentions = await fetchDevToByTag(
      firstTag,
      githubUsername,
      githubUsername,
      seenDevToIds
    );
    for (const m of tagMentions) {
      if (!devToMentions.some((d) => d.id === m.id)) {
        devToMentions.push(m);
      }
    }
  }

  // Persist updated config back to agent row
  if (agent) {
    const updatedGuids = Array.from(seenGuids);
    for (const item of googleAlerts) updatedGuids.push(item.guid);

    const updatedDevToIds = Array.from(seenDevToIds);
    for (const m of devToMentions) updatedDevToIds.push(m.id);

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        config: {
          seenGuids: [...new Set(updatedGuids)],
          repoSnapshot: newSnapshot,
          seenDevToIds: [...new Set(updatedDevToIds)],
        } satisfies BrandMonitorConfig,
      },
    });
  }

  // Build summary
  const sections: string[] = ["## Brand Monitor\n"];

  if (githubDelta.length > 0) {
    const notable = githubDelta.filter(
      (r) => r.starDelta !== 0 || r.forkDelta !== 0
    );
    if (notable.length > 0) {
      sections.push("### GitHub Activity\n");
      for (const r of notable.slice(0, 10)) {
        const starStr =
          r.starDelta > 0
            ? `+${r.starDelta}`
            : r.starDelta < 0
            ? String(r.starDelta)
            : "0";
        const forkStr =
          r.forkDelta > 0
            ? `+${r.forkDelta}`
            : r.forkDelta < 0
            ? String(r.forkDelta)
            : "0";
        sections.push(
          `- **${r.repo}** — ⭐ ${r.stars} (${starStr}) · 🍴 ${r.forks} (${forkStr})`
        );
      }
      sections.push("");
    }
  }

  if (googleAlerts.length > 0) {
    sections.push("### Google Alerts\n");
    for (const a of googleAlerts.slice(0, 10)) {
      sections.push(
        `- [${a.title}](${a.link})${a.sentiment ? ` — *${a.sentiment}*` : ""}`
      );
    }
    sections.push("");
  } else if (alertFeedUrls.length === 0) {
    sections.push(
      "_No Google Alerts feeds configured. Set `GOOGLE_ALERTS_RSS_FEEDS` in `.env` to enable._\n"
    );
  }

  if (devToMentions.length > 0) {
    sections.push("### Dev.to Mentions\n");
    for (const m of devToMentions.slice(0, 10)) {
      sections.push(`- [${m.title}](${m.url}) — *${m.author}*`);
    }
    sections.push("");
  }

  if (
    githubDelta.filter((r) => r.starDelta !== 0 || r.forkDelta !== 0).length ===
      0 &&
    googleAlerts.length === 0 &&
    devToMentions.length === 0
  ) {
    sections.push("_No new activity detected this run._");
  }

  return {
    title: `Brand Monitor — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary: sections.join("\n"),
    sources: [
      ...googleAlerts.map((a) => a.link),
      ...devToMentions.map((m) => m.url),
    ],
    rawData: {
      githubDelta,
      googleAlerts,
      devToMentions,
    },
  };
}
