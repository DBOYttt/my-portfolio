---
name: Polling infinite-loop risk pattern
description: Polling intervals in this codebase lack a maximum-duration guard, risking runaway intervals if the terminal event never fires
type: project
---

In `CareerEvaluateForm.tsx`, `pollStatus()` creates a `setInterval` with a 100-poll (5-minute) cap. However the cap only fires when the fetch resolves — if `status/[jobId]/route.ts` hangs (no timeout, no try-catch on the upstream fetch to career-ops), each poll tick never resolves, `pollCountRef` never increments, and the UI stays locked in "Running…" indefinitely. Additionally, when the timeout IS hit and `logLines` is empty, the "Timed out" message is appended to the log but the log `<pre>` only renders when `logLines.length > 0` — so the message never appears if career-ops never sent any logs.

**Why:** The upstream route timeout was missed, and the timeout message display has a conditional-render bug.

**How to apply:** Flag any polling loop where: (1) the upstream API route has no AbortSignal.timeout, and (2) a timeout fallback message is written to a list that conditionally renders based on that list's length. Both conditions must be fixed together.
