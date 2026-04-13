import type { AgentRunResult } from "./types";

export async function runBrandMonitor(): Promise<AgentRunResult> {
  const hasApiKey = Boolean(process.env.BRAND_MONITOR_API_KEY);

  const summary = `## Brand Monitor

This agent is a stub — no external API is currently configured.

### Current Status

${hasApiKey ? "BRAND_MONITOR_API_KEY is set, but the fetch logic has not been implemented yet." : "BRAND_MONITOR_API_KEY is not set."}

### How to Enable

1. Choose a monitoring service:
   - **Mention.com** — Tracks mentions across web, news, blogs, and social media. Provides a REST API.
   - **Google Alerts RSS** — Free. Set up alerts at [google.com/alerts](https://www.google.com/alerts) and subscribe to the RSS feed URL.
   - **Brand24** — Paid service with a developer API for real-time mention tracking.

2. Add your API key or RSS feed URL to \`.env\`:
   \`\`\`
   BRAND_MONITOR_API_KEY=your_key_here
   \`\`\`
   Also add it to \`.env.example\` (without the value).

3. Implement the fetch logic in \`src/lib/agents/brand-monitor.ts\` — replace this stub with a real API call to retrieve mentions, filter them, and optionally pass them to Claude for sentiment analysis.

### Suggested Keywords to Monitor
- Your full name
- Your GitHub username
- Names of your notable open-source projects`;

  return {
    title: `Brand Monitor — ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`,
    summary,
    sources: [],
    rawData: { stub: true, hasApiKey },
  };
}
