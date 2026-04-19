import type { AgentRunResult } from "./types";
import { fetchGitHubProfile } from "./github-summarizer";
import { fetchTwitterProfile } from "./twitter-profile";

export interface ProfileConsistencyRow {
  field: string;
  githubValue: string | null;
  dbValue: string | null;
  status: "match" | "mismatch" | "missing_github" | "missing_db";
}

export interface PlatformSyncRawData {
  github: {
    bio: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
    public_repos: number;
    followers: number;
  } | null;
  twitter: {
    username: string;
    bio: string;
    location: string;
    followerCount: number;
    recentTweets: string[];
  } | null;
  configuredPlatforms: string[];
  // PS-B: cross-platform consistency table
  profileConsistency: ProfileConsistencyRow[];
  // PS-A: LinkedIn cross-reference hint
  dbExperienceCount: number;
}

// PS-B: compare GitHub profile fields against DB values
async function buildProfileConsistency(
  githubData: {
    bio: string | null;
    location: string | null;
    blog: string | null;
    twitter_username: string | null;
  } | null
): Promise<{ consistency: ProfileConsistencyRow[]; dbExperienceCount: number }> {
  const { prisma } = await import("@/lib/prisma");

  let consistency: ProfileConsistencyRow[] = [];
  let dbExperienceCount = 0;

  try {
    const [user, externalLinks, experienceRows] = await Promise.all([
      prisma.user.findFirst({ select: { name: true } }),
      prisma.externalLink.findMany({ select: { type: true, url: true, label: true } }),
      prisma.experience.findMany({ select: { id: true } }),
    ]);

    dbExperienceCount = experienceRows.length;

    if (!githubData) return { consistency: [], dbExperienceCount };

    const makeRow = (
      field: string,
      githubValue: string | null,
      dbValue: string | null
    ): ProfileConsistencyRow => {
      const gh = githubValue || null;
      const db = dbValue || null;
      let status: ProfileConsistencyRow["status"];
      if (!gh && !db) status = "missing_github";
      else if (!gh) status = "missing_github";
      else if (!db) status = "missing_db";
      else if (gh === db) status = "match";
      else status = "mismatch";
      return { field, githubValue: gh, dbValue: db, status };
    };

    // Name: GitHub display name vs User.name in DB
    const dbName = user?.name ?? null;
    consistency.push(makeRow("name", null, dbName));

    // Bio: GitHub bio vs no DB bio field — note as informational
    consistency.push(makeRow("bio", githubData.bio, null));

    // Website: GitHub blog field vs ExternalLink of type OTHER
    const websiteLink = externalLinks.find((l) => l.type === "OTHER");
    consistency.push(makeRow("website / blog", githubData.blog, websiteLink?.url ?? null));

    // Twitter: GitHub twitter_username vs ExternalLink of type TWITTER
    const twitterLink = externalLinks.find((l) => l.type === "TWITTER");
    const ghTwitterUrl = githubData.twitter_username
      ? `https://twitter.com/${githubData.twitter_username}`
      : null;
    consistency.push(makeRow("twitter / X", ghTwitterUrl, twitterLink?.url ?? null));

    // LinkedIn: ExternalLink of type LINKEDIN (no GitHub equivalent — show db only)
    const linkedinLink = externalLinks.find((l) => l.type === "LINKEDIN");
    if (linkedinLink) {
      consistency.push(makeRow("linkedin", null, linkedinLink.url));
    }

    // Filter rows where both sides are null/empty to reduce noise
    consistency = consistency.filter(
      (r) => r.githubValue !== null || r.dbValue !== null
    );
  } catch {
    // DB unavailable — return empty
  }

  return { consistency, dbExperienceCount };
}

export async function runPlatformSync(): Promise<AgentRunResult> {
  // PS-C: Make Twitter optional — only fetch if token is set
  let twitterData: Awaited<ReturnType<typeof fetchTwitterProfile>> = null;
  const githubData = await fetchGitHubProfile();

  if (process.env.TWITTER_BEARER_TOKEN) {
    twitterData = await fetchTwitterProfile().catch(() => null);
  }

  const { consistency: profileConsistency, dbExperienceCount } =
    await buildProfileConsistency(githubData);

  const sections: string[] = [];
  const sources: string[] = [];
  const configuredPlatforms: string[] = [];

  // GitHub section
  if (process.env.GITHUB_USERNAME) {
    if (githubData) {
      configuredPlatforms.push("github");
      sources.push(`https://github.com/${process.env.GITHUB_USERNAME}`);

      const twitterHandle = githubData.twitter_username
        ? `\n**X/Twitter:** @${githubData.twitter_username}`
        : "";

      sections.push(
        [
          "## GitHub Profile",
          `**Bio:** ${githubData.bio ?? "_Not set_"}`,
          `**Location:** ${githubData.location ?? "_Not set_"}`,
          `**Public repos:** ${githubData.public_repos}`,
          `**Followers:** ${githubData.followers}`,
          twitterHandle,
        ]
          .filter(Boolean)
          .join("\n")
      );
    } else {
      sections.push("## GitHub Profile\n_Failed to fetch profile data — check GITHUB_USERNAME and GITHUB_TOKEN._");
    }
  } else {
    sections.push("## GitHub Profile\n_Not configured — add GITHUB_USERNAME to .env_");
  }

  // PS-B: Profile consistency section in markdown
  if (profileConsistency.length > 0) {
    const rows = profileConsistency.map((r) => {
      const statusEmoji =
        r.status === "match" ? "✓" : r.status === "mismatch" ? "!" : "–";
      return `| ${r.field} | ${r.githubValue ?? "_not set_"} | ${r.dbValue ?? "_not set_"} | ${statusEmoji} ${r.status} |`;
    });
    sections.push(
      [
        "## Profile Consistency",
        "",
        "| Field | GitHub | DB value | Status |",
        "|-------|--------|----------|--------|",
        ...rows,
      ].join("\n")
    );
  }

  // PS-A: LinkedIn cross-reference note
  sections.push(
    [
      "## LinkedIn Cross-Reference",
      `**DB experience entries:** ${dbExperienceCount}`,
      "",
      "_LinkedIn cross-reference: run the LinkedIn CSV import in the admin panel to compare against your DB experience entries._",
    ].join("\n")
  );

  // PS-C: X / Twitter section — show "not configured" when no token
  if (process.env.TWITTER_BEARER_TOKEN) {
    if (twitterData) {
      configuredPlatforms.push("twitter");
      sources.push(`https://x.com/${twitterData.username}`);

      const tweetLines =
        twitterData.recentTweets.length > 0
          ? twitterData.recentTweets.map((t) => `- ${t.slice(0, 120)}${t.length > 120 ? "…" : ""}`).join("\n")
          : "_No recent tweets found._";

      sections.push(
        [
          "## X / Twitter",
          `**Followers:** ${twitterData.followerCount}`,
          `**Bio:** ${twitterData.bio || "_Not set_"}`,
          twitterData.location ? `**Location:** ${twitterData.location}` : "",
          "",
          "### Recent Tweets (topics)",
          tweetLines,
        ]
          .filter((l) => l !== undefined)
          .join("\n")
      );
    } else {
      sections.push("## X / Twitter\n_Failed to fetch profile data — check TWITTER_BEARER_TOKEN and TWITTER_USERNAME._");
    }
  } else {
    sections.push("## X / Twitter\n_Not configured — set TWITTER_BEARER_TOKEN to enable._");
  }

  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const rawData: PlatformSyncRawData = {
    github: githubData ?? null,
    twitter: twitterData ?? null,
    configuredPlatforms,
    profileConsistency,
    dbExperienceCount,
  };

  return {
    title: `Platform Sync — ${monthYear}`,
    summary: sections.join("\n\n"),
    sources,
    rawData,
  };
}
