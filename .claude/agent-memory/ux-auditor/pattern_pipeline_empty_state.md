---
name: Pipeline table service-down vs empty conflated
description: fetchPipeline() swallows non-ok HTTP responses and returns [], making "service down" and "no jobs yet" render identically
type: project
---

Confirmed in iteration 1 audit. The problem exists at TWO layers that compound each other:

1. `pipeline/route.ts` (the API route): does not check `res.ok` before calling `res.json()`. It also returns `{ jobs: [] }` with HTTP 200 when `CAREER_OPS_INTERNAL_URL` is unset. So every failure mode — unconfigured, 503, bad gateway — produces a 200 response with an empty jobs array.

2. `career/page.tsx` `fetchPipeline()` (the server component fetcher): correctly distinguishes `null` (return value on non-ok) from `[]` (empty) and renders different UI. But it is calling the `pipeline/route.ts` API route, not career-ops directly — and that API route always returns 200. So `fetchPipeline` in page.tsx never sees a non-ok response, and the "Pipeline fetch failed" UI branch is dead code that can never render.

**How to apply:** When a server component calls its own API route (rather than the external service directly), check that the API route correctly propagates failure status codes — do not assume the API route faithfully mirrors upstream errors.
