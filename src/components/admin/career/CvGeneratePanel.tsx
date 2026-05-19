"use client";

import { useState } from "react";
import { usePollJob } from "@/hooks/usePollJob";
import type { JobStatus, PublishResponse, EvaluateResponse } from "@/types/career";
import { STATUS_COLORS } from "./shared";

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
      const data = (await res.json()) as EvaluateResponse;
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
