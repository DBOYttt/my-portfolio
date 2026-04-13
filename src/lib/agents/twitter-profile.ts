export interface TwitterProfileResult {
  username: string;
  bio: string;
  location: string;
  followerCount: number;
  recentTweets: string[];
}

interface TwitterUserResponse {
  data?: {
    id: string;
    name: string;
    description?: string;
    location?: string;
    public_metrics?: {
      followers_count?: number;
    };
  };
}

interface TwitterTweetsResponse {
  data?: Array<{ text: string }>;
}

export async function fetchTwitterProfile(): Promise<TwitterProfileResult | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  const username = process.env.TWITTER_USERNAME;

  if (!bearerToken || !username) return null;

  try {
    const userRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,public_metrics,location`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );

    if (!userRes.ok) return null;

    const userData = (await userRes.json()) as TwitterUserResponse;
    const user = userData.data;
    if (!user) return null;

    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${user.id}/tweets?max_results=10&tweet.fields=text`,
      { headers: { Authorization: `Bearer ${bearerToken}` } }
    );

    let recentTweets: string[] = [];
    if (tweetsRes.ok) {
      const tweetsData = (await tweetsRes.json()) as TwitterTweetsResponse;
      recentTweets = (tweetsData.data ?? []).map((t) => t.text);
    }

    return {
      username,
      bio: user.description ?? "",
      location: user.location ?? "",
      followerCount: user.public_metrics?.followers_count ?? 0,
      recentTweets,
    };
  } catch {
    return null;
  }
}
