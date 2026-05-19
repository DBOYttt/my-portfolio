import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { deepMerge } from '@/lib/deep-merge'

/**
 * These files are not HTTP route handlers — they are a sub-path that re-exports
 * functionality or relies on the parent route's guard. Add paths here only when
 * there is a documented reason the file is not a handler that needs its own
 * requireAdminSession call.
 */
const KNOWN_EXCEPTIONS: string[] = []

function findRouteFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath))
    } else if (entry.isFile() && entry.name === 'route.ts') {
      results.push(fullPath)
    }
  }
  return results
}

// ─── deepMerge prototype-pollution guard ─────────────────────────────────────
// Tests the shared utility extracted to src/lib/deep-merge.ts

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Admin API route guard coverage', () => {
  it('every route.ts under /api/admin calls requireAdminSession', () => {
    const adminDir = path.resolve(__dirname, '../admin')
    const routeFiles = findRouteFiles(adminDir)

    expect(routeFiles.length).toBeGreaterThan(0)

    const unguarded: string[] = []
    for (const file of routeFiles) {
      const relativePath = file.replace(process.cwd(), '')
      if (KNOWN_EXCEPTIONS.includes(relativePath)) continue
      const content = fs.readFileSync(file, 'utf-8')
      if (!content.includes('requireAdminSession')) {
        unguarded.push(relativePath)
      }
    }

    expect(unguarded).toEqual([])
  })
})

describe('deepMerge — prototype-pollution guard (career config PATCH)', () => {
  it('does not pollute Object.prototype when __proto__ key is in the patch', () => {
    const base: Record<string, unknown> = { level: 1 }
    const maliciousPatch = JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>

    deepMerge(base, maliciousPatch)

    // A freshly created plain object must NOT have the injected property
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined()
  })

  it('does not pollute Object.prototype when "constructor" key is in the patch', () => {
    const base: Record<string, unknown> = {}
    const patch: Record<string, unknown> = { constructor: { polluted: true } }

    deepMerge(base, patch)

    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined()
  })

  it('does not pollute Object.prototype when "prototype" key is in the patch', () => {
    const base: Record<string, unknown> = {}
    const patch: Record<string, unknown> = { prototype: { polluted: true } }

    deepMerge(base, patch)

    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined()
  })

  it('merges ordinary nested keys correctly', () => {
    const base = { a: { x: 1, y: 2 }, b: 'keep' }
    const patch = { a: { y: 99, z: 3 }, c: 'new' }

    const result = deepMerge(
      base as Record<string, unknown>,
      patch as Record<string, unknown>,
    )

    expect(result).toEqual({ a: { x: 1, y: 99, z: 3 }, b: 'keep', c: 'new' })
  })

  it('overwrites primitive base values with patch values', () => {
    const base: Record<string, unknown> = { count: 1 }
    const patch: Record<string, unknown> = { count: 42 }

    const result = deepMerge(base, patch)

    expect(result.count).toBe(42)
  })

  it('does not mutate the original base object', () => {
    const base: Record<string, unknown> = { x: 1 }
    const patch: Record<string, unknown> = { x: 2 }

    deepMerge(base, patch)

    expect(base.x).toBe(1)
  })
})
