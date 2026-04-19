import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Session } from 'next-auth'

// vi.mock is hoisted to the top of the file by vitest, so any variable
// referenced inside the factory must itself be hoisted via vi.hoisted().
const mockAuthFn = vi.hoisted(() => vi.fn<() => Promise<Session | null>>())

vi.mock('@/auth', () => ({
  auth: mockAuthFn,
}))

import { requireAdminSession } from '../admin-auth'

describe('requireAdminSession', () => {
  beforeEach(() => {
    mockAuthFn.mockReset()
  })

  it('returns a 401 Response when there is no session', async () => {
    mockAuthFn.mockResolvedValue(null)

    const result = await requireAdminSession()

    expect(result.session).toBeNull()
    expect(result.error).not.toBeNull()
    expect(result.error?.status).toBe(401)
  })

  it('returns null error when a valid session exists', async () => {
    mockAuthFn.mockResolvedValue({ user: { email: 'admin@test.com' } } as Session)

    const result = await requireAdminSession()

    expect(result.error).toBeNull()
    expect(result.session).not.toBeNull()
  })

  it('401 response body contains an "error" key', async () => {
    mockAuthFn.mockResolvedValue(null)

    const result = await requireAdminSession()

    expect(result.error).not.toBeNull()
    const body = await result.error!.json() as { error: string }
    expect(body).toHaveProperty('error')
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })
})
