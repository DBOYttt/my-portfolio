import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

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
