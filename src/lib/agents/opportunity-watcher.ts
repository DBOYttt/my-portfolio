import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import type { AgentRunResult } from "./types";

const HARDCODED_KEYWORDS = [
  "robotics",
  "embedded",
  "ros",
  "firmware",
  "c++",
  "autonomous",
  "hardware",
];

export interface JobListing {
  title: string;
  company: string;
  url: string;
  location: string;
  source: string;
  description?: string;
  score?: number;
  rationale?: string;
}

interface RemotiveJob {
  title: string;
  company_name: string;
  url: string;
  tags: string[];
  candidate_required_location: string;
  description?: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

interface HNSearchHit {
  objectID: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  url?: string;
}

interface HNSearchResponse {
  hits: HNSearchHit[];
}

interface AgentConfig {
  keywords?: string[];
  seenJobUrls?: string[];
}

function parseXmlItems(xml: string): Array<{ title: string; link: string; description: string }> {
  const items: Array<{ title: string; link: string; description: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = /<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/i.exec(block);
    const linkMatch = /<link>([\s\S]*?)<\/link>|<link\s+[^>]*href="([^"]*)"[^>]*>/i.exec(block);
    const descMatch = /<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/i.exec(block);
    items.push({
      title: (titleMatch?.[1] ?? titleMatch?.[2] ?? "").trim(),
      link: (linkMatch?.[1] ?? linkMatch?.[2] ?? "").trim(),
      description: (descMatch?.[1] ?? descMatch?.[2] ?? "").trim(),
    });
  }
  return items;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchRemotive(keywords: string[]): Promise<JobListing[]> {
  const res = await fetch(
    "https://remotive.com/api/remote-jobs?category=software-dev&limit=50",
    { headers: { "User-Agent": "portfolio-agent/1.0" } }
  );
  if (!res.ok) throw new Error(`Remotive API error: ${res.status}`);
  const data = (await res.json()) as RemotiveResponse;
  return data.jobs
    .filter((job) => {
      const titleLower = job.title.toLowerCase();
      const tagLowers = job.tags.map((t) => t.toLowerCase());
      const descLower = stripHtml(job.description ?? "").toLowerCase();
      return keywords.some(
        (kw) =>
          titleLower.includes(kw) ||
          tagLowers.some((tag) => tag.includes(kw)) ||
          descLower.includes(kw)
      );
    })
    .map((job) => ({
      title: job.title,
      company: job.company_name,
      url: job.url,
      location: job.candidate_required_location || "Remote",
      source: "Remotive",
      description: stripHtml(job.description ?? "").slice(0, 300),
    }));
}

async function fetchWWR(keywords: string[]): Promise<JobListing[]> {
  const res = await fetch(
    "https://weworkremotely.com/categories/remote-programming-jobs.rss",
    { headers: { "User-Agent": "portfolio-agent/1.0" } }
  );
  if (!res.ok) throw new Error(`WWR RSS error: ${res.status}`);
  const xml = await res.text();
  const items = parseXmlItems(xml);
  return items
    .filter((item) => {
      const text = `${item.title} ${stripHtml(item.description)}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    })
    .slice(0, 20)
    .map((item) => ({
      title: item.title,
      company: "",
      url: item.link,
      location: "Remote",
      source: "We Work Remotely",
      description: stripHtml(item.description).slice(0, 300),
    }));
}

async function fetchHackerNews(keywords: string[]): Promise<JobListing[]> {
  const hnRes = await fetch(
    "https://hn.algolia.com/api/v1/search?query=who+is+hiring&tags=ask_hn&hitsPerPage=1",
    { headers: { "User-Agent": "portfolio-agent/1.0" } }
  );
  if (!hnRes.ok) throw new Error(`HN search error: ${hnRes.status}`);
  const hnData = (await hnRes.json()) as HNSearchResponse;
  const threadId = hnData.hits[0]?.objectID;
  if (!threadId) return [];

  const searchRes = await fetch(
    `https://hn.algolia.com/api/v1/search?tags=comment,story_${threadId}&query=${encodeURIComponent(keywords.join(" OR "))}&hitsPerPage=20`,
    { headers: { "User-Agent": "portfolio-agent/1.0" } }
  );
  if (!searchRes.ok) throw new Error(`HN thread search error: ${searchRes.status}`);
  const searchData = (await searchRes.json()) as HNSearchResponse;

  return searchData.hits
    .filter((hit) => hit.comment_text)
    .slice(0, 10)
    .map((hit) => {
      const text = stripHtml(hit.comment_text ?? "");
      const titleLine = text.split("\n")[0]?.slice(0, 120) ?? "HN Hiring Post";
      return {
        title: titleLine,
        company: "",
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        location: "Remote/Various",
        source: "HackerNews Who's Hiring",
        description: text.slice(0, 300),
      };
    });
}

async function scoreJobs(
  jobs: JobListing[],
  skills: string[],
  apiKey: string
): Promise<JobListing[]> {
  if (jobs.length === 0) return [];

  const jobsText = jobs
    .map(
      (j, i) =>
        `${i + 1}. ${j.title} at ${j.company || "unknown"} (${j.source})\n   ${j.description ?? ""}`
    )
    .join("\n\n");

  const skillsText = skills.slice(0, 30).join(", ");

  const prompt = `You are evaluating job fit for a software engineer with robotics/embedded expertise.

Owner's skills: ${skillsText || "software engineering, robotics, embedded systems"}

Jobs to score:
${jobsText}

Score each job 1-10 for fit with one sentence rationale. Return ONLY valid JSON array, no markdown:
[{"index":1,"score":8,"rationale":"Strong match because..."},...]

Index corresponds to the number before each job listing.`;

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const content = msg.content[0];
  if (content.type !== "text") return jobs;

  try {
    const jsonText = content.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const scores = JSON.parse(jsonText) as Array<{ index: number; score: number; rationale: string }>;
    return jobs.map((job, i) => {
      const scored = scores.find((s) => s.index === i + 1);
      return scored
        ? { ...job, score: scored.score, rationale: scored.rationale }
        : job;
    });
  } catch {
    return jobs;
  }
}

async function sendAlertEmail(
  topJobs: JobListing[],
  adminEmail: string
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  const fromEmail = process.env.CONTACT_FROM_EMAIL ?? "portfolio@yourdomain.com";
  const resend = new Resend(resendKey);

  const listHtml = topJobs
    .map(
      (j) =>
        `<li><strong>${j.title}</strong> at ${j.company || j.source} — Score: ${j.score}/10<br>` +
        `${j.rationale ?? ""}<br><a href="${j.url}">${j.url}</a></li>`
    )
    .join("");

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `[Portfolio] ${topJobs.length} high-match job${topJobs.length !== 1 ? "s" : ""} found`,
    html: `<h2>High-Match Opportunities</h2><ul>${listHtml}</ul>`,
  });
}

export async function runOpportunityWatcher(): Promise<AgentRunResult> {
  const { prisma } = await import("@/lib/prisma");

  // OW-A: Load or seed keywords from agent config
  let agent = await prisma.agent.findFirst({
    where: { type: "OPPORTUNITY_WATCHER" },
  });

  let config: AgentConfig = {};
  if (agent) {
    config = (agent.config as AgentConfig | null) ?? {};
  }

  if (!config.keywords || config.keywords.length === 0) {
    config.keywords = HARDCODED_KEYWORDS;
    if (agent) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { config: { ...config } },
      });
    }
  }
  const keywords = config.keywords;
  const seenJobUrls: string[] = Array.isArray(config.seenJobUrls) ? config.seenJobUrls : [];

  // OW-B: Multi-source fetch — failures are swallowed
  const sourceResults: Array<{ name: string; jobCount: number; error?: string }> = [];
  let allJobs: JobListing[] = [];

  // Remotive
  try {
    const remotiveJobs = await fetchRemotive(keywords);
    allJobs.push(...remotiveJobs);
    sourceResults.push({ name: "Remotive", jobCount: remotiveJobs.length });
  } catch (err) {
    sourceResults.push({ name: "Remotive", jobCount: 0, error: String(err) });
  }

  // We Work Remotely
  try {
    const wwrJobs = await fetchWWR(keywords);
    allJobs.push(...wwrJobs);
    sourceResults.push({ name: "We Work Remotely", jobCount: wwrJobs.length });
  } catch (err) {
    sourceResults.push({ name: "We Work Remotely", jobCount: 0, error: String(err) });
  }

  // HackerNews Who's Hiring
  try {
    const hnJobs = await fetchHackerNews(keywords);
    allJobs.push(...hnJobs);
    sourceResults.push({ name: "HackerNews Who's Hiring", jobCount: hnJobs.length });
  } catch (err) {
    sourceResults.push({ name: "HackerNews Who's Hiring", jobCount: 0, error: String(err) });
  }

  const totalMatchCount = allJobs.length;

  // OW-C: Deduplicate against seen URLs
  const seenSet = new Set(seenJobUrls.map((u) => u.toLowerCase()));
  const newJobs = allJobs.filter((j) => j.url && !seenSet.has(j.url.toLowerCase()));
  const seenCount = totalMatchCount - newJobs.length;
  const newJobCount = newJobs.length;

  const title = `Opportunity Watch — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;

  if (newJobs.length === 0) {
    // Still update seen URLs to avoid stale list growth
    const newUrls = allJobs.map((j) => j.url).filter(Boolean);
    const updatedSeen = [...new Set([...seenJobUrls, ...newUrls])].slice(-500);
    if (agent) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { config: { ...config, seenJobUrls: updatedSeen } },
      });
    }
    return {
      title,
      summary: `## Opportunity Watch\n\nNo new matching remote jobs found this run (${seenCount} already seen). Check back later or broaden the keyword list.`,
      sources: [],
      rawData: {
        sources: sourceResults,
        newJobCount: 0,
        totalMatchCount,
        seenCount,
        jobs: [],
        keywords,
      },
    };
  }

  // OW-D: Score jobs with LLM if API key available
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let scoredJobs = newJobs.slice(0, 15);

  if (apiKey) {
    const existingSkills = await prisma.skill.findMany({ select: { name: true } });
    const skillNames = existingSkills.map((s) => s.name);
    scoredJobs = await scoreJobs(scoredJobs, skillNames, apiKey);
    scoredJobs.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  // OW-E: Email alert for high-match jobs
  const alertThreshold = parseInt(process.env.OPPORTUNITY_ALERT_THRESHOLD ?? "8", 10);
  const alertEnabled = process.env.OPPORTUNITY_ALERT_EMAIL === "true";
  const adminEmail = process.env.ADMIN_EMAIL;
  const highMatchJobs = scoredJobs.filter((j) => (j.score ?? 0) >= alertThreshold);

  if (alertEnabled && adminEmail && highMatchJobs.length > 0) {
    try {
      await sendAlertEmail(highMatchJobs, adminEmail);
    } catch {
      // non-fatal — report still saves
    }
  }

  // Update seen URLs (cap at 500 to avoid unbounded growth)
  const newUrls = allJobs.map((j) => j.url).filter(Boolean);
  const updatedSeen = [...new Set([...seenJobUrls, ...newUrls])].slice(-500);
  if (agent) {
    await prisma.agent.update({
      where: { id: agent.id },
      data: { config: { ...config, seenJobUrls: updatedSeen } },
    });
  }

  const sources = scoredJobs.slice(0, 10).map((j) => j.url);

  let summaryText: string;
  if (apiKey) {
    const jobList = scoredJobs
      .slice(0, 15)
      .map(
        (j) =>
          `- **[${j.title}](${j.url})** — ${j.company || j.source} · Score: ${j.score ?? "?"}/10`
      )
      .join("\n");
    summaryText = `${newJobCount} new job${newJobCount !== 1 ? "s" : ""} found (${seenCount} already seen, ${totalMatchCount} total matched):\n\n${jobList}\n\n*Set ANTHROPIC_API_KEY to enable detailed digest.*`;
  } else {
    const lines = scoredJobs
      .slice(0, 10)
      .map((j) => `- **[${j.title}](${j.url})** — ${j.company || j.source} (${j.location})`)
      .join("\n");
    summaryText = `${newJobCount} new job${newJobCount !== 1 ? "s" : ""} found (${seenCount} already seen, ${totalMatchCount} total matched):\n\n${lines}\n\n*Set ANTHROPIC_API_KEY to enable AI scoring.*`;
  }

  return {
    title,
    summary: `## Opportunity Watch\n\n${summaryText}`,
    sources,
    rawData: {
      sources: sourceResults,
      newJobCount,
      totalMatchCount,
      seenCount,
      keywords,
      jobs: scoredJobs.slice(0, 15),
    },
  };
}
