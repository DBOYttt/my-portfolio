import type { AgentRunResult } from "./types";
import { fetchGitHubProfile } from "./github-summarizer";
import { fetchTwitterProfile } from "./twitter-profile";

export async function runPlatformSync(): Promise<AgentRunResult> {
  const [githubData, twitterData] = await Promise.all([
    fetchGitHubProfile(),
    fetchTwitterProfile(),
  ]);

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

  // X / Twitter section
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
    sections.push("## X / Twitter\n_Not configured — add TWITTER_BEARER_TOKEN to .env_");
  }

  const monthYear = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return {
    title: `Platform Sync — ${monthYear}`,
    summary: sections.join("\n\n"),
    sources,
    rawData: {
      github: githubData ?? null,
      twitter: twitterData ?? null,
      configuredPlatforms,
    },
  };
}
