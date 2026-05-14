import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { AgentRunResult } from '../types'

// ─── Global fetch mock ────────────────────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// ─── Anthropic mock — throw so agents use their fallback paths ────────────────

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn(() => ({
    messages: {
      create: vi.fn().mockRejectedValue(new Error('Anthropic mocked out')),
    },
  })),
}))

// ─── Prisma mock — used by static imports (github-summarizer, blog-suggester) ─

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findMany: vi.fn().mockResolvedValue([]) },
    post: { findMany: vi.fn().mockResolvedValue([]) },
    skill: { findMany: vi.fn().mockResolvedValue([]) },
    user: { findFirst: vi.fn().mockResolvedValue(null) },
    externalLink: { findMany: vi.fn().mockResolvedValue([]) },
    experience: { findMany: vi.fn().mockResolvedValue([]) },
    agent: {
      findFirst: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns a minimal fetch response for any URL. */
function okJsonResponse(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

function okTextResponse(body: string) {
  return Promise.resolve(
    new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  )
}

/** Asserts a value satisfies the AgentRunResult contract. */
function expectValidRunResult(result: unknown) {
  expect(result).toBeDefined()
  const r = result as AgentRunResult
  expect(typeof r.title).toBe('string')
  expect(r.title.length).toBeGreaterThan(0)
  expect(typeof r.summary).toBe('string')
  expect(Array.isArray(r.sources)).toBe(true)
  // rawData may be null or an object — not a primitive string/number
  if (r.rawData !== null) {
    expect(typeof r.rawData).not.toBe('string')
    expect(typeof r.rawData).not.toBe('number')
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Agent runner smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: every fetch returns an empty successful response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('github.com') && url.includes('/repos')) {
        return okJsonResponse([])
      }
      if (url.includes('api.github.com/users')) {
        return okJsonResponse({
          bio: null,
          location: null,
          blog: null,
          twitter_username: null,
          public_repos: 0,
          followers: 0,
        })
      }
      if (url.includes('dev.to')) {
        return okJsonResponse([])
      }
      if (url.includes('hn.algolia.com')) {
        return okJsonResponse({ hits: [] })
      }
      // RSS feeds and anything else
      return okTextResponse('<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>')
    })
  })

  afterEach(() => {
    delete process.env.GITHUB_USERNAME
    delete process.env.GITHUB_TOKEN
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.GOOGLE_ALERTS_RSS_FEEDS
    delete process.env.TWITTER_BEARER_TOKEN
  })

  // ── Blog Suggester ───────────────────────────────────────────────────────────

  describe('runBlogSuggester', () => {
    it('returns a valid AgentRunResult shape', async () => {
      const { runBlogSuggester } = await import('../blog-suggester')
      const result = await runBlogSuggester()
      expectValidRunResult(result)
    })

    it('uses fallback suggestions when Anthropic is unavailable', async () => {
      const { runBlogSuggester } = await import('../blog-suggester')
      const result = await runBlogSuggester()
      expect(result.summary).toContain('Blog Topic Suggestions')
    })

    it('rawData contains a suggestions array', async () => {
      const { runBlogSuggester } = await import('../blog-suggester')
      const result = await runBlogSuggester()
      const rd = result.rawData as { suggestions?: unknown[] }
      expect(Array.isArray(rd.suggestions)).toBe(true)
    })
  })

  // ── Brand Monitor ────────────────────────────────────────────────────────────

  describe('runBrandMonitor', () => {
    it('returns a valid AgentRunResult shape', async () => {
      const { runBrandMonitor } = await import('../brand-monitor')
      const result = await runBrandMonitor()
      expectValidRunResult(result)
    })

    it('rawData contains githubDelta, googleAlerts, devToMentions arrays', async () => {
      const { runBrandMonitor } = await import('../brand-monitor')
      const result = await runBrandMonitor()
      const rd = result.rawData as {
        githubDelta?: unknown[]
        googleAlerts?: unknown[]
        devToMentions?: unknown[]
      }
      expect(Array.isArray(rd.githubDelta)).toBe(true)
      expect(Array.isArray(rd.googleAlerts)).toBe(true)
      expect(Array.isArray(rd.devToMentions)).toBe(true)
    })

    it('summary contains brand monitor content', async () => {
      const { runBrandMonitor } = await import('../brand-monitor')
      const result = await runBrandMonitor()
      expect(result.summary).toContain('Brand Monitor')
    })
  })

  // ── Robotics News ────────────────────────────────────────────────────────────

  describe('runRoboticsNews', () => {
    it('returns a valid AgentRunResult shape', async () => {
      const { runRoboticsNews } = await import('../robotics-news')
      const result = await runRoboticsNews()
      expectValidRunResult(result)
    })

    it('rawData.type is ROBOTICS_DIGEST', async () => {
      const { runRoboticsNews } = await import('../robotics-news')
      const result = await runRoboticsNews()
      const rd = result.rawData as { type?: string }
      expect(rd.type).toBe('ROBOTICS_DIGEST')
    })

    it('rawData contains newItemCount and seenCount', async () => {
      const { runRoboticsNews } = await import('../robotics-news')
      const result = await runRoboticsNews()
      const rd = result.rawData as { newItemCount?: number; seenCount?: number }
      expect(typeof rd.newItemCount).toBe('number')
      expect(typeof rd.seenCount).toBe('number')
    })
  })

  // ── Platform Sync ────────────────────────────────────────────────────────────

  describe('runPlatformSync', () => {
    it('returns a valid AgentRunResult shape', async () => {
      const { runPlatformSync } = await import('../platform-sync')
      const result = await runPlatformSync()
      expectValidRunResult(result)
    })

    it('rawData contains configuredPlatforms array', async () => {
      const { runPlatformSync } = await import('../platform-sync')
      const result = await runPlatformSync()
      const rd = result.rawData as { configuredPlatforms?: unknown[] }
      expect(Array.isArray(rd.configuredPlatforms)).toBe(true)
    })
  })

  // ── GitHub Summarizer ────────────────────────────────────────────────────────
  // GITHUB_USERNAME is captured as a module-level constant at evaluation time,
  // so the happy path requires env var set before first module import.
  // We test the guard that protects against a missing username.

  describe('runGithubSummarizer', () => {
    it('throws when GITHUB_USERNAME is not set', async () => {
      const { runGithubSummarizer } = await import('../github-summarizer')
      // The module-level constant will be "" since env var is not set here
      await expect(runGithubSummarizer()).rejects.toThrow(/GITHUB_USERNAME/)
    })
  })
})
