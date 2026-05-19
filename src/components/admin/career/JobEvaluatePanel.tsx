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
    setLogLines([]);
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
