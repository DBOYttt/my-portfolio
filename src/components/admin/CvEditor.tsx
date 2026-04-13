"use client";

import { useState, useRef } from "react";
import type { CvContent } from "@/lib/cv-template";

interface Props {
  initialContent: CvContent | null;
}

export default function CvEditor({ initialContent }: Props) {
  const [content, setContent] = useState<CvContent | null>(initialContent);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!content) {
    return (
      <div className="card p-8 text-center">
        <p className="text-slate-500 font-mono text-sm">
          Run &ldquo;Regenerate from DB&rdquo; to generate your CV.
        </p>
        <p className="text-slate-600 text-xs mt-2">
          The CV Generator agent reads your Skills, Experience, and Projects from the database.
        </p>
      </div>
    );
  }

  function updateSummary(value: string) {
    setContent((prev) => (prev ? { ...prev, summary: value } : prev));
  }

  function updateExperience(
    index: number,
    field: "company" | "role" | "period",
    value: string
  ) {
    setContent((prev) => {
      if (!prev) return prev;
      const experience = prev.experience.map((exp, i) =>
        i === index ? { ...exp, [field]: value } : exp
      );
      return { ...prev, experience };
    });
  }

  function toggleProject(index: number, included: boolean) {
    setContent((prev) => {
      if (!prev) return prev;
      if (included) {
        // Restore from initialContent if we have it
        if (initialContent) {
          const original = initialContent.projects[index];
          if (!original) return prev;
          const projects = [...prev.projects];
          projects.splice(index, 0, original);
          return { ...prev, projects };
        }
        return prev;
      } else {
        const projects = prev.projects.filter((_, i) => i !== index);
        return { ...prev, projects };
      }
    });
  }

  async function handleSaveAndRender() {
    if (!content) return;
    setSaveState("saving");
    try {
      const putRes = await fetch("/api/admin/cv", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvContent: content }),
      });
      if (!putRes.ok) throw new Error("Save failed");

      const renderRes = await fetch("/api/admin/cv/render", { method: "POST" });
      if (!renderRes.ok) throw new Error("Render failed");

      setSaveState("done");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadState("uploading");
    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const res = await fetch("/api/admin/cv/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Upload failed");
      }

      setUploadState("done");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setUploadState("idle"), 2500);
    } catch {
      setUploadState("error");
      setTimeout(() => setUploadState("idle"), 3000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-3 uppercase tracking-widest font-mono">
          Profile Summary
        </h2>
        <textarea
          value={content.summary}
          onChange={(e) => updateSummary(e.target.value)}
          rows={4}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
          placeholder="Write a 2–3 sentence professional summary..."
        />
      </div>

      {/* Skills — read-only */}
      {content.skills.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-3 uppercase tracking-widest font-mono">
            Skills <span className="text-slate-600 normal-case tracking-normal font-normal">(edit in Skills page)</span>
          </h2>
          <div className="space-y-2">
            {content.skills.map((group, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-slate-400 w-28 flex-shrink-0 font-medium">
                  {group.category}
                </span>
                <span className="text-slate-500">{group.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience */}
      {content.experience.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-3 uppercase tracking-widest font-mono">
            Experience
          </h2>
          <div className="space-y-4">
            {content.experience.map((exp, i) => (
              <div key={i} className="border border-[#2a2d3a] rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExperience(i, "company", e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Period</label>
                    <input
                      type="text"
                      value={exp.period}
                      onChange={(e) => updateExperience(i, "period", e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Role</label>
                  <input
                    type="text"
                    value={exp.role}
                    onChange={(e) => updateExperience(i, "role", e.target.value)}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                <p className="text-xs text-slate-600 pl-0.5">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {initialContent && initialContent.projects.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-100 mb-3 uppercase tracking-widest font-mono">
            Projects
          </h2>
          <div className="space-y-2">
            {initialContent.projects.map((proj, i) => {
              const included = content.projects.some((p) => p.title === proj.title);
              return (
                <label key={i} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={(e) => toggleProject(i, e.target.checked)}
                    className="mt-0.5 accent-cyan-500"
                  />
                  <div>
                    <p className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                      {proj.title}
                    </p>
                    {proj.tech.length > 0 && (
                      <p className="text-xs text-slate-600 font-mono">
                        {proj.tech.join(" · ")}
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Save & Render */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSaveAndRender}
          disabled={saveState === "saving"}
          className={`btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            saveState === "done"
              ? "bg-green-600 border-green-600"
              : saveState === "error"
              ? "bg-red-600 border-red-600"
              : ""
          }`}
        >
          {saveState === "saving"
            ? "Saving & rendering…"
            : saveState === "done"
            ? "PDF regenerated!"
            : saveState === "error"
            ? "Error — try again"
            : "Save & Render PDF"}
        </button>
      </div>

      {/* Manual Upload */}
      <details className="card">
        <summary className="p-4 cursor-pointer text-sm text-slate-400 hover:text-slate-200 transition-colors select-none">
          Upload manual PDF
        </summary>
        <div className="px-4 pb-4 pt-2 border-t border-[#2a2d3a]">
          <p className="text-xs text-slate-500 mb-3">
            Upload a hand-crafted PDF to replace the generated one. Max 5 MB.
          </p>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-[#2a2d3a] file:bg-[#1a1d27] file:text-slate-300 file:text-xs file:cursor-pointer hover:file:border-cyan-500/50"
            />
            <button
              onClick={handleUpload}
              disabled={uploadState === "uploading"}
              className={`btn-secondary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                uploadState === "done"
                  ? "text-green-400 border-green-500/30 bg-green-500/10"
                  : uploadState === "error"
                  ? "text-red-400 border-red-500/30 bg-red-500/10"
                  : ""
              }`}
            >
              {uploadState === "uploading"
                ? "Uploading…"
                : uploadState === "done"
                ? "Manual PDF uploaded"
                : uploadState === "error"
                ? "Upload failed"
                : "Upload"}
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
