"use client";

import { useState, useRef, useCallback } from "react";

type JobStatus = "pending" | "running" | "done" | "error";

interface EvaluateResponse {
  jobId?: string;
  error?: string;
}

interface StatusResponse {
  status?: JobStatus;
  log?: string[];
  pdfPath?: string;
  error?: string;
}

interface PublishResponse {
  ok?: boolean;
  publishedAt?: string;
  error?: string;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  running: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  done: "text-green-400 bg-green-500/10 border-green-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function CareerEvaluateForm() {
  const [url, setUrl] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const logBoxRef = useRef<HTMLPreElement | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const POLL_MAX = 100; // 100 × 3 s = 5 min max

  const pollStatus = useCallback(
    (jobId: string) => {
      pollCountRef.current = 0;
      pollRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        if (pollCountRef.current >= POLL_MAX) {
          stopPolling();
          setEvaluating(false);
          setJobStatus("error");
          setLogLines((prev) => [...prev, "\nTimed out after 5 minutes."]);
          return;
        }

        try {
          const res = await fetch(`/api/admin/career/status/${jobId}`);
          const data = (await res.json()) as StatusResponse;

          if (data.log) {
            setLogLines(data.log);
            if (logBoxRef.current) {
              logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
            }
          }

          const knownStatuses: JobStatus[] = ["pending", "running", "done", "error"];
          const status = data.status && knownStatuses.includes(data.status) ? data.status : null;

          if (status) {
            setJobStatus(status);
            if (status === "done" || status === "error") {
              stopPolling();
              setEvaluating(false);
            }
          } else if (data.status) {
            stopPolling();
            setEvaluating(false);
            setJobStatus("error");
            setLogLines((prev) => [...prev, `\nUnexpected status: ${data.status}`]);
          }
        } catch {
          stopPolling();
          setEvaluating(false);
          setJobStatus("error");
        }
      }, 3000);
    },
    [stopPolling]
  );

  async function handleEvaluate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) return;

    stopPolling();
    setLogLines([]);
    setJobStatus("pending");
    setEvaluating(true);

    try {
      const res = await fetch("/api/admin/career/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as EvaluateResponse;

      if (!res.ok || !data.jobId) {
        setJobStatus("error");
        setLogLines([data.error ?? "Failed to start evaluation"]);
        setEvaluating(false);
        return;
      }

      setJobStatus("running");
      pollStatus(data.jobId);
    } catch {
      setJobStatus("error");
      setLogLines(["Network error — could not reach career-ops service"]);
      setEvaluating(false);
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
    <>
      {/* Section 1 — Evaluate */}
      <div className="card p-4 mb-6">
        <h2 className="text-slate-100 font-semibold mb-1">Evaluate a Job</h2>
        <p className="text-slate-500 text-xs font-mono mb-4">
          Submit a job posting URL for career-ops analysis
        </p>

        <form onSubmit={handleEvaluate} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/jobs/123"
            required
            disabled={evaluating}
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-slate-100 rounded px-3 py-2 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={evaluating || !url.trim()}
            className="px-4 py-2 rounded bg-cyan-500 text-[#0f1117] font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {evaluating ? "Running…" : "Evaluate"}
          </button>
        </form>

        {jobStatus && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-mono">Status:</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[jobStatus]}`}
              >
                {jobStatus}
              </span>
            </div>

            {logLines.length > 0 && (
              <pre
                ref={logBoxRef}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded p-3 text-xs font-mono text-slate-400 max-h-64 overflow-y-auto whitespace-pre-wrap break-words"
              >
                {logLines.join("")}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Section 2 — Publish CV */}
      <div className="card p-4 mb-6">
        <h2 className="text-slate-100 font-semibold mb-1">Publish Master CV</h2>
        <p className="text-slate-500 text-xs font-mono mb-4">
          Copy the master CV from the career-ops output volume to{" "}
          <span className="text-slate-300">public/cv.pdf</span>
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handlePublish}
            disabled={publishing || evaluating}
            className="px-4 py-2 rounded bg-cyan-500 text-[#0f1117] font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishing ? "Publishing…" : "Publish CV"}
          </button>

          {publishResult && (
            <p
              className={`text-sm font-mono ${
                publishResult.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {publishResult.message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
