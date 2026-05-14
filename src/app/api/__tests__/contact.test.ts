import { vi, describe, it, expect, beforeEach } from 'vitest'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockCheckRateLimit = vi.hoisted(() => vi.fn<() => boolean>())
const mockResendSend = vi.hoisted(() => vi.fn())

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: mockCheckRateLimit }))

vi.mock('resend', () => ({
  Resend: vi.fn(function ResendMock() {
    return { emails: { send: mockResendSend } }
  }),
}))

// ─── Import after mocks ───────────────────────────────────────────────────────

import { POST } from '../contact/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>, ip = '1.2.3.4') {
  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = { name: 'Alice', email: 'alice@example.com', message: 'Hello there' }

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: rate limit passes, no RESEND_API_KEY (mock mode)
    mockCheckRateLimit.mockReturnValue(true)
    delete process.env.RESEND_API_KEY
  })

  // ── Rate limiting ────────────────────────────────────────────────────────────

  describe('429 — rate limit exceeded', () => {
    it('returns 429 when checkRateLimit returns false', async () => {
      mockCheckRateLimit.mockReturnValue(false)

      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(429)
    })

    it('response body contains "Rate limit" message', async () => {
      mockCheckRateLimit.mockReturnValue(false)

      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])
      const body = await res.json() as { error: string }

      expect(body.error).toMatch(/rate limit/i)
    })
  })

  // ── Honeypot ─────────────────────────────────────────────────────────────────

  describe('200 — honeypot filled (silent reject)', () => {
    it('returns 200 when honeypot field is present', async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, honeypot: 'bot-value' }) as Parameters<typeof POST>[0]
      )

      expect(res.status).toBe(200)
    })

    it('returns success:true when honeypot is filled', async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, honeypot: 'bot-value' }) as Parameters<typeof POST>[0]
      )
      const body = await res.json() as { success: boolean }

      expect(body.success).toBe(true)
    })
  })

  // ── Validation ───────────────────────────────────────────────────────────────

  describe('400 — invalid form data', () => {
    it('returns 400 when name is missing', async () => {
      const res = await POST(
        makeRequest({ email: 'alice@example.com', message: 'Hello' }) as Parameters<typeof POST>[0]
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 when email is missing', async () => {
      const res = await POST(
        makeRequest({ name: 'Alice', message: 'Hello' }) as Parameters<typeof POST>[0]
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 when message is missing', async () => {
      const res = await POST(
        makeRequest({ name: 'Alice', email: 'alice@example.com' }) as Parameters<typeof POST>[0]
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 when email format is invalid', async () => {
      const res = await POST(
        makeRequest({ name: 'Alice', email: 'not-an-email', message: 'Hello' }) as Parameters<typeof POST>[0]
      )

      expect(res.status).toBe(400)
    })

    it('returns 400 when message is whitespace only', async () => {
      const res = await POST(
        makeRequest({ name: 'Alice', email: 'alice@example.com', message: '   ' }) as Parameters<typeof POST>[0]
      )

      expect(res.status).toBe(400)
    })
  })

  // ── Mock mode (no RESEND_API_KEY) ─────────────────────────────────────────────

  describe('200 — mock mode (RESEND_API_KEY absent)', () => {
    it('returns 200 for a valid submission without RESEND_API_KEY', async () => {
      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(200)
    })

    it('returns success:true in mock mode', async () => {
      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])
      const body = await res.json() as { success: boolean }

      expect(body.success).toBe(true)
    })

    it('does not call Resend when RESEND_API_KEY is absent', async () => {
      await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])

      expect(mockResendSend).not.toHaveBeenCalled()
    })
  })

  // ── Email delivery (RESEND_API_KEY set) ───────────────────────────────────────

  describe('200 — email delivery succeeds', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.CONTACT_EMAIL = 'owner@example.com'
      process.env.CONTACT_FROM_EMAIL = 'noreply@example.com'
      mockResendSend.mockResolvedValue({ id: 'email-id-123' })
    })

    it('returns 200 when Resend succeeds', async () => {
      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(200)
    })

    it('calls Resend.emails.send once for a valid submission', async () => {
      await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])

      expect(mockResendSend).toHaveBeenCalledOnce()
    })
  })

  // ── Email delivery failure ────────────────────────────────────────────────────

  describe('500 — Resend throws', () => {
    beforeEach(() => {
      process.env.RESEND_API_KEY = 'test-key'
      process.env.CONTACT_EMAIL = 'owner@example.com'
      process.env.CONTACT_FROM_EMAIL = 'noreply@example.com'
      mockResendSend.mockRejectedValue(new Error('Resend API error'))
    })

    it('returns 500 when Resend throws', async () => {
      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(500)
    })

    it('response body contains error message', async () => {
      const res = await POST(makeRequest(VALID_BODY) as Parameters<typeof POST>[0])
      const body = await res.json() as { error: string }

      expect(body).toHaveProperty('error')
      expect(typeof body.error).toBe('string')
    })
  })

  // ── Invalid JSON body ─────────────────────────────────────────────────────────

  describe('400 — malformed body', () => {
    it('returns 400 when body is not valid JSON', async () => {
      const req = new Request('http://localhost/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
        body: 'not-json',
      })

      const res = await POST(req as Parameters<typeof POST>[0])

      expect(res.status).toBe(400)
    })
  })
})
