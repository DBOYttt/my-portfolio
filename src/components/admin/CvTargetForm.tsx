"use client";

import { useState } from "react";
import type { TargetedRawData } from "@/lib/agents/cv-generator";

interface RunResult {
  ok: boolean;
  title?: string;
  rawData?: TargetedRawData;
  reportId?: string;
  error?: string;
}

export default function CvTargetForm() {
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  async function handleFetchUrl() {
    if (!jdUrl.trim()) return;
    setFetchingUrl(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/admin/cv/scrape-jd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        setFetchError(data.error ?? "Failed to scrape URL");
      } else {
        setJdText(data.text);
        setFetchError(null);
      }
    } catch {
      setFetchError("Network error — could not reach the server");
    } finally {
      setFetchingUrl(false);
    }
  }

  async function handleGenerate() {
    const jd = jdText.trim();
    if (!jd) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/cv/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "targeted", jobDescription: jd }),
      });
      const data = (await res.json()) as RunResult;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Network error — could not reach the server" });
    } finally {
      setGenerating(false);
    }
  }

  const variants = result?.rawData?.variants;
  const paths = result?.rawData?.targetedPdfPaths;
  const atsGap = result?.rawData?.atsKeywordGap;

  return (
    <div className="card p-4 space-y-4">
      <div>
        <h2 className="text-slate-100 text-sm font-semibold mb-1">Target to Job Description</h2>
        <p className="text-slate-500 text-xs">
          Generate two tailored CV variants (robotics-heavy and software-heavy) matched to a specific job.
          The portfolio CV is never overwritten.
        </p>
      </div>

      {/* URL scraper row */}
      <div>
        <label className="block text-xs text-slate-400 font-medium mb-1.5">
          Job description URL (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={jdUrl}
            onChange={(e) => setJdUrl(e.target.value)}
            placeholder="https://example.com/jobs/123"
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="button"
            onClick={handleFetchUrl}
            disabled={fetchingUrl || !jdUrl.trim()}
            className="btn-secondary text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {fetchingUrl ? "Fetching..." : "Fetch"}
          </button>
        </div>
        {fetchError && (
          <p className="mt-1.5 text-xs text-red-400">{fetchError}</p>
        )}
      </div>

      {/* JD textarea */}
      <div>
        <label className="block text-xs text-slate-400 font-medium mb-1.5">
          Job description text
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={8}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
        />
        <p className="mt-1 text-xs text-slate-600">
          {jdText.length} chars
        </p>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating || !jdText.trim()}
        className="btn-primary text-sm py-2 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? "Generating..." : "Generate targeted CV"}
      </button>

      {/* Error */}
      {result && !result.ok && (
        <div className="px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          {result.error ?? "Generation failed"}
        </div>
      )}

      {/* Success — PDF download links */}
      {result?.ok && paths && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400 font-medium">
            {result.title ?? "Targeted CVs generated"}
          </p>
          {result.reportId && (
            <a
              href={`/admin/agents/reports/${result.reportId}`}
              className="inline-block text-xs text-cyan-400 hover:underline"
            >
              View full report with ATS gap analysis →
            </a>
          )}
          <div className="flex flex-wrap gap-3">
            <a
              href={paths.robotics}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Robotics-heavy PDF
            </a>
            <a
              href={paths.software}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Software-heavy PDF
            </a>
          </div>

          {/* Quick ATS summary */}
          {atsGap && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="card p-3">
                <p className="text-xs text-emerald-400 font-medium mb-2">
                  Covered keywords ({atsGap.present.length})
                </p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {atsGap.present.slice(0, 20).map((kw) => (
                    <span
                      key={kw}
                      className="text-xs px-1.5 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    >
                      {kw}
                    </span>
                  ))}
                  {atsGap.present.length > 20 && (
                    <span className="text-xs text-slate-600">+{atsGap.present.length - 20} more</span>
                  )}
                </div>
              </div>
              <div className="card p-3">
                <p className="text-xs text-amber-400 font-medium mb-2">
                  Missing keywords ({atsGap.absent.length})
                </p>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {atsGap.absent.slice(0, 20).map((kw) => (
                    <span
                      key={kw}
                      className="text-xs px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/10 border-amber-500/20"
                    >
                      {kw}
                    </span>
                  ))}
                  {atsGap.absent.length > 20 && (
                    <span className="text-xs text-slate-600">+{atsGap.absent.length - 20} more</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Variant summaries */}
          {variants && (
            <div className="space-y-3 mt-2">
              <details className="card p-4">
                <summary className="text-sm text-slate-300 font-medium cursor-pointer select-none">
                  Robotics-heavy variant — profile preview
                </summary>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  {variants.robotics.summary}
                </p>
              </details>
              <details className="card p-4">
                <summary className="text-sm text-slate-300 font-medium cursor-pointer select-none">
                  Software-heavy variant — profile preview
                </summary>
                <p className="mt-3 text-xs text-slate-400 leading-relaxed">
                  {variants.software.summary}
                </p>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
