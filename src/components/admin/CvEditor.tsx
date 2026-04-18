"use client";

import { useState, useEffect, useRef } from "react";
import type { CvContent } from "@/lib/cv-template";

interface DbExperience {
  id: string;
  company: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  type: string;
  location: string | null;
  order: number;
}

interface DbSkill {
  id: string;
  name: string;
  category: string;
  level: string | null;
  order: number;
}

interface DbProject {
  id: string;
  title: string;
  slug: string;
  summary: string;
  techTags: string[];
  featured: boolean;
}

const IT_CATEGORIES = [
  "Languages",
  "Frameworks & Libraries",
  "Databases",
  "Tools & Platforms",
  "Concepts",
];

const CAT_TO_DB: Record<string, string> = {
  Languages: "LANGUAGES",
  "Frameworks & Libraries": "FRAMEWORKS",
  Databases: "DATABASES",
  "Tools & Platforms": "TOOLS",
  Concepts: "CONCEPTS",
};

const DB_TO_CAT: Record<string, string> = {
  LANGUAGES: "Languages",
  FRAMEWORKS: "Frameworks & Libraries",
  DATABASES: "Databases",
  TOOLS: "Tools & Platforms",
  CONCEPTS: "Concepts",
};

const EXP_TYPES = ["FULLTIME", "PARTTIME", "CONTRACT", "INTERNSHIP", "VOLUNTEER"];
const EXP_TYPE_LABELS: Record<string, string> = {
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

interface Props {
  initialContent: CvContent | null;
}

export default function CvEditor({ initialContent }: Props) {
  const [summary, setSummary] = useState(initialContent?.summary ?? "");
  const [experiences, setExperiences] = useState<DbExperience[]>([]);
  const [skills, setSkills] = useState<DbSkill[]>([]);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState({ experience: true, skills: true, projects: true });
  const [dirty, setDirty] = useState({ summary: false, experience: false, projects: false, skills: false });
  const [saveState, setSaveState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [newSkillInputs, setNewSkillInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirtyExpIds = useRef(new Set<string>());
  const dirtyProjectIds = useRef(new Set<string>());
  const deletedSkillIds = useRef(new Set<string>());
  const pendingNewSkills = useRef<{ name: string; category: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/experience").then((r) => r.json()),
      fetch("/api/admin/skills").then((r) => r.json()),
      fetch("/api/admin/projects").then((r) => r.json()),
    ])
      .then(([expData, skillData, projData]) => {
        setExperiences(Array.isArray(expData) ? expData : []);
        setSkills(Array.isArray(skillData) ? skillData : []);
        setProjects(Array.isArray(projData) ? projData : []);
      })
      .catch(() => {})
      .finally(() => setLoading({ experience: false, skills: false, projects: false }));
  }, []);

  function updateExp(id: string, field: keyof DbExperience, value: string | boolean | null) {
    setExperiences((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    dirtyExpIds.current.add(id);
    setDirty((d) => ({ ...d, experience: true }));
  }

  function moveExp(index: number, dir: -1 | 1) {
    setExperiences((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      dirtyExpIds.current.add(next[index].id);
      dirtyExpIds.current.add(next[target].id);
      return next;
    });
    setDirty((d) => ({ ...d, experience: true }));
  }

  async function deleteExp(id: string) {
    await fetch(`/api/admin/experience/${id}`, { method: "DELETE" });
    setExperiences((prev) => prev.filter((e) => e.id !== id));
    dirtyExpIds.current.delete(id);
  }

  function toggleProject(id: string, featured: boolean) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, featured } : p)));
    dirtyProjectIds.current.add(id);
    setDirty((d) => ({ ...d, projects: true }));
  }

  function deleteSkill(id: string) {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    deletedSkillIds.current.add(id);
    setDirty((d) => ({ ...d, skills: true }));
  }

  function addSkill(displayCat: string) {
    const input = (newSkillInputs[displayCat] ?? "").trim();
    if (!input) return;
    const dbCat = CAT_TO_DB[displayCat] ?? displayCat;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setSkills((prev) => [...prev, { id: tempId, name: input, category: dbCat, level: null, order: 0 }]);
    pendingNewSkills.current.push({ name: input, category: dbCat });
    setNewSkillInputs((prev) => ({ ...prev, [displayCat]: "" }));
    setDirty((d) => ({ ...d, skills: true }));
  }

  function buildCvContent(): CvContent {
    const skillMap = new Map<string, string[]>();
    for (const skill of skills) {
      const cat = DB_TO_CAT[skill.category] ?? skill.category;
      skillMap.set(cat, [...(skillMap.get(cat) ?? []), skill.name]);
    }

    return {
      summary,
      skills: Array.from(skillMap.entries()).map(([category, items]) => ({ category, items })),
      experience: experiences.map((exp) => {
        const fmt = (iso: string | null) => {
          if (!iso) return "";
          const d = new Date(iso);
          return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
        };
        return {
          company: exp.company,
          role: exp.role,
          period: `${fmt(exp.startDate)} – ${exp.current ? "Present" : fmt(exp.endDate) || "Present"}`,
          description: exp.description,
          type: EXP_TYPE_LABELS[exp.type] ?? exp.type,
        };
      }),
      projects: projects
        .filter((p) => p.featured)
        .map((p) => ({ title: p.title, summary: p.summary, tech: p.techTags })),
      contact: initialContent?.contact ?? { email: "" },
    };
  }

  async function handleSaveAll() {
    setSaveState("saving");
    try {
      const cvContent = buildCvContent();

      await fetch("/api/admin/cv", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvContent }),
      });

      await Promise.all([
        ...experiences
          .filter((e) => dirtyExpIds.current.has(e.id))
          .map((e, i) =>
            fetch(`/api/admin/experience/${e.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ...e, order: i }),
            })
          ),
        ...projects
          .filter((p) => dirtyProjectIds.current.has(p.id))
          .map((p) =>
            fetch(`/api/admin/projects/${p.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ featured: p.featured }),
            })
          ),
        ...Array.from(deletedSkillIds.current).map((id) =>
          fetch(`/api/admin/skills/${id}`, { method: "DELETE" })
        ),
        ...pendingNewSkills.current.map((s) =>
          fetch("/api/admin/skills", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s),
          })
        ),
      ]);

      const renderRes = await fetch("/api/admin/cv/render", { method: "POST" });
      if (!renderRes.ok) throw new Error("Render failed");

      dirtyExpIds.current.clear();
      dirtyProjectIds.current.clear();
      deletedSkillIds.current.clear();
      pendingNewSkills.current = [];
      setDirty({ summary: false, experience: false, projects: false, skills: false });
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
      const res = await fetch("/api/admin/cv/upload", { method: "POST", body: formData });
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

  const anyDirty = Object.values(dirty).some(Boolean);

  const skillsByCategory = IT_CATEGORIES.reduce<Record<string, DbSkill[]>>((acc, cat) => {
    const dbCat = CAT_TO_DB[cat];
    acc[cat] = skills.filter((s) => s.category === dbCat);
    return acc;
  }, {});
  const knownDbCats = new Set(Object.values(CAT_TO_DB));
  const uncategorized = skills.filter((s) => !knownDbCats.has(s.category));

  return (
    <div className="space-y-6">
      {/* Save all */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSaveAll}
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
            : "Save all & Render PDF"}
        </button>
        {anyDirty && saveState === "idle" && (
          <span className="text-xs text-amber-400 font-mono">Unsaved changes</span>
        )}
      </div>

      {/* Summary */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-3 uppercase tracking-widest font-mono flex items-center gap-2">
          Profile Summary
          {dirty.summary && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Unsaved" />}
        </h2>
        <textarea
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            setDirty((d) => ({ ...d, summary: true }));
          }}
          rows={4}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
          placeholder="Write a 2–3 sentence professional summary..."
        />
      </div>

      {/* Skills */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-widest font-mono flex items-center gap-2">
          Skills
          {dirty.skills && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Unsaved" />}
        </h2>
        {loading.skills ? (
          <p className="text-slate-500 text-sm font-mono">Loading…</p>
        ) : (
          <div className="space-y-5">
            {IT_CATEGORIES.map((cat) => (
              <div key={cat}>
                <p className="text-xs text-slate-400 font-medium mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(skillsByCategory[cat] ?? []).map((skill) => (
                    <span key={skill.id} className="tag text-xs flex items-center gap-1.5 pr-1">
                      {skill.name}
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors leading-none ml-0.5"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(skillsByCategory[cat] ?? []).length === 0 && (
                    <span className="text-xs text-slate-600 italic">None yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkillInputs[cat] ?? ""}
                    onChange={(e) =>
                      setNewSkillInputs((prev) => ({ ...prev, [cat]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(cat);
                      }
                    }}
                    placeholder={`Add to ${cat}…`}
                    className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button
                    onClick={() => addSkill(cat)}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
            {uncategorized.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 font-medium mb-2">Other</p>
                <div className="flex flex-wrap gap-2">
                  {uncategorized.map((skill) => (
                    <span key={skill.id} className="tag text-xs flex items-center gap-1.5 pr-1">
                      {skill.name}
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors leading-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Experience */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-4 uppercase tracking-widest font-mono flex items-center gap-2">
          Experience
          {dirty.experience && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Unsaved" />}
        </h2>
        {loading.experience ? (
          <p className="text-slate-500 text-sm font-mono">Loading…</p>
        ) : experiences.length === 0 ? (
          <p className="text-slate-500 text-sm">No experience entries. Add them in the Experience page.</p>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp, i) => (
              <div key={exp.id} className="border border-[#2a2d3a] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => moveExp(i, -1)}
                      disabled={i === 0}
                      className="text-slate-600 hover:text-slate-300 disabled:opacity-30 text-xs px-1.5 py-0.5 rounded transition-colors"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveExp(i, 1)}
                      disabled={i === experiences.length - 1}
                      className="text-slate-600 hover:text-slate-300 disabled:opacity-30 text-xs px-1.5 py-0.5 rounded transition-colors"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    onClick={() => deleteExp(exp.id)}
                    className="text-xs text-slate-600 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Company</label>
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => updateExp(exp.id, "company", e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Role</label>
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => updateExp(exp.id, "role", e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Start date</label>
                    <input
                      type="date"
                      value={exp.startDate ? exp.startDate.slice(0, 10) : ""}
                      onChange={(e) => updateExp(exp.id, "startDate", e.target.value)}
                      className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">End date</label>
                    <input
                      type="date"
                      value={exp.endDate ? exp.endDate.slice(0, 10) : ""}
                      disabled={exp.current}
                      onChange={(e) => updateExp(exp.id, "endDate", e.target.value || null)}
                      className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 disabled:opacity-40"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) => updateExp(exp.id, "current", e.target.checked)}
                      className="accent-cyan-500"
                    />
                    Current role
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Type:</span>
                    <select
                      value={exp.type}
                      onChange={(e) => updateExp(exp.id, "type", e.target.value)}
                      className="bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      {EXP_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {EXP_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Description</label>
                  <textarea
                    value={exp.description}
                    onChange={(e) => updateExp(exp.id, "description", e.target.value)}
                    rows={3}
                    className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 resize-y font-mono"
                    placeholder="• Architected...&#10;• Implemented..."
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-100 mb-1 uppercase tracking-widest font-mono flex items-center gap-2">
          Projects
          {dirty.projects && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Unsaved" />}
        </h2>
        <p className="text-xs text-slate-500 mb-3">Check &ldquo;Show in CV&rdquo; to include a project in the generated PDF.</p>
        {loading.projects ? (
          <p className="text-slate-500 text-sm font-mono">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="text-slate-500 text-sm">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((proj) => (
              <label key={proj.id} className="flex items-start gap-3 cursor-pointer group py-1">
                <input
                  type="checkbox"
                  checked={proj.featured}
                  onChange={(e) => toggleProject(proj.id, e.target.checked)}
                  className="mt-0.5 accent-cyan-500 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors truncate">
                    {proj.title}
                  </p>
                  {proj.techTags.length > 0 && (
                    <p className="text-xs text-slate-600 font-mono truncate">{proj.techTags.join(" · ")}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Manual Upload */}
      <details className="card">
        <summary className="p-4 cursor-pointer text-sm text-slate-400 hover:text-slate-200 transition-colors select-none">
          Upload manual PDF
        </summary>
        <div className="px-4 pb-4 pt-2 border-t border-[#2a2d3a]">
          <p className="text-xs text-slate-500 mb-3">Upload a hand-crafted PDF to replace the generated one. Max 5 MB.</p>
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
