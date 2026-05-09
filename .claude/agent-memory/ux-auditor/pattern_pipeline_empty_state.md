---
name: Pipeline table service-down vs empty conflated
description: fetchPipeline() swallows non-ok HTTP responses and returns [], making "service down" and "no jobs yet" render identically
type: project
---

In `career/page.tsx`, `fetchPipeline()` only checks `CAREER_OPS_INTERNAL_URL` presence for the "service unavailable" message. If the URL is set but the service returns 503 or any non-ok status, `res.json()` is called anyway (may throw), or an empty `data.jobs ?? []` is returned — both render as "No evaluations yet." The user cannot tell whether the pipeline is healthy or broken.

**Why:** Error handling was scoped to catch-block only; HTTP status codes on non-2xx responses were not checked.

**How to apply:** When auditing server-rendered pipeline/list fetchers, check whether non-ok HTTP responses are distinguished from legitimate empty lists. Fix: check `res.ok` before parsing; on non-ok, return a sentinel (e.g., `null`) and render a distinct "Service error" state.
