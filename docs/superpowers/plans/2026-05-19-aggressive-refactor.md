# Aggressive Codebase Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bottom-up extraction of shared abstractions (hooks, utilities, CLI wrappers) followed by splitting the four largest files in the codebase into focused single-responsibility modules.

**Architecture:** Four shared abstractions are built first (`usePollJob`, `useAutoSave`, `career-ops-client`, `run-agent`), then each large file is refactored to use them. This ensures consistent patterns across all splits rather than independent ad-hoc solutions.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · Vitest + happy-dom · `@testing-library/react` (added in Task 1)

---

## File Map

**New files:**
- `src/hooks/usePollJob.ts` — generic job-status polling hook (replaces two duplicated polling loops)
- `src/hooks/useAutoSave.ts` — debounced auto-save with saved/error state
- `src/hooks/__tests__/usePollJob.test.tsx` — hook tests
- `src/hooks/__tests__/useAutoSave.test.tsx` — hook tests
- `src/lib/career-ops-client.ts` — server-side career-ops proxy helper
- `src/lib/__tests__/career-ops-client.test.ts` — unit tests
- `src/lib/agents/run-agent.ts` — agent CLI runner wrapper
- `src/lib/agents/__tests__/run-agent.test.ts` — unit tests
- `src/types/career.ts` — shared `CareerConfig`, `JobStatus`, response types
- `src/components/admin/career/shared.ts` — `STATUS_COLORS`, `INPUT_CLS`, `LABEL_CLS`, `FieldGroup`
- `src/components/admin/career/CareerConfigPanel.tsx`
- `src/components/admin/career/JobEvaluatePanel.tsx`
- `src/components/admin/career/CvGeneratePanel.tsx`
- `src/app/admin/(panel)/agents/reports/[reportId]/actions.ts` — all server actions
- `src/components/admin/reports/ReportHeader.tsx`
- `src/components/admin/reports/SkillsDiffReport.tsx`
- `src/components/admin/reports/ProjectSuggestionsReport.tsx`
- `src/components/admin/reports/ProjectSyncDiffReport.tsx`
- `src/components/admin/reports/GitHubAuditReport.tsx`
- `src/components/admin/reports/BrandMonitorReport.tsx`
- `src/components/admin/reports/BlogSuggesterReport.tsx`
- `src/components/admin/reports/RoboticsDigestReport.tsx`
- `src/components/admin/reports/PlatformSyncReport.tsx`

**Modified files:**
- `vitest.config.mts` — add `@vitejs/plugin-react`
- `src/components/admin/CareerEvaluateForm.tsx` — thin compositor (≤30 lines)
- `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx` — thin data-loader + compositor
- `src/app/api/admin/career/evaluate/route.ts` — use `careerOpsRequest`
- `src/app/api/admin/career/status/[jobId]/route.ts` — use `careerOpsRequest`
- `src/app/api/admin/career/cv/generate/route.ts` — use `careerOpsRequest`
- `src/app/api/admin/career/sync/route.ts` — use `careerOpsRequest` for the outbound POST
- `agents/github-summarizer.ts` through `agents/platform-sync.ts` (7 files) — use `runAgent`

---

## Task 1: Branch + Test Infrastructure

**Files:**
- Modify: `vitest.config.mts`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b refactor/aggressive-cleanup
```

- [ ] **Step 2: Install testing dependencies**

```bash
npm install -D @testing-library/react @vitejs/plugin-react
```

Expected output: added 2 packages.

- [ ] **Step 3: Update `vitest.config.mts` to enable React transforms**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Verify existing tests still pass**

```bash
npm test
```

Expected: all 119 tests pass.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.mts package.json package-lock.json
git commit -m "chore(infra): add @testing-library/react for hook tests"
```

---

## Task 2: Extract Shared Career Types

**Files:**
- Create: `src/types/career.ts`
- Create: `src/components/admin/career/shared.ts`

- [ ] **Step 1: Create `src/types/career.ts`**

```typescript
export type JobStatus = "pending" | "running" | "done" | "error";

export interface CareerConfig {
  contact?: { phone?: string; location?: string; twitter?: string };
  target_roles?: {
    primary?: string[];
    archetypes?: Array<{ name: string; level: string; fit: string }>;
  };
  narrative?: { headline?: string; exit_story?: string; superpowers?: string[] };
  compensation?: {
    target_range?: string;
    currency?: string;
    minimum?: string;
    location_flexibility?: string;
  };
  location?: { country?: string; city?: string; timezone?: string; visa_status?: string };
  cv_output_format?: string;
}

export interface StatusResponse {
  status?: string;
  log?: string[];
  pdfPath?: string;
  error?: string;
}

export interface EvaluateResponse {
  jobId?: string;
  error?: string;
}

export interface PublishResponse {
  ok?: boolean;
  publishedAt?: string;
  error?: string;
}

export interface SyncResponse {
  ok?: boolean;
  profileFields?: string[];
  error?: string;
}
```

- [ ] **Step 2: Create `src/components/admin/career/shared.ts`**

```typescript
import type { JobStatus } from "@/types/career";

export const STATUS_COLORS: Record<JobStatus, string> = {
  pending: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  running: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  done: "text-green-400 bg-green-500/10 border-green-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

export const INPUT_CLS =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 placeholder-slate-600";

export const LABEL_CLS = "block text-slate-400 text-xs font-mono mb-1";

export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/career.ts src/components/admin/career/shared.ts
git commit -m "refactor(types): extract shared career types and admin form constants"
```

---

## Task 3: Extract `usePollJob` Hook

**Files:**
- Create: `src/hooks/usePollJob.ts`
- Create: `src/hooks/__tests__/usePollJob.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/usePollJob.test.tsx`:

```typescript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePollJob } from "../usePollJob";

describe("usePollJob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls onStatus with the polled status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ status: "running", log: ["line 1"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onStatus = vi.fn();
    const onLog = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus, onLog })
    );

    act(() => {
      result.current.start("job-123");
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/career/status/job-123");
    expect(onStatus).toHaveBeenCalledWith("running");
    expect(onLog).toHaveBeenCalledWith(["line 1"]);
  });

  it("calls onTerminal and stops when status is done", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({ status: "done", log: [] }),
    }));

    const onStatus = vi.fn();
    const onTerminal = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus, onTerminal })
    );

    act(() => { result.current.start("job-abc"); });

    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(onStatus).toHaveBeenCalledWith("done");
    expect(onTerminal).toHaveBeenCalledOnce();
  });

  it("calls onTimeout after POLL_MAX ticks", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({ status: "running" }),
    }));

    const onTimeout = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus: vi.fn(), onTimeout })
    );

    act(() => { result.current.start("job-timeout"); });

    await act(async () => {
      vi.advanceTimersByTime(3000 * 101); // 101 ticks > POLL_MAX(100)
    });

    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it("calls onError on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const onStatus = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus, onError })
    );

    act(() => { result.current.start("job-err"); });

    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(onStatus).toHaveBeenCalledWith("error");
    expect(onError).toHaveBeenCalledOnce();
  });

  it("stop() clears the interval", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ status: "running" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      usePollJob({ onStatus: vi.fn() })
    );

    act(() => { result.current.start("job-stop"); });
    act(() => { result.current.stop(); });

    await act(async () => { vi.advanceTimersByTime(9000); });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npx vitest run src/hooks/__tests__/usePollJob.test.tsx
```

Expected: FAIL — `Cannot find module '../usePollJob'`

- [ ] **Step 3: Create `src/hooks/usePollJob.ts`**

```typescript
"use client";

import { useCallback, useRef } from "react";
import type { JobStatus, StatusResponse } from "@/types/career";

export type { JobStatus };

export interface PollJobCallbacks {
  onStatus: (status: JobStatus) => void;
  onLog?: (lines: string[]) => void;
  onTerminal?: () => void;
  onTimeout?: () => void;
  onError?: () => void;
}

const POLL_MAX = 100;
const POLL_INTERVAL_MS = 3000;
const KNOWN_STATUSES: JobStatus[] = ["pending", "running", "done", "error"];

export function usePollJob(callbacks: PollJobCallbacks) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);
  const fetchingRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (jobId: string) => {
      stop();
      countRef.current = 0;
      fetchingRef.current = false;

      intervalRef.current = setInterval(async () => {
        countRef.current += 1;

        if (countRef.current >= POLL_MAX) {
          stop();
          cbRef.current.onTimeout?.();
          return;
        }

        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
          const res = await fetch(`/api/admin/career/status/${jobId}`);
          const data = (await res.json()) as StatusResponse;

          if (data.log) cbRef.current.onLog?.(data.log);

          const status =
            data.status && KNOWN_STATUSES.includes(data.status as JobStatus)
              ? (data.status as JobStatus)
              : null;

          if (status) {
            cbRef.current.onStatus(status);
            if (status === "done" || status === "error") {
              stop();
              cbRef.current.onTerminal?.();
            }
          } else if (data.status) {
            stop();
            cbRef.current.onStatus("error");
            cbRef.current.onError?.();
          }
        } catch {
          stop();
          cbRef.current.onStatus("error");
          cbRef.current.onError?.();
        } finally {
          fetchingRef.current = false;
        }
      }, POLL_INTERVAL_MS);
    },
    [stop]
  );

  return { start, stop };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx vitest run src/hooks/__tests__/usePollJob.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePollJob.ts src/hooks/__tests__/usePollJob.test.tsx
git commit -m "feat(hooks): add usePollJob — generic career-ops job status polling hook"
```

---

## Task 4: Extract `useAutoSave` Hook

**Files:**
- Create: `src/hooks/useAutoSave.ts`
- Create: `src/hooks/__tests__/useAutoSave.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/__tests__/useAutoSave.test.tsx`:

```typescript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoSave } from "../useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("does not save before markServerState is called (first-load guard)", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ x: 1 }, saveFn)
    );

    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(saveFn).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it("does not save when value matches server state", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 1 } });

    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(saveFn).not.toHaveBeenCalled();
  });

  it("debounces and saves when value changes after markServerState", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 2 } });

    await act(async () => { vi.advanceTimersByTime(800); });

    expect(saveFn).toHaveBeenCalledWith({ x: 2 });
    expect(result.current.saved).toBe(true);
  });

  it("sets error=true when saveFn throws", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("fail"));
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 2 } });

    await act(async () => { vi.advanceTimersByTime(800); });

    expect(result.current.error).toBe(true);
    expect(result.current.saved).toBe(false);
  });

  it("resets saved to false after 2 seconds", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 2 } });

    await act(async () => { vi.advanceTimersByTime(800); });
    expect(result.current.saved).toBe(true);

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(result.current.saved).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run src/hooks/__tests__/useAutoSave.test.tsx
```

Expected: FAIL — `Cannot find module '../useAutoSave'`

- [ ] **Step 3: Create `src/hooks/useAutoSave.ts`**

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoSaveOptions {
  delay?: number;
}

export interface UseAutoSaveReturn {
  saving: boolean;
  saved: boolean;
  error: boolean;
  markServerState: (value: unknown) => void;
}

export function useAutoSave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const { delay = 800 } = options;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const isFirstLoad = useRef(true);
  const serverStateRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const markServerState = useCallback((v: unknown) => {
    serverStateRef.current = JSON.stringify(v);
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    const serialized = JSON.stringify(value);
    if (serialized === serverStateRef.current) return;

    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      setError(false);
      setSaved(false);
      try {
        await saveFnRef.current(value);
        serverStateRef.current = JSON.stringify(value);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setSaving(false);
        setError(true);
      }
    }, delay);
  }, [value, delay]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    };
  }, []);

  return { saving, saved, error, markServerState };
}
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
npx vitest run src/hooks/__tests__/useAutoSave.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAutoSave.ts src/hooks/__tests__/useAutoSave.test.tsx
git commit -m "feat(hooks): add useAutoSave — debounced auto-save with saved/error indicators"
```

---

## Task 5: Extract `career-ops-client.ts`

**Files:**
- Create: `src/lib/career-ops-client.ts`
- Create: `src/lib/__tests__/career-ops-client.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/career-ops-client.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("careerOpsRequest", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.restoreAllMocks();
  });

  it("returns errorResponse when CAREER_OPS_INTERNAL_URL is unset", async () => {
    delete process.env.CAREER_OPS_INTERNAL_URL;
    const { careerOpsRequest } = await import("../career-ops-client");
    const result = await careerOpsRequest("/health");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.errorResponse.json() as { error: string };
      expect(body.error).toBe("Career-ops service not configured");
      expect(result.errorResponse.status).toBe(503);
    }
  });

  it("returns errorResponse when fetch throws", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const { careerOpsRequest } = await import("../career-ops-client");
    const result = await careerOpsRequest("/health");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.errorResponse.json() as { error: string };
      expect(body.error).toBe("career-ops service unavailable");
    }
  });

  it("returns ok:true with the Response on success", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    const fakeResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse));
    const { careerOpsRequest } = await import("../career-ops-client");
    const result = await careerOpsRequest("/health");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.status).toBe(200);
    }
  });

  it("sets Authorization header when secret is present", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    process.env.CAREER_OPS_INTERNAL_SECRET = "mysecret";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { careerOpsRequest } = await import("../career-ops-client");
    await careerOpsRequest("/health");
    expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe("Bearer mysecret");
  });

  it("serialises body as JSON and sets Content-Type", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { careerOpsRequest } = await import("../career-ops-client");
    await careerOpsRequest("/evaluate", { method: "POST", body: { url: "https://example.com" } });
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ url: "https://example.com" }));
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run src/lib/__tests__/career-ops-client.test.ts
```

Expected: FAIL — `Cannot find module '../career-ops-client'`

- [ ] **Step 3: Create `src/lib/career-ops-client.ts`**

```typescript
import { NextResponse } from "next/server";

interface CareerOpsRequestOptions {
  method?: string;
  body?: unknown;
  timeout?: number;
}

export type CareerOpsResult =
  | { ok: true; response: Response }
  | { ok: false; errorResponse: NextResponse };

export async function careerOpsRequest(
  endpoint: string,
  options: CareerOpsRequestOptions = {}
): Promise<CareerOpsResult> {
  const { method = "GET", body, timeout = 10_000 } = options;

  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;

  if (!internalUrl) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Career-ops service not configured" },
        { status: 503 }
      ),
    };
  }

  const headers: Record<string, string> = {};
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${internalUrl}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    return { ok: true, response };
  } catch {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "career-ops service unavailable" },
        { status: 503 }
      ),
    };
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/__tests__/career-ops-client.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/career-ops-client.ts src/lib/__tests__/career-ops-client.test.ts
git commit -m "feat(lib): add career-ops-client — server-side proxy helper for career-ops service"
```

---

## Task 6: Extract `run-agent.ts` CLI Wrapper

**Files:**
- Create: `src/lib/agents/run-agent.ts`
- Create: `src/lib/agents/__tests__/run-agent.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/agents/__tests__/run-agent.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentRunResult } from "@/lib/agents/types";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agent: {
      upsert: vi.fn().mockResolvedValue({ id: "agent-test" }),
    },
    agentReport: {
      create: vi.fn().mockResolvedValue({}),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("runAgent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts the agent record, creates a report, and disconnects", async () => {
    const { runAgent } = await import("../run-agent");
    const { prisma } = await import("@/lib/prisma");

    const mockResult: AgentRunResult = {
      title: "Test Report",
      summary: "Summary",
      sources: [],
      rawData: {},
    };

    await runAgent(
      {
        id: "agent-test",
        name: "Test Agent",
        type: "GITHUB_SUMMARIZER",
        description: "A test agent",
        schedule: "0 9 * * 1",
      },
      async () => mockResult
    );

    expect(prisma.agent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "agent-test" },
        create: expect.objectContaining({ id: "agent-test", name: "Test Agent" }),
      })
    );

    expect(prisma.agentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: "agent-test",
          title: "Test Report",
        }),
      })
    );

    expect(prisma.$disconnect).toHaveBeenCalledOnce();
  });

  it("disconnects and rethrows when runner throws", async () => {
    const { runAgent } = await import("../run-agent");
    const { prisma } = await import("@/lib/prisma");

    await expect(
      runAgent(
        { id: "agent-test", name: "Test", type: "GITHUB_SUMMARIZER", description: "", schedule: "" },
        async () => { throw new Error("runner failed"); }
      )
    ).rejects.toThrow("runner failed");

    expect(prisma.$disconnect).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
npx vitest run src/lib/agents/__tests__/run-agent.test.ts
```

Expected: FAIL — `Cannot find module '../run-agent'`

- [ ] **Step 3: Create `src/lib/agents/run-agent.ts`**

```typescript
import { prisma } from "@/lib/prisma";
import type { AgentRunResult } from "./types";
import type { AgentType } from "@prisma/client";

interface AgentDefinition {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  schedule: string;
  config?: Record<string, unknown>;
}

export async function runAgent(
  def: AgentDefinition,
  runner: () => Promise<AgentRunResult>
): Promise<void> {
  console.log(`[${def.id}] Starting...`);

  const agent = await prisma.agent.upsert({
    where: { id: def.id },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: def.id,
      name: def.name,
      type: def.type,
      description: def.description,
      enabled: true,
      schedule: def.schedule,
      config: def.config ?? {},
      lastRunAt: new Date(),
    },
  });

  try {
    const result = await runner();
    await prisma.agentReport.create({
      data: {
        agentId: agent.id,
        title: result.title,
        summary: result.summary,
        sources: result.sources,
        rawData: result.rawData as object,
      },
    });
    console.log(`[${def.id}] Report saved: ${result.title}`);
  } finally {
    await prisma.$disconnect();
  }
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/lib/agents/__tests__/run-agent.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: Run the full suite to confirm no regressions**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/agents/run-agent.ts src/lib/agents/__tests__/run-agent.test.ts
git commit -m "feat(agents): add runAgent wrapper — eliminate 35-line boilerplate in CLI runners"
```

---

## Task 7: Refactor Career API Routes

**Files:**
- Modify: `src/app/api/admin/career/evaluate/route.ts`
- Modify: `src/app/api/admin/career/status/[jobId]/route.ts`
- Modify: `src/app/api/admin/career/cv/generate/route.ts`
- Modify: `src/app/api/admin/career/sync/route.ts`

- [ ] **Step 1: Replace `evaluate/route.ts`**

```typescript
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { careerOpsRequest } from "@/lib/career-ops-client";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const result = await careerOpsRequest("/evaluate", {
    method: "POST",
    body: { url },
    timeout: 10_000,
  });
  if (!result.ok) return result.errorResponse;

  const data = (await result.response.json()) as unknown;
  return NextResponse.json(data, { status: result.response.status });
}
```

- [ ] **Step 2: Replace `status/[jobId]/route.ts`**

```typescript
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { careerOpsRequest } from "@/lib/career-ops-client";

export async function GET(
  _req: Request,
  { params }: { params: { jobId: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const result = await careerOpsRequest(`/status/${params.jobId}`, { timeout: 5_000 });
  if (!result.ok) return result.errorResponse;

  const data = (await result.response.json()) as unknown;
  return NextResponse.json(data, { status: result.response.status });
}
```

- [ ] **Step 3: Replace `cv/generate/route.ts`**

```typescript
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { careerOpsRequest } from "@/lib/career-ops-client";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const result = await careerOpsRequest("/cv/master", { method: "POST", timeout: 10_000 });
  if (!result.ok) return result.errorResponse;

  const data = (await result.response.json()) as unknown;
  return NextResponse.json(data, { status: result.response.status });
}
```

- [ ] **Step 4: Update the outbound POST in `sync/route.ts`**

Read `src/app/api/admin/career/sync/route.ts` first, then replace only the final `fetch` block (lines ~166–176 in the current file). The block currently reads:

```typescript
  let syncRes: Response;
  try {
    syncRes = await fetch(`${internalUrl}/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({ profile, cv }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
  return NextResponse.json(await syncRes.json(), { status: syncRes.status });
```

Replace with:

```typescript
  const syncResult = await careerOpsRequest("/sync", {
    method: "POST",
    body: { profile, cv },
    timeout: 30_000,
  });
  if (!syncResult.ok) return syncResult.errorResponse;
  return NextResponse.json(await syncResult.response.json(), {
    status: syncResult.response.status,
  });
```

Also add the import at the top of `sync/route.ts`:

```typescript
import { careerOpsRequest } from "@/lib/career-ops-client";
```

And remove the now-unused `internalUrl`/`secret`/`headers` variables from the sync route (they were only used for the outbound fetch).

- [ ] **Step 5: Type-check and test**

```bash
npx tsc --noEmit && npm test
```

Expected: no type errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/career/evaluate/route.ts \
        src/app/api/admin/career/status/[jobId]/route.ts \
        src/app/api/admin/career/cv/generate/route.ts \
        src/app/api/admin/career/sync/route.ts
git commit -m "refactor(api): career routes use careerOpsRequest — remove repeated proxy boilerplate"
```

---

## Task 8: Split `CareerEvaluateForm` into Three Panels

**Files:**
- Create: `src/components/admin/career/CareerConfigPanel.tsx`
- Create: `src/components/admin/career/JobEvaluatePanel.tsx`
- Create: `src/components/admin/career/CvGeneratePanel.tsx`
- Modify: `src/components/admin/CareerEvaluateForm.tsx`

> **Note:** Read `src/components/admin/CareerEvaluateForm.tsx` in full before starting. The JSX for the config form fields (lines ~440–665) goes into `CareerConfigPanel`. The evaluate section (lines ~666–730) goes into `JobEvaluatePanel`. The CV section (lines ~730–end) goes into `CvGeneratePanel`.

- [ ] **Step 1: Create `CareerConfigPanel.tsx`**

This panel owns config loading, auto-save, sync, and all the profile form fields.

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { CareerConfig, SyncResponse } from "@/types/career";
import { INPUT_CLS, LABEL_CLS, FieldGroup } from "./shared";

export default function CareerConfigPanel() {
  const [config, setConfig] = useState<CareerConfig>({});
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { saving: savedIndicator, error: saveError, markServerState } = useAutoSave(
    config,
    async (updated) => {
      const res = await fetch("/api/admin/career/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("save failed");
    }
  );

  const loadConfig = useCallback(() => {
    setConfigLoading(true);
    setConfigError(false);
    fetch("/api/admin/career/config")
      .then((r) => r.json())
      .then((data: CareerConfig) => {
        markServerState(data);
        setConfig(data);
        setConfigLoading(false);
      })
      .catch(() => {
        setConfigError(true);
        setConfigLoading(false);
      });
  }, [markServerState]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  function setContact(patch: Partial<NonNullable<CareerConfig["contact"]>>) {
    setConfig((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));
  }
  function setNarrative(patch: Partial<NonNullable<CareerConfig["narrative"]>>) {
    setConfig((prev) => ({ ...prev, narrative: { ...prev.narrative, ...patch } }));
  }
  function setCompensation(patch: Partial<NonNullable<CareerConfig["compensation"]>>) {
    setConfig((prev) => ({ ...prev, compensation: { ...prev.compensation, ...patch } }));
  }
  function setLocation(patch: Partial<NonNullable<CareerConfig["location"]>>) {
    setConfig((prev) => ({ ...prev, location: { ...prev.location, ...patch } }));
  }
  function setTargetRoles(primary: string) {
    const arr = primary.split("\n").map((s) => s.trim()).filter(Boolean);
    setConfig((prev) => ({ ...prev, target_roles: { ...prev.target_roles, primary: arr } }));
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/career/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      setSyncResult(
        res.ok && data.ok
          ? { ok: true, message: "Synced — profile.yml and cv.md updated" }
          : { ok: false, message: data.error ?? "Sync failed" }
      );
    } catch {
      setSyncResult({ ok: false, message: "Network error — could not reach career-ops" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-slate-100 font-semibold">Career Profile</h2>
        <div className="flex items-center gap-2">
          {savedIndicator && (
            <span className="text-xs text-green-400 font-mono flex items-center gap-1">
              <span>&#10003;</span> Saved
            </span>
          )}
          {saveError && !configLoading && !configError && (
            <span
              title="Auto-save failed — check your session"
              className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1 align-middle"
            />
          )}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || configLoading}
            className="btn-secondary text-xs py-1 px-3 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync to career-ops"}
          </button>
        </div>
      </div>
      <p className="text-slate-500 text-xs font-mono mb-4">
        Auto-saved. Sync pushes profile.yml + cv.md to career-ops container.
      </p>

      {syncResult && (
        <div
          className={`mb-4 text-xs font-mono px-3 py-2 rounded border ${
            syncResult.ok
              ? "text-green-400 border-green-500/20 bg-green-500/10"
              : "text-red-400 border-red-500/20 bg-red-500/10"
          }`}
        >
          {syncResult.message}
        </div>
      )}

      <div className="space-y-4">
        {configLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-[#2a2d3a] rounded" />
            ))}
          </div>
        ) : configError ? (
          <div className="text-red-400 text-sm font-mono space-y-2">
            <p>Could not load career profile.</p>
            <button
              onClick={loadConfig}
              className="text-cyan-400 hover:text-cyan-300 underline text-xs"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Contact */}
            <details open>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                Contact
              </summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Phone">
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="+48 123 456 789"
                    value={config.contact?.phone ?? ""}
                    onChange={(e) => setContact({ phone: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Location override">
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="Kraków, Poland"
                    value={config.contact?.location ?? ""}
                    onChange={(e) => setContact({ location: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Twitter handle">
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="@yourhandle"
                    value={config.contact?.twitter ?? ""}
                    onChange={(e) => setContact({ twitter: e.target.value })}
                  />
                </FieldGroup>
              </div>
            </details>

            <div className="border-t border-[#2a2d3a]" />

            {/* Target Roles */}
            <details>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                Target Roles
              </summary>
              <div className="mt-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Primary roles (one per line)">
                  <textarea
                    rows={4}
                    className={INPUT_CLS}
                    placeholder={"Software Engineer\nBackend Developer\nRobotics Software Engineer"}
                    value={(config.target_roles?.primary ?? []).join("\n")}
                    onChange={(e) => setTargetRoles(e.target.value)}
                  />
                </FieldGroup>
              </div>
            </details>

            <div className="border-t border-[#2a2d3a]" />

            {/* Narrative */}
            <details>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                Narrative
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Headline">
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="Software engineer specialising in full-stack and robotics systems"
                    value={config.narrative?.headline ?? ""}
                    onChange={(e) => setNarrative({ headline: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Exit story">
                  <textarea
                    rows={3}
                    className={INPUT_CLS}
                    placeholder="What you've done and where you're heading next"
                    value={config.narrative?.exit_story ?? ""}
                    onChange={(e) => setNarrative({ exit_story: e.target.value })}
                  />
                </FieldGroup>
                <FieldGroup label="Superpowers (one per line)">
                  <textarea
                    rows={3}
                    className={INPUT_CLS}
                    placeholder={"Full-stack web development\nRobotics and embedded systems\nCI/CD and DevOps"}
                    value={(config.narrative?.superpowers ?? []).join("\n")}
                    onChange={(e) =>
                      setNarrative({
                        superpowers: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </FieldGroup>
              </div>
            </details>

            <div className="border-t border-[#2a2d3a]" />

            {/* Compensation */}
            <details>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                Compensation
              </summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Target range">
                  <input type="text" className={INPUT_CLS} placeholder="$80K-120K"
                    value={config.compensation?.target_range ?? ""}
                    onChange={(e) => setCompensation({ target_range: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Currency">
                  <input type="text" className={INPUT_CLS} placeholder="USD"
                    value={config.compensation?.currency ?? ""}
                    onChange={(e) => setCompensation({ currency: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Minimum">
                  <input type="text" className={INPUT_CLS} placeholder="$70K"
                    value={config.compensation?.minimum ?? ""}
                    onChange={(e) => setCompensation({ minimum: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Location flexibility">
                  <input type="text" className={INPUT_CLS} placeholder="Remote or hybrid"
                    value={config.compensation?.location_flexibility ?? ""}
                    onChange={(e) => setCompensation({ location_flexibility: e.target.value })} />
                </FieldGroup>
              </div>
            </details>

            <div className="border-t border-[#2a2d3a]" />

            {/* Location */}
            <details>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                Location
              </summary>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Country">
                  <input type="text" className={INPUT_CLS} placeholder="Poland"
                    value={config.location?.country ?? ""}
                    onChange={(e) => setLocation({ country: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="City">
                  <input type="text" className={INPUT_CLS} placeholder="Kraków"
                    value={config.location?.city ?? ""}
                    onChange={(e) => setLocation({ city: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Timezone">
                  <input type="text" className={INPUT_CLS} placeholder="CET"
                    value={config.location?.timezone ?? ""}
                    onChange={(e) => setLocation({ timezone: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Visa status">
                  <input type="text" className={INPUT_CLS} placeholder="EU citizen"
                    value={config.location?.visa_status ?? ""}
                    onChange={(e) => setLocation({ visa_status: e.target.value })} />
                </FieldGroup>
              </div>
            </details>

            <div className="border-t border-[#2a2d3a]" />

            {/* CV Output Format */}
            <details>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                CV Settings
              </summary>
              <div className="mt-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Output format">
                  <select
                    className={INPUT_CLS}
                    value={config.cv_output_format ?? "pdf"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cv_output_format: e.target.value }))}
                  >
                    <option value="pdf">PDF</option>
                    <option value="html">HTML</option>
                    <option value="docx">DOCX</option>
                  </select>
                </FieldGroup>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `JobEvaluatePanel.tsx`**

```typescript
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePollJob } from "@/hooks/usePollJob";
import type { JobStatus, EvaluateResponse } from "@/types/career";
import { STATUS_COLORS } from "./shared";

export default function JobEvaluatePanel() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const logBoxRef = useRef<HTMLPreElement | null>(null);
  const evaluateAbortRef = useRef<AbortController | null>(null);

  const { start: startPoll, stop: stopPoll } = usePollJob({
    onStatus: (status) => setJobStatus((prev) => (prev !== status ? status : prev)),
    onLog: (lines) => {
      setLogLines(lines);
      if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    },
    onTerminal: () => {
      setEvaluating(false);
      router.refresh();
    },
    onTimeout: () => {
      setEvaluating(false);
      setLogLines((prev) => [...prev, "\nTimed out after 5 minutes."]);
    },
    onError: () => {
      setEvaluating(false);
      router.refresh();
    },
  });

  async function handleEvaluate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) return;

    stopPoll();
    setLogLines([]);
    setJobStatus("pending");
    setEvaluating(true);

    evaluateAbortRef.current?.abort();
    const ctrl = new AbortController();
    evaluateAbortRef.current = ctrl;

    try {
      const res = await fetch("/api/admin/career/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
        signal: ctrl.signal,
      });
      const data = (await res.json()) as EvaluateResponse;

      if (!res.ok || !data.jobId) {
        setJobStatus("error");
        setLogLines([data.error ?? "Failed to start evaluation"]);
        setEvaluating(false);
        return;
      }

      setJobStatus("running");
      startPoll(data.jobId);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setJobStatus("error");
      setLogLines(["Network error — could not reach career-ops service"]);
      setEvaluating(false);
    }
  }

  function handleCancel() {
    evaluateAbortRef.current?.abort();
    stopPoll();
    setEvaluating(false);
    setJobStatus(null);
  }

  return (
    <div className="card p-4 mb-6">
      <h2 className="text-slate-100 font-semibold mb-1">Evaluate a Job</h2>
      <p className="text-slate-500 text-xs font-mono mb-4">
        Paste a job posting URL to evaluate fit against your career profile.
      </p>

      <form onSubmit={handleEvaluate} className="flex gap-2 mb-4">
        <input
          type="url"
          className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 placeholder-slate-600"
          placeholder="https://example.com/jobs/123"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={evaluating}
        />
        {evaluating ? (
          <button type="button" onClick={handleCancel} className="btn-secondary text-sm px-4">
            Cancel
          </button>
        ) : (
          <button type="submit" className="btn-primary text-sm px-4">
            Evaluate
          </button>
        )}
      </form>

      {jobStatus && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-mono ${STATUS_COLORS[jobStatus]}`}
          >
            {jobStatus}
          </span>
        </div>
      )}

      {logLines.length > 0 && (
        <pre
          ref={logBoxRef}
          className="bg-[#0f1117] border border-[#2a2d3a] rounded p-3 text-xs text-slate-300 font-mono overflow-y-auto max-h-64 whitespace-pre-wrap"
        >
          {logLines.join("")}
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `CvGeneratePanel.tsx`**

```typescript
"use client";

import { useState } from "react";
import { usePollJob } from "@/hooks/usePollJob";
import type { JobStatus, PublishResponse } from "@/types/career";
import { STATUS_COLORS } from "./shared";

interface GenerateResponse {
  jobId?: string;
  error?: string;
}

export default function CvGeneratePanel() {
  const [cvGenStatus, setCvGenStatus] = useState<JobStatus | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [publishing, setPublishing] = useState(false);

  const { start: startCvPoll, stop: stopCvPoll } = usePollJob({
    onStatus: (status) => setCvGenStatus((prev) => (prev !== status ? status : prev)),
    onTerminal: () => setGenerating(false),
    onTimeout: () => {
      setGenerating(false);
      setCvGenStatus("error");
    },
    onError: () => {
      setGenerating(false);
      setCvGenStatus("error");
    },
  });

  async function handleGenerate() {
    stopCvPoll();
    setCvGenStatus("pending");
    setPublishResult(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/career/cv/generate", { method: "POST" });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok || !data.jobId) {
        setCvGenStatus("error");
        setGenerating(false);
        return;
      }
      setCvGenStatus("running");
      startCvPoll(data.jobId);
    } catch {
      setCvGenStatus("error");
      setGenerating(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/admin/career/cv/publish", { method: "POST" });
      const data = (await res.json()) as PublishResponse;
      if (res.ok && data.ok) {
        setPublishResult({
          ok: true,
          message: `Published at ${data.publishedAt ? new Date(data.publishedAt).toLocaleString() : "—"}`,
        });
      } else {
        setPublishResult({ ok: false, message: data.error ?? "Publish failed" });
      }
    } catch {
      setPublishResult({ ok: false, message: "Network error — could not publish CV" });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="card p-4 mb-6">
      <h2 className="text-slate-100 font-semibold mb-1">Master CV</h2>
      <p className="text-slate-500 text-xs font-mono mb-4">
        Generate a master PDF from your cv.md, then publish it to /cv.pdf.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary text-sm px-4 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate Master CV"}
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || cvGenStatus !== "done"}
          className="btn-secondary text-sm px-4 disabled:opacity-50"
        >
          {publishing ? "Publishing…" : "Publish CV"}
        </button>
        {cvGenStatus === "done" && (
          <a
            href="/cv-output/master-cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm px-4"
          >
            Preview PDF
          </a>
        )}
      </div>

      {cvGenStatus && (
        <div className="mb-3">
          <span
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border font-mono ${STATUS_COLORS[cvGenStatus]}`}
          >
            {cvGenStatus}
          </span>
        </div>
      )}

      {publishResult && (
        <div
          className={`text-xs font-mono px-3 py-2 rounded border ${
            publishResult.ok
              ? "text-green-400 border-green-500/20 bg-green-500/10"
              : "text-red-400 border-red-500/20 bg-red-500/10"
          }`}
        >
          {publishResult.message}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Replace `CareerEvaluateForm.tsx` with thin compositor**

```typescript
"use client";

import CareerConfigPanel from "./career/CareerConfigPanel";
import JobEvaluatePanel from "./career/JobEvaluatePanel";
import CvGeneratePanel from "./career/CvGeneratePanel";

export default function CareerEvaluateForm() {
  return (
    <>
      <CareerConfigPanel />
      <JobEvaluatePanel />
      <CvGeneratePanel />
    </>
  );
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. Fix any import or type mismatches before continuing.

- [ ] **Step 6: Verify tests still pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/CareerEvaluateForm.tsx \
        src/components/admin/career/ \
        src/types/career.ts
git commit -m "refactor(career): split CareerEvaluateForm into CareerConfigPanel, JobEvaluatePanel, CvGeneratePanel"
```

---

## Task 9: Split Report Page (1,492 Lines → Focused Components)

**Files:**
- Create: `src/app/admin/(panel)/agents/reports/[reportId]/actions.ts`
- Create: `src/components/admin/reports/ReportHeader.tsx`
- Create: `src/components/admin/reports/SkillsDiffReport.tsx`
- Create: `src/components/admin/reports/ProjectSuggestionsReport.tsx`
- Create: `src/components/admin/reports/ProjectSyncDiffReport.tsx`
- Create: `src/components/admin/reports/GitHubAuditReport.tsx`
- Create: `src/components/admin/reports/BrandMonitorReport.tsx`
- Create: `src/components/admin/reports/BlogSuggesterReport.tsx`
- Create: `src/components/admin/reports/RoboticsDigestReport.tsx`
- Create: `src/components/admin/reports/PlatformSyncReport.tsx`
- Modify: `src/app/admin/(panel)/agents/reports/[reportId]/page.tsx`

> **Read the full `page.tsx` before starting.** Server actions are inline closures over `reportId`. They move to `actions.ts` where `reportId` becomes an explicit first parameter.

- [ ] **Step 1: Create `actions.ts` — move all server actions**

Create `src/app/admin/(panel)/agents/reports/[reportId]/actions.ts`:

```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SkillCategory, SkillLevel } from "@prisma/client";
import type { ProjectSuggestion } from "@/types/agent-reports";

export async function markRead(reportId: string): Promise<void> {
  await prisma.agentReport.update({
    where: { id: reportId },
    data: { readAt: new Date() },
  });
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function applySkillAdd(reportId: string, formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const category = formData.get("category") as SkillCategory;
  const level = formData.get("level") as SkillLevel;
  if (!name || !category || !level) return;
  await prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name, category, level, order: 0 },
  });
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function applyAllSkillAdditions(reportId: string, formData: FormData): Promise<void> {
  const itemsJson = formData.get("items") as string;
  if (!itemsJson) return;
  let items: Array<{ name: string; category: string; level?: string }>;
  try {
    items = JSON.parse(itemsJson) as Array<{ name: string; category: string; level?: string }>;
  } catch {
    return;
  }
  await prisma.skill.createMany({
    data: items.map((i) => ({
      name: i.name,
      category: i.category as SkillCategory,
      level: (i.level ?? "FAMILIAR") as SkillLevel,
      order: 0,
    })),
    skipDuplicates: true,
  });
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function applySkillUpgrade(reportId: string, formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const level = formData.get("level") as SkillLevel;
  if (!name || !level) return;
  const skill = await prisma.skill.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (skill) {
    await prisma.skill.update({ where: { id: skill.id }, data: { level } });
  }
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function dismissStaleSkill(reportId: string, formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/admin/agents/reports");
  revalidatePath(`/admin/agents/reports/${reportId}`);
  revalidatePath("/");
}

export async function createProjectDraft(reportId: string, formData: FormData): Promise<void> {
  let suggestion: ProjectSuggestion;
  try {
    suggestion = JSON.parse(formData.get("suggestion") as string) as ProjectSuggestion;
  } catch {
    return;
  }
  try {
    const project = await prisma.project.create({
      data: {
        title: suggestion.title,
        slug: suggestion.slug,
        summary: suggestion.summary,
        content: suggestion.content,
        type: suggestion.type,
        techTags: suggestion.techTags,
        githubUrl: suggestion.githubUrl,
        featured: false,
        order: 0,
        publishedAt: null,
      },
    });
    redirect(`/admin/projects/${project.id}`);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      redirect(`/admin/agents/reports/${reportId}?error=slug-exists`);
    }
    throw e;
  }
}

export async function applyProjectSyncUpdate(reportId: string, formData: FormData): Promise<void> {
  const slug = formData.get("slug") as string;
  const field = formData.get("field") as string;
  const suggestedValue = formData.get("suggestedValue") as string;
  if (!slug || !field || !suggestedValue) return;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return;
  if (field === "summary") {
    await prisma.project.update({ where: { id: project.id }, data: { summary: suggestedValue } });
  } else if (field === "type") {
    await prisma.project.update({
      where: { id: project.id },
      data: { type: suggestedValue as "SOFTWARE" | "ROBOTICS" | "HARDWARE" | "RESEARCH" },
    });
  } else if (field === "techTags") {
    let tags: string[] = [];
    try { tags = JSON.parse(suggestedValue) as string[]; } catch { /* leave empty */ }
    await prisma.project.update({ where: { id: project.id }, data: { techTags: tags } });
  }
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function createSeriesDrafts(reportId: string, formData: FormData): Promise<void> {
  const postsJson = formData.get("posts") as string;
  let posts: { title: string; tags: string[] }[];
  try {
    posts = JSON.parse(postsJson) as { title: string; tags: string[] }[];
  } catch {
    return;
  }
  const toSlug = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const tagNames = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const existingTags = await prisma.tag.findMany({
    where: { name: { in: tagNames } },
    select: { id: true, name: true },
  });
  const tagMap = new Map(existingTags.map((t) => [t.name, t.id]));
  const newTagNames = tagNames.filter((n) => !tagMap.has(n));
  if (newTagNames.length > 0) {
    await prisma.tag.createMany({
      data: newTagNames.map((n) => ({ name: n, slug: toSlug(n) })),
      skipDuplicates: true,
    });
    const created = await prisma.tag.findMany({
      where: { name: { in: newTagNames } },
      select: { id: true, name: true },
    });
    for (const t of created) tagMap.set(t.name, t.id);
  }
  for (const post of posts) {
    const baseSlug = toSlug(post.title);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.post.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }
    await prisma.post.create({
      data: {
        title: post.title,
        slug,
        content: "",
        status: "DRAFT",
        tags: {
          connect: post.tags
            .map((n) => tagMap.get(n))
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
      },
    });
  }
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
```

- [ ] **Step 2: Create `ReportHeader.tsx`**

```typescript
import Link from "next/link";
import type { AgentReport, Agent } from "@prisma/client";

interface Props {
  report: AgentReport & { agent: Agent };
  markRead: () => Promise<void>;
}

export default function ReportHeader({ report, markRead }: Props) {
  return (
    <div className="mb-6">
      <Link
        href={`/admin/agents/${report.agentId}`}
        className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors"
      >
        ← {report.agent.name}
      </Link>
      <div className="flex items-start justify-between mt-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{report.title}</h1>
          <p className="text-slate-500 text-xs font-mono mt-1">
            {report.createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {report.readAt ? " · read" : " · unread"}
          </p>
        </div>
        {!report.readAt && (
          <form action={markRead} className="flex-shrink-0 mt-1">
            <button type="submit" className="btn-secondary text-xs py-1.5 px-3">
              Mark as read
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `SkillsDiffReport.tsx`**

This component renders the full skills diff UI (add, upgrade, stale sections). Copy the `{skillsDiff && (...)}` block from `page.tsx` into this component. It receives the data and bound server actions as props.

The JSX for this component spans ~200 lines in the original `page.tsx`. The full file is:

```typescript
import type { SkillsDiffRawData } from "@/types/agent-reports";

interface Props {
  data: SkillsDiffRawData;
  appliedSkillNames: Set<string>;
  skillIdByName: Map<string, string>;
  reportId: string;
  applyAdd: (formData: FormData) => Promise<void>;
  applyAllAdditions: (formData: FormData) => Promise<void>;
  applyUpgrade: (formData: FormData) => Promise<void>;
  dismissStale: (formData: FormData) => Promise<void>;
}

export default function SkillsDiffReport({
  data,
  appliedSkillNames,
  skillIdByName,
  reportId,
  applyAdd,
  applyAllAdditions,
  applyUpgrade,
  dismissStale,
}: Props) {
  return (
    <div className="space-y-6 mb-6">
      {/* Copy the full {skillsDiff && (...)} JSX block from page.tsx verbatim here.
          Replace every occurrence of:
            skillsDiff        → data
            applySkillAdd     → applyAdd
            applyAllSkillAdditions → applyAllAdditions
            applySkillUpgrade → applyUpgrade
            dismissStaleSkill → dismissStale
          appliedSkillNames and skillIdByName come from props unchanged. */}
    </div>
  );
}
```

- [ ] **Step 4: Create the remaining 6 report components**

Apply the same pattern for each. Copy the corresponding JSX block from `page.tsx`, replace action names with prop names:

| Component | Data prop type | Actions props |
|-----------|---------------|---------------|
| `ProjectSuggestionsReport` | `ProjectSuggestionsRawData` | `createDraft(formData)`, `createSeriesDrafts(formData)` |
| `ProjectCreatedReport` | `ProjectCreatedRawData` | none (read-only, shows redirect confirmation) |
| `ProjectSyncDiffReport` | `ProjectSyncDiffRawData` | `applyUpdate(formData)` |
| `GitHubAuditReport` | `GitHubAuditRawData` | none (read-only) |
| `BrandMonitorReport` | `BrandMonitorRawData` | none (read-only) |
| `BlogSuggesterReport` | `BlogSuggesterRawData` | `createSeriesDrafts(formData)` |
| `RoboticsDigestReport` | `RoboticsDigestRawData` | none (read-only) |
| `PlatformSyncReport` | `PlatformSyncRawData` | none (read-only) |

Also add `ProjectCreatedReport` to the imports and conditional render in `page.tsx` (Step 5), following the same pattern as the others.

Each component file has the same shape as `SkillsDiffReport.tsx`: a default export that receives typed data + bound action props and returns JSX copied verbatim from the original page.

- [ ] **Step 5: Replace `page.tsx` with thin dispatcher**

```typescript
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRecord } from "@/types/agent-reports";
import type {
  SkillsDiffRawData, ProjectSuggestionsRawData, ProjectSyncDiffRawData,
  BrandMonitorRawData, BlogSuggesterRawData,
} from "@/types/agent-reports";
import type { GitHubAuditRawData } from "@/lib/agents/github-summarizer";
import type { RoboticsDigestRawData } from "@/lib/agents/robotics-news";
import type { PlatformSyncRawData } from "@/lib/agents/platform-sync";
import * as actions from "./actions";
import { ErrorParamCleaner } from "./ErrorParamCleaner";
import ReportHeader from "@/components/admin/reports/ReportHeader";
import SkillsDiffReport from "@/components/admin/reports/SkillsDiffReport";
import ProjectSuggestionsReport from "@/components/admin/reports/ProjectSuggestionsReport";
import ProjectSyncDiffReport from "@/components/admin/reports/ProjectSyncDiffReport";
import GitHubAuditReport from "@/components/admin/reports/GitHubAuditReport";
import BrandMonitorReport from "@/components/admin/reports/BrandMonitorReport";
import BlogSuggesterReport from "@/components/admin/reports/BlogSuggesterReport";
import RoboticsDigestReport from "@/components/admin/reports/RoboticsDigestReport";
import PlatformSyncReport from "@/components/admin/reports/PlatformSyncReport";

export const metadata: Metadata = { title: "Report" };

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: { reportId: string };
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { reportId } = params;

  const [report, currentSkills, currentProjects] = await Promise.all([
    prisma.agentReport.findUnique({
      where: { id: reportId },
      include: { agent: true },
    }),
    prisma.skill.findMany({ select: { id: true, name: true } }),
    prisma.project.findMany({ select: { slug: true, githubUrl: true } }),
  ]);
  if (!report) notFound();

  const appliedSkillNames = new Set(currentSkills.map((s) => s.name.toLowerCase()));
  const skillIdByName = new Map(currentSkills.map((s) => [s.name.toLowerCase(), s.id]));
  const existingProjectSlugs = new Set(currentProjects.map((p) => p.slug.toLowerCase()));
  const existingProjectGithubUrls = new Set(
    currentProjects.map((p) => p.githubUrl?.toLowerCase()).filter(Boolean)
  );

  const rawData = isRecord(report.rawData) ? report.rawData : null;
  const rawDataType = rawData ? rawData.type : null;

  const skillsDiff =
    report.agent.type === "SKILLS_INFERENCE" && rawDataType === "SKILLS_DIFF"
      ? (rawData as unknown as SkillsDiffRawData)
      : null;

  const projectSuggestions =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SUGGESTIONS"
      ? (rawData as unknown as ProjectSuggestionsRawData)
      : null;

  const projectSyncDiff =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SYNC_DIFF"
      ? (rawData as unknown as ProjectSyncDiffRawData)
      : null;

  const githubAudit =
    report.agent.type === "GITHUB_SUMMARIZER" && rawDataType === "GITHUB_AUDIT"
      ? (rawData as unknown as GitHubAuditRawData)
      : null;

  const brandMonitorData =
    report.agent.type === "BRAND_MONITOR" && rawData !== null &&
    ("githubDelta" in rawData || "googleAlerts" in rawData || "devToMentions" in rawData)
      ? (rawData as unknown as BrandMonitorRawData)
      : null;

  const blogSuggesterData =
    report.agent.type === "BLOG_SUGGESTER" && rawData !== null && Array.isArray(rawData.suggestions)
      ? (rawData as unknown as BlogSuggesterRawData)
      : null;

  const roboticsDigestData =
    report.agent.type === "ROBOTICS_NEWS" && rawDataType === "ROBOTICS_DIGEST"
      ? (rawData as unknown as RoboticsDigestRawData)
      : null;

  const platformSyncData =
    report.agent.type === "PLATFORM_SYNC" && rawData !== null && "configuredPlatforms" in rawData
      ? (rawData as unknown as PlatformSyncRawData)
      : null;

  return (
    <div className="max-w-4xl">
      <ErrorParamCleaner hasError={!!searchParams.error} />
      {searchParams.error === "slug-exists" && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          A project with this slug already exists —{" "}
          <a href="/admin/projects" className="underline hover:text-red-300">
            edit the slug in the Projects page
          </a>{" "}
          before trying again.
        </div>
      )}

      <ReportHeader report={report} markRead={actions.markRead.bind(null, reportId)} />

      {skillsDiff && (
        <SkillsDiffReport
          data={skillsDiff}
          appliedSkillNames={appliedSkillNames}
          skillIdByName={skillIdByName}
          reportId={reportId}
          applyAdd={actions.applySkillAdd.bind(null, reportId)}
          applyAllAdditions={actions.applyAllSkillAdditions.bind(null, reportId)}
          applyUpgrade={actions.applySkillUpgrade.bind(null, reportId)}
          dismissStale={actions.dismissStaleSkill.bind(null, reportId)}
        />
      )}
      {projectSuggestions && (
        <ProjectSuggestionsReport
          data={projectSuggestions}
          existingProjectSlugs={existingProjectSlugs}
          existingProjectGithubUrls={existingProjectGithubUrls}
          createDraft={actions.createProjectDraft.bind(null, reportId)}
        />
      )}
      {projectSyncDiff && (
        <ProjectSyncDiffReport
          data={projectSyncDiff}
          applyUpdate={actions.applyProjectSyncUpdate.bind(null, reportId)}
        />
      )}
      {githubAudit && <GitHubAuditReport data={githubAudit} />}
      {brandMonitorData && <BrandMonitorReport data={brandMonitorData} />}
      {blogSuggesterData && (
        <BlogSuggesterReport
          data={blogSuggesterData}
          createSeriesDrafts={actions.createSeriesDrafts.bind(null, reportId)}
        />
      )}
      {roboticsDigestData && <RoboticsDigestReport data={roboticsDigestData} />}
      {platformSyncData && <PlatformSyncReport data={platformSyncData} />}
    </div>
  );
}
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If `actions.ts` has type errors around `redirect()` inside try/catch, wrap in `if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;` before rethrowing.

- [ ] **Step 7: Run full test suite**

```bash
npm test
```

Expected: all tests pass (admin-routes-guard test verifies `actions.ts` doesn't need `requireAdminSession` since it's called from an already-guarded page, not an API route — add the path to `KNOWN_EXCEPTIONS` in the test if it erroneously fails).

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/\(panel\)/agents/reports/ src/components/admin/reports/
git commit -m "refactor(reports): split 1492-line report page into actions.ts + 9 report components"
```

---

## Task 10: Refactor Agent CLI Runners

**Files:**
- Modify: `agents/github-summarizer.ts`
- Modify: `agents/blog-suggester.ts`
- Modify: `agents/brand-monitor.ts`
- Modify: `agents/robotics-news.ts`
- Modify: `agents/skills-inference.ts`
- Modify: `agents/github-project-importer.ts`
- Modify: `agents/platform-sync.ts`

- [ ] **Step 1: Replace `agents/github-summarizer.ts`**

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runGithubSummarizer } from "../src/lib/agents/github-summarizer";

runAgent(
  {
    id: "agent-github-summarizer",
    name: "GitHub Summarizer",
    type: "GITHUB_SUMMARIZER",
    description: "Summarizes recent public GitHub activity",
    schedule: "0 9 * * 1",
    config: { username: process.env.GITHUB_USERNAME ?? "" },
  },
  runGithubSummarizer
).catch((e) => {
  console.error("[github-summarizer] Error:", e);
  process.exit(1);
});
```

- [ ] **Step 2: Replace `agents/blog-suggester.ts`**

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runBlogSuggester } from "../src/lib/agents/blog-suggester";

runAgent(
  {
    id: "agent-blog-suggester",
    name: "Blog Topic Suggester",
    type: "BLOG_SUGGESTER",
    description: "Suggests new blog post topics based on existing content",
    schedule: "0 10 * * 1",
  },
  runBlogSuggester
).catch((e) => {
  console.error("[blog-suggester] Error:", e);
  process.exit(1);
});
```

- [ ] **Step 3: Replace `agents/brand-monitor.ts`**

Read the existing `agents/brand-monitor.ts` to verify the agent ID, name, and schedule, then replace:

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runBrandMonitor } from "../src/lib/agents/brand-monitor";

runAgent(
  {
    id: "agent-brand-monitor",
    name: "Brand Monitor",
    type: "BRAND_MONITOR",
    description: "Monitors brand mentions across GitHub, Google, and Dev.to",
    schedule: "0 8 * * *",
  },
  runBrandMonitor
).catch((e) => {
  console.error("[brand-monitor] Error:", e);
  process.exit(1);
});
```

- [ ] **Step 4: Replace `agents/robotics-news.ts`**

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runRoboticsNews } from "../src/lib/agents/robotics-news";

runAgent(
  {
    id: "agent-robotics-news",
    name: "Robotics News Digest",
    type: "ROBOTICS_NEWS",
    description: "Curates robotics and embedded systems news",
    schedule: "0 7 * * 1",
  },
  runRoboticsNews
).catch((e) => {
  console.error("[robotics-news] Error:", e);
  process.exit(1);
});
```

- [ ] **Step 5: Replace `agents/skills-inference.ts`**

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runSkillsInference } from "../src/lib/agents/skills-inference";

runAgent(
  {
    id: "agent-skills-inference",
    name: "Skills Inference",
    type: "SKILLS_INFERENCE",
    description: "Infers skill changes from recent GitHub activity and blog posts",
    schedule: "0 9 * * 2",
  },
  runSkillsInference
).catch((e) => {
  console.error("[skills-inference] Error:", e);
  process.exit(1);
});
```

- [ ] **Step 6: Replace `agents/github-project-importer.ts`**

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runGithubProjectImporter } from "../src/lib/agents/github-project-importer";

runAgent(
  {
    id: "agent-github-project-importer",
    name: "GitHub Project Importer",
    type: "GITHUB_PROJECT_IMPORTER",
    description: "Syncs GitHub repos as portfolio projects",
    schedule: "0 10 * * 2",
  },
  runGithubProjectImporter
).catch((e) => {
  console.error("[github-project-importer] Error:", e);
  process.exit(1);
});
```

- [ ] **Step 7: Replace `agents/platform-sync.ts`**

```typescript
import { runAgent } from "../src/lib/agents/run-agent";
import { runPlatformSync } from "../src/lib/agents/platform-sync";

runAgent(
  {
    id: "agent-platform-sync",
    name: "Platform Sync",
    type: "PLATFORM_SYNC",
    description: "Checks consistency across GitHub, LinkedIn, and portfolio DB",
    schedule: "0 11 * * 3",
  },
  runPlatformSync
).catch((e) => {
  console.error("[platform-sync] Error:", e);
  process.exit(1);
});
```

> **Note:** Verify agent IDs, schedules, and configs match the existing runners exactly before committing. If any runner passes extra config (e.g. `github-summarizer` passes `config: { username }`), preserve that in the `config` field.

- [ ] **Step 8: Type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 10: Commit**

```bash
git add agents/
git commit -m "refactor(agents): all 7 CLI runners use runAgent wrapper — remove 35-line boilerplate each"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all tests pass. Confirm test count is higher than the starting 119 (should be ~135+ with the new hook and utility tests).

- [ ] **Step 4: Verify line counts of the major files are reduced**

```bash
wc -l src/components/admin/CareerEvaluateForm.tsx \
       src/app/admin/\(panel\)/agents/reports/\[reportId\]/page.tsx \
       agents/github-summarizer.ts
```

Expected:
- `CareerEvaluateForm.tsx`: ≤ 15 lines
- `page.tsx`: ≤ 120 lines
- `github-summarizer.ts`: ≤ 20 lines

- [ ] **Step 5: Open a PR from `refactor/aggressive-cleanup` to `main`**

```bash
git push -u origin refactor/aggressive-cleanup
gh pr create \
  --title "refactor: aggressive codebase cleanup — hooks, utilities, component splits" \
  --body "$(cat <<'EOF'
## Summary
- Extract \`usePollJob\` and \`useAutoSave\` hooks, eliminating polling duplication
- Extract \`career-ops-client\` server utility, removing repeated proxy boilerplate from 4 routes
- Extract \`runAgent\` CLI wrapper, reducing 7 agent runners from ~35 lines to ~15 lines each
- Split \`CareerEvaluateForm\` (806 lines) into 3 focused panels
- Split report page (1,492 lines) into \`actions.ts\` + 9 per-type report components
- No behaviour changes — all existing tests pass, new hook/utility tests added

## Test plan
- [ ] All existing tests pass (\`npm test\`)
- [ ] No TypeScript errors (\`npx tsc --noEmit\`)
- [ ] No lint errors (\`npm run lint\`)
- [ ] Admin Career panel renders and saves config correctly
- [ ] Job evaluation polling works end-to-end
- [ ] CV generation and publish work end-to-end
- [ ] Agent report pages render correctly for each report type

🤖 Generated with [Claude Code](https://claude.ai/claude-code)
EOF
)"
```
