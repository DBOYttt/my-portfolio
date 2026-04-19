import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit } from '../rate-limit'

const LIMIT = 5
const WINDOW_MS = 60_000 // 1 minute for tests

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first 5 calls within the window', () => {
    const ip = 'test-ip-1'
    for (let i = 0; i < LIMIT; i++) {
      expect(checkRateLimit(ip, LIMIT, WINDOW_MS)).toBe(true)
    }
  })

  it('blocks the 6th call within the window', () => {
    const ip = 'test-ip-2'
    for (let i = 0; i < LIMIT; i++) {
      checkRateLimit(ip, LIMIT, WINDOW_MS)
    }
    expect(checkRateLimit(ip, LIMIT, WINDOW_MS)).toBe(false)
  })

  it('allows a new call after the window expires', () => {
    const ip = 'test-ip-3'
    for (let i = 0; i < LIMIT; i++) {
      checkRateLimit(ip, LIMIT, WINDOW_MS)
    }
    // Blocked now
    expect(checkRateLimit(ip, LIMIT, WINDOW_MS)).toBe(false)
    // Advance past the window
    vi.advanceTimersByTime(WINDOW_MS + 1)
    // Should be allowed again
    expect(checkRateLimit(ip, LIMIT, WINDOW_MS)).toBe(true)
  })

  it('tracks different IPs independently', () => {
    const ipA = 'test-ip-4a'
    const ipB = 'test-ip-4b'

    for (let i = 0; i < LIMIT; i++) {
      checkRateLimit(ipA, LIMIT, WINDOW_MS)
    }
    // ipA is blocked
    expect(checkRateLimit(ipA, LIMIT, WINDOW_MS)).toBe(false)
    // ipB is still allowed
    expect(checkRateLimit(ipB, LIMIT, WINDOW_MS)).toBe(true)
  })
})
