import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const mockAuth = vi.hoisted(() => vi.fn<() => Promise<Session | null>>())

const mockPostCreate = vi.hoisted(() => vi.fn())
const mockPostFindUnique = vi.hoisted(() => vi.fn())
const mockPostDelete = vi.hoisted(() => vi.fn())
const mockTagUpsert = vi.hoisted(() => vi.fn())
const mockAuditLogCreate = vi.hoisted(() => vi.fn())

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/auth', () => ({ auth: mockAuth }))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: {
      create: mockPostCreate,
      findUnique: mockPostFindUnique,
      delete: mockPostDelete,
    },
    tag: {
      upsert: mockTagUpsert,
    },
    auditLog: {
      create: mockAuditLogCreate,
    },
  },
}))

// ─── Import after mocks ───────────────────────────────────────────────────────

import { POST } from '../admin/posts/route'
import { DELETE } from '../admin/posts/[id]/route'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_SESSION: Session = { user: { email: 'admin@test.com' }, expires: '2099-01-01' }

const VALID_POST_BODY = {
  title: 'My Post',
  slug: 'my-post',
  content: '# Hello\nThis is content.',
  status: 'DRAFT',
}

const CREATED_POST = {
  id: 'post-abc-123',
  title: 'My Post',
  slug: 'my-post',
  content: '# Hello\nThis is content.',
  status: 'DRAFT',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const EXISTING_POST = {
  id: 'post-abc-123',
  title: 'My Post',
  slug: 'my-post',
  status: 'DRAFT',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/admin/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost/api/admin/posts/${id}`, {
    method: 'DELETE',
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditLogCreate.mockResolvedValue({})
  })

  describe('401 — unauthenticated', () => {
    it('returns 401 when session is absent', async () => {
      mockAuth.mockResolvedValue(null)

      const res = await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(401)
    })

    it('does not call prisma.post.create when unauthenticated', async () => {
      mockAuth.mockResolvedValue(null)

      await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])

      expect(mockPostCreate).not.toHaveBeenCalled()
    })
  })

  describe('400 — missing required fields', () => {
    beforeEach(() => mockAuth.mockResolvedValue(VALID_SESSION))

    it('returns 400 when title is missing', async () => {
      const body = { slug: 'my-post', content: 'text' }
      const res = await POST(makePostRequest(body) as Parameters<typeof POST>[0])

      expect(res.status).toBe(400)
    })

    it('returns 400 when slug is missing', async () => {
      const body = { title: 'Post', content: 'text' }
      const res = await POST(makePostRequest(body) as Parameters<typeof POST>[0])

      expect(res.status).toBe(400)
    })

    it('returns 400 when content is missing', async () => {
      const body = { title: 'Post', slug: 'my-post' }
      const res = await POST(makePostRequest(body) as Parameters<typeof POST>[0])

      expect(res.status).toBe(400)
    })
  })

  describe('201 — successful creation', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockPostCreate.mockResolvedValue(CREATED_POST)
    })

    it('returns 201 for a valid post', async () => {
      const res = await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(201)
    })

    it('response body includes the created post id', async () => {
      const res = await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])
      const body = await res.json() as { id: string }

      expect(body.id).toBe(CREATED_POST.id)
    })

    it('calls prisma.post.create once', async () => {
      await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])

      expect(mockPostCreate).toHaveBeenCalledOnce()
    })

    it('creates an audit log entry', async () => {
      await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])

      expect(mockAuditLogCreate).toHaveBeenCalledOnce()
      const callArg = mockAuditLogCreate.mock.calls[0][0] as {
        data: { action: string }
      }
      expect(callArg.data.action).toBe('CREATE_POST')
    })

    it('connects tags when provided', async () => {
      mockTagUpsert.mockResolvedValue({ id: 'tag-1' })

      const bodyWithTags = { ...VALID_POST_BODY, tags: ['typescript'] }
      await POST(makePostRequest(bodyWithTags) as Parameters<typeof POST>[0])

      expect(mockTagUpsert).toHaveBeenCalledOnce()
    })
  })

  describe('409 — slug conflict', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockPostCreate.mockRejectedValue({ code: 'P2002' })
    })

    it('returns 409 when a post with the same slug exists', async () => {
      const res = await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])

      expect(res.status).toBe(409)
    })

    it('response body mentions slug conflict', async () => {
      const res = await POST(makePostRequest(VALID_POST_BODY) as Parameters<typeof POST>[0])
      const body = await res.json() as { error: string }

      expect(body.error).toMatch(/slug/i)
    })
  })
})

// ─── DELETE /api/admin/posts/[id] ────────────────────────────────────────────

describe('DELETE /api/admin/posts/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuditLogCreate.mockResolvedValue({})
  })

  describe('401 — unauthenticated', () => {
    it('returns 401 when session is absent', async () => {
      mockAuth.mockResolvedValue(null)

      const [req, ctx] = [makeDeleteRequest('post-abc-123'), { params: { id: 'post-abc-123' } }]
      const res = await DELETE(req as Parameters<typeof DELETE>[0], ctx)

      expect(res.status).toBe(401)
    })
  })

  describe('404 — post not found', () => {
    it('returns 404 when post does not exist', async () => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockPostFindUnique.mockResolvedValue(null)

      const res = await DELETE(
        makeDeleteRequest('nonexistent-id') as Parameters<typeof DELETE>[0],
        { params: { id: 'nonexistent-id' } }
      )

      expect(res.status).toBe(404)
    })
  })

  describe('204 — successful deletion', () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(VALID_SESSION)
      mockPostFindUnique.mockResolvedValue(EXISTING_POST)
      mockPostDelete.mockResolvedValue(EXISTING_POST)
    })

    it('returns 204 for a successful delete', async () => {
      const res = await DELETE(
        makeDeleteRequest(EXISTING_POST.id) as Parameters<typeof DELETE>[0],
        { params: { id: EXISTING_POST.id } }
      )

      expect(res.status).toBe(204)
    })

    it('calls prisma.post.delete with the correct id', async () => {
      await DELETE(
        makeDeleteRequest(EXISTING_POST.id) as Parameters<typeof DELETE>[0],
        { params: { id: EXISTING_POST.id } }
      )

      expect(mockPostDelete).toHaveBeenCalledOnce()
      const callArg = mockPostDelete.mock.calls[0][0] as {
        where: { id: string }
      }
      expect(callArg.where.id).toBe(EXISTING_POST.id)
    })

    it('creates an audit log entry for DELETE_POST', async () => {
      await DELETE(
        makeDeleteRequest(EXISTING_POST.id) as Parameters<typeof DELETE>[0],
        { params: { id: EXISTING_POST.id } }
      )

      expect(mockAuditLogCreate).toHaveBeenCalledOnce()
      const callArg = mockAuditLogCreate.mock.calls[0][0] as {
        data: { action: string }
      }
      expect(callArg.data.action).toBe('DELETE_POST')
    })
  })
})
