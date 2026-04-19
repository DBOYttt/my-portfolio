import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

// ─── Hoisted mock functions ───────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn<() => Promise<Session | null>>())

const mockAgentUpdateMany = vi.hoisted(() => vi.fn())
const mockAgentFindUnique = vi.hoisted(() => vi.fn())
const mockAgentUpdate = vi.hoisted(() => vi.fn())
const mockAgentReportCreate = vi.hoisted(() => vi.fn())

const mockRunner = vi.hoisted(() => vi.fn())

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/auth', () => ({ auth: mockAuth }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    agent: {
      updateMany: mockAgentUpdateMany,
      update: mockAgentUpdate,
      findUnique: mockAgentFindUnique,
    },
    agentReport: {
      create: mockAgentReportCreate,
    },
  },
}))

vi.mock('@/lib/agents', () => ({
  AGENT_RUNNERS: {
    GITHUB_SUMMARIZER: mockRunner,
  },
}))

// ─── Import after mocks are registered ────────────────────────────────────────

import { POST } from '../admin/agents/[id]/run/route'

// ─── Helper to build a Next.js-compatible Request ─────────────────────────────

function makeRequest(id: string): [Request, { params: { id: string } }] {
  const req = new Request(`http://localhost/api/admin/agents/${id}/run`, {
    method: 'POST',
  })
  return [req, { params: { id } }]
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_SESSION: Session = { user: { email: 'admin@test.com' }, expires: '2099-01-01' }

const ENABLED_AGENT = {
  id: 'agent-github-summarizer',
  type: 'GITHUB_SUMMARIZER',
  enabled: true,
  status: 'idle',
  config: null,
}

const VALID_RUNNER_RESULT = {
  title: 'Test Report',
  summary: 'Summary text',
  sources: ['https://github.com/example'],
  rawData: { type: 'GITHUB_AUDIT' },
}

const CREATED_REPORT = {
  id: 'report-abc-123',
  agentId: ENABLED_AGENT.id,
  title: VALID_RUNNER_RESULT.title,
  summary: VALID_RUNNER_RESULT.summary,
  sources: VALID_RUNNER_RESULT.sources,
  rawData: VALID_RUNNER_RESULT.rawData,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/agents/[id]/run', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Auth guard ──────────────────────────────────────────────────────────────

  describe('401 — no session', () => {
    it('returns 401 when auth() returns null', async () => {
      mockAuth.mockResolvedValue(null)

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)

      expect(res.status).toBe(401)
    })

    it('401 response body contains an "error" key', async () => {
      mockAuth.mockResolvedValue(null)

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { error: string }

      expect(body).toHaveProperty('error')
      expect(typeof body.error).toBe('string')
    })

    it('does not call prisma when session is missing', async () => {
      mockAuth.mockResolvedValue(null)

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockAgentFindUnique).not.toHaveBeenCalled()
      expect(mockAgentUpdateMany).not.toHaveBeenCalled()
    })
  })

  // ── 404 — agent not found ───────────────────────────────────────────────────

  describe('404 — agent not found', () => {
    it('returns 404 when agent does not exist', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(null)

      const [req, ctx] = makeRequest('nonexistent-id')
      const res = await POST(req, ctx)

      expect(res.status).toBe(404)
    })

    it('404 response body contains "Agent not found"', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(null)

      const [req, ctx] = makeRequest('nonexistent-id')
      const res = await POST(req, ctx)
      const body = await res.json() as { error: string }

      expect(body.error).toMatch(/not found/i)
    })
  })

  // ── 400 — agent disabled ────────────────────────────────────────────────────

  describe('400 — agent disabled', () => {
    it('returns 400 when agent.enabled is false', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue({ ...ENABLED_AGENT, enabled: false })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)

      expect(res.status).toBe(400)
    })

    it('400 response body contains "disabled"', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue({ ...ENABLED_AGENT, enabled: false })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { error: string }

      expect(body.error).toMatch(/disabled/i)
    })

    it('does not attempt lock acquisition when agent is disabled', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue({ ...ENABLED_AGENT, enabled: false })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockAgentUpdateMany).not.toHaveBeenCalled()
    })
  })

  // ── 400 — no runner ─────────────────────────────────────────────────────────

  describe('400 — no runner registered', () => {
    it('returns 400 when agent type has no registered runner', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue({ ...ENABLED_AGENT, type: 'BRAND_MONITOR' })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)

      expect(res.status).toBe(400)
    })

    it('400 response body mentions missing runner', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue({ ...ENABLED_AGENT, type: 'BRAND_MONITOR' })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { error: string }

      expect(body.error).toMatch(/runner/i)
    })
  })

  // ── 409 — concurrent lock ────────────────────────────────────────────────────

  describe('409 — concurrent lock', () => {
    it('returns 409 when the atomic updateMany returns count=0', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 0 })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)

      expect(res.status).toBe(409)
    })

    it('409 response body contains "already running"', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 0 })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { error: string }

      expect(body.error).toMatch(/already running/i)
    })

    it('does not invoke runner when lock is not acquired', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 0 })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockRunner).not.toHaveBeenCalled()
    })
  })

  // ── 200 — happy path ─────────────────────────────────────────────────────────

  describe('200 — successful run', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 1 })
      mockRunner.mockResolvedValue(VALID_RUNNER_RESULT)
      mockAgentReportCreate.mockResolvedValue(CREATED_REPORT)
      mockAgentUpdate.mockResolvedValue({ ...ENABLED_AGENT, status: 'idle' })
    })

    it('returns 200 when lock is acquired and runner succeeds', async () => {
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)

      expect(res.status).toBe(200)
    })

    it('response body contains ok=true', async () => {
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { ok: boolean; title: string; rawData: unknown; reportId: string }

      expect(body.ok).toBe(true)
    })

    it('response body includes title from runner result', async () => {
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { ok: boolean; title: string; rawData: unknown; reportId: string }

      expect(body.title).toBe(VALID_RUNNER_RESULT.title)
    })

    it('response body includes reportId from created report', async () => {
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { ok: boolean; title: string; rawData: unknown; reportId: string }

      expect(body.reportId).toBe(CREATED_REPORT.id)
    })

    it('agentReport.create is called with runner result data', async () => {
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockAgentReportCreate).toHaveBeenCalledOnce()
      const callArg = mockAgentReportCreate.mock.calls[0][0] as {
        data: { agentId: string; title: string; summary: string }
      }
      expect(callArg.data.agentId).toBe(ENABLED_AGENT.id)
      expect(callArg.data.title).toBe(VALID_RUNNER_RESULT.title)
      expect(callArg.data.summary).toBe(VALID_RUNNER_RESULT.summary)
    })

    it('agent status is reset to idle after successful run', async () => {
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockAgentUpdate).toHaveBeenCalledOnce()
      const callArg = mockAgentUpdate.mock.calls[0][0] as {
        where: { id: string }
        data: { status: string }
      }
      expect(callArg.where.id).toBe(ENABLED_AGENT.id)
      expect(callArg.data.status).toBe('idle')
    })

    it('persists _updatedConfig when runner returns one', async () => {
      const updatedConfig = { seenUrls: ['https://example.com'] }
      mockRunner.mockResolvedValue({ ...VALID_RUNNER_RESULT, _updatedConfig: updatedConfig })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockAgentUpdate).toHaveBeenCalledOnce()
      const callArg = mockAgentUpdate.mock.calls[0][0] as {
        data: { config?: Record<string, unknown> }
      }
      expect(callArg.data.config).toEqual(updatedConfig)
    })

    it('does not include config key when runner does not return _updatedConfig', async () => {
      // VALID_RUNNER_RESULT has no _updatedConfig
      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      const callArg = mockAgentUpdate.mock.calls[0][0] as {
        data: Record<string, unknown>
      }
      expect(callArg.data).not.toHaveProperty('config')
    })
  })

  // ── 500 — runner throws ──────────────────────────────────────────────────────

  describe('500 — runner throws', () => {
    it('returns 500 when runner throws an Error', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 1 })
      mockRunner.mockRejectedValue(new Error('Network failure'))
      mockAgentUpdate.mockResolvedValue({ ...ENABLED_AGENT, status: 'error' })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)

      expect(res.status).toBe(500)
    })

    it('500 response body contains the error message', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 1 })
      mockRunner.mockRejectedValue(new Error('Network failure'))
      mockAgentUpdate.mockResolvedValue({ ...ENABLED_AGENT, status: 'error' })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      const res = await POST(req, ctx)
      const body = await res.json() as { error: string }

      expect(body.error).toContain('Network failure')
    })

    it('agent status is set to error when runner throws', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 1 })
      mockRunner.mockRejectedValue(new Error('Boom'))
      mockAgentUpdate.mockResolvedValue({ ...ENABLED_AGENT, status: 'error' })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      expect(mockAgentUpdate).toHaveBeenCalledOnce()
      const callArg = mockAgentUpdate.mock.calls[0][0] as {
        data: { status: string; lastError: string }
      }
      expect(callArg.data.status).toBe('error')
      expect(callArg.data.lastError).toBe('Boom')
    })

    it('sets lastError to string representation when non-Error is thrown', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockAgentFindUnique.mockResolvedValue(ENABLED_AGENT)
      mockAgentUpdateMany.mockResolvedValue({ count: 1 })
      mockRunner.mockRejectedValue('plain string error')
      mockAgentUpdate.mockResolvedValue({ ...ENABLED_AGENT, status: 'error' })

      const [req, ctx] = makeRequest(ENABLED_AGENT.id)
      await POST(req, ctx)

      const callArg = mockAgentUpdate.mock.calls[0][0] as {
        data: { lastError: string }
      }
      expect(callArg.data.lastError).toBe('plain string error')
    })
  })
})
