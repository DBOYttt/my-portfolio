---
name: Polling infinite-loop risk pattern
description: Polling intervals in this codebase lack a maximum-duration guard, risking runaway intervals if the terminal event never fires
type: project
---

In `CareerEvaluateForm.tsx`, `pollStatus()` creates a `setInterval` that only clears on `done`, `error`, or a caught network exception. If the career-ops service returns a non-terminal status indefinitely (e.g., stuck `running`), polling never stops and the UI stays locked in "Running…" forever with no timeout or user escape.

**Why:** The polling implementation was written as a happy-path-first draft; max-duration logic was not considered.

**How to apply:** Flag any polling loop that lacks a max-attempt counter or wall-clock timeout. Recommend a ~5-minute (100 × 3s) poll limit after which polling stops and the status is set to `error` with a "Timed out" message.
