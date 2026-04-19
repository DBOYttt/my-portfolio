import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { computeReadTime, isMock } from '../data'

describe('computeReadTime', () => {
  it('returns empty string for empty input', () => {
    expect(computeReadTime('')).toBe('')
  })

  it('returns empty string for null', () => {
    expect(computeReadTime(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(computeReadTime(undefined)).toBe('')
  })

  it('returns "1 min" for a single word', () => {
    expect(computeReadTime('word')).toBe('1 min')
  })

  it('returns "2 min" for 400 words at 200 wpm', () => {
    expect(computeReadTime('word '.repeat(400))).toBe('2 min')
  })

  it('returns "1 min" for 200 words', () => {
    expect(computeReadTime('word '.repeat(200))).toBe('1 min')
  })
})

describe('isMock', () => {
  const originalEnv = process.env.DATABASE_URL

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalEnv
    }
  })

  it('returns true when DATABASE_URL is undefined', () => {
    delete process.env.DATABASE_URL
    expect(isMock()).toBe(true)
  })

  it('returns true when DATABASE_URL starts with prisma+postgres://', () => {
    process.env.DATABASE_URL = 'prisma+postgres://example.com/db'
    expect(isMock()).toBe(true)
  })

  it('returns false when DATABASE_URL is a real postgres:// connection string', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db'
    expect(isMock()).toBe(false)
  })
})
