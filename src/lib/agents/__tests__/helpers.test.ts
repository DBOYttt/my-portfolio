/**
 * Smoke tests for exported pure-function helpers in the agents layer.
 *
 * What is tested here:
 *   - normaliseCategoryEnum (skills-inference) — edge cases not covered in
 *     skills-inference.test.ts (empty string, lowercase, whitespace prefix)
 *   - ReadmeScore / scoreReadme — the function is module-private (not exported),
 *     so only the exported ReadmeScore interface shape is verified structurally.
 *   - classifyActivity (github-summarizer) — the function is module-private (not
 *     exported), so only the exported ActivityLevel union type is verified.
 *   - DigestItem / RoboticsDigestRawData (robotics-news) — exported interface
 *     structural checks.
 *
 * Functions that are module-private (scoreReadme, classifyActivity, parseXmlItems,
 * stripHtml) are intentionally skipped — they cannot be imported without modifying
 * production files.
 */

import { describe, it, expect } from 'vitest'
import { normaliseCategoryEnum } from '../skills-inference'
import type { ActivityLevel } from '../github-summarizer'
import type { ReadmeScore } from '../github-project-importer'
import type { DigestItem, RoboticsDigestRawData } from '../robotics-news'

// ─── normaliseCategoryEnum — edge cases ───────────────────────────────────────

describe('normaliseCategoryEnum — edge cases', () => {
  it('returns OTHER for an empty string (fallback path)', () => {
    expect(normaliseCategoryEnum('')).toBe('OTHER')
  })

  it('returns OTHER for a lowercase "language" (not in the map)', () => {
    // The map keys are UPPER_CASE; lowercase input is a different key → fallback
    expect(normaliseCategoryEnum('language')).toBe('OTHER')
  })

  it('returns OTHER for a lowercase "framework"', () => {
    expect(normaliseCategoryEnum('framework')).toBe('OTHER')
  })

  it('returns OTHER for a numeric-looking string', () => {
    expect(normaliseCategoryEnum('123')).toBe('OTHER')
  })

  it('returns OTHER for whitespace-only string', () => {
    expect(normaliseCategoryEnum('  ')).toBe('OTHER')
  })

  it('returns OTHER for a mixed-case string like "Language"', () => {
    expect(normaliseCategoryEnum('Language')).toBe('OTHER')
  })

  it('is deterministic — same input always produces same output', () => {
    const a = normaliseCategoryEnum('LANGUAGE')
    const b = normaliseCategoryEnum('LANGUAGE')
    expect(a).toBe(b)
  })

  it('covers all seven documented input keys without throwing', () => {
    const inputs = ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'TOOL', 'ROBOTICS', 'EMBEDDED', 'OTHER']
    for (const input of inputs) {
      expect(() => normaliseCategoryEnum(input)).not.toThrow()
    }
  })
})

// ─── ActivityLevel — exported type exhaustiveness ─────────────────────────────

describe('ActivityLevel — exported type', () => {
  it('accepts "active" as a valid ActivityLevel', () => {
    const level: ActivityLevel = 'active'
    expect(level).toBe('active')
  })

  it('accepts "recent" as a valid ActivityLevel', () => {
    const level: ActivityLevel = 'recent'
    expect(level).toBe('recent')
  })

  it('accepts "dormant" as a valid ActivityLevel', () => {
    const level: ActivityLevel = 'dormant'
    expect(level).toBe('dormant')
  })
})

// ─── ReadmeScore — exported interface structural check ────────────────────────

describe('ReadmeScore — exported interface shape', () => {
  it('accepts a score=0 result with a note', () => {
    const result: ReadmeScore = { score: 0, note: 'README is thin.' }
    expect(result.score).toBe(0)
    expect(typeof result.note).toBe('string')
  })

  it('accepts a score=5 result with note=null', () => {
    const result: ReadmeScore = { score: 5, note: null }
    expect(result.score).toBe(5)
    expect(result.note).toBeNull()
  })

  it('score is a number', () => {
    const result: ReadmeScore = { score: 3, note: null }
    expect(typeof result.score).toBe('number')
  })
})

// ─── DigestItem & RoboticsDigestRawData — exported interface structural checks ─

describe('DigestItem — exported interface shape', () => {
  it('accepts an item with title, url and why', () => {
    const item: DigestItem = {
      title: 'Boston Dynamics Ships New Model',
      url: 'https://spectrum.ieee.org/article',
      why: 'Signals increased demand for humanoid robotics engineers.',
    }
    expect(item.title).toBeTruthy()
    expect(item.url).toMatch(/^https?:\/\//)
    expect(typeof item.why).toBe('string')
  })
})

describe('RoboticsDigestRawData — exported interface shape', () => {
  it('accepts a complete rawData structure', () => {
    const raw: RoboticsDigestRawData = {
      type: 'ROBOTICS_DIGEST',
      digest: [
        { title: 'Article 1', url: 'https://example.com/1', why: 'Important.' },
      ],
      digestError: null,
      rawItems: [{ title: 'Article 1', url: 'https://example.com/1', source: 'IEEE Spectrum' }],
      newItemCount: 1,
      seenCount: 5,
    }
    expect(raw.type).toBe('ROBOTICS_DIGEST')
    expect(raw.digest).toHaveLength(1)
    expect(raw.rawItems).toHaveLength(1)
    expect(raw.newItemCount).toBe(1)
    expect(raw.seenCount).toBe(5)
  })

  it('accepts an empty digest', () => {
    const raw: RoboticsDigestRawData = {
      type: 'ROBOTICS_DIGEST',
      digest: [],
      digestError: null,
      rawItems: [],
      newItemCount: 0,
      seenCount: 10,
    }
    expect(raw.digest).toHaveLength(0)
    expect(raw.newItemCount).toBe(0)
  })
})
