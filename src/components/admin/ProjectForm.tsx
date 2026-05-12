"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useUnsavedChanges } from "./UnsavedChangesContext";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const PROJECT_TYPES = ["SOFTWARE", "ROBOTICS", "HARDWARE", "RESEARCH"] as const;
type ProjectType = (typeof PROJECT_TYPES)[number];

interface ProjectFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  type: ProjectType;
  techTags: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  order: number;
  coverImage: string;
  publishedAt: string | null;
}

interface ProjectFormProps {
  initialData?: Omit<Partial<ProjectFormData>, "publishedAt"> & { id?: string; publishedAt?: string | Date | null };
  projectId?: string;
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProjectForm({ initialData, projectId }: ProjectFormProps) {
  const router = useRouter();
  const { setDirty } = useUnsavedChanges();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!projectId);
  const [coverImageValid, setCoverImageValid] = useState(
    initialData?.coverImage ? /^https?:\/\/.+\..+/.test(initialData.coverImage) : false
  );
  const isDirty = useRef(false);

  const initialPublishedAt =
    initialData?.publishedAt != null
      ? typeof initialData.publishedAt === "string"
        ? initialData.publishedAt
        : (initialData.publishedAt as Date).toISOString()
      : null;

  const [form, setForm] = useState<ProjectFormData>({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    summary: initialData?.summary ?? "",
    content: initialData?.content ?? "",
    type: initialData?.type ?? "SOFTWARE",
    techTags: initialData?.techTags ?? [],
    githubUrl: initialData?.githubUrl ?? "",
    liveUrl: initialData?.liveUrl ?? "",
    featured: initialData?.featured ?? false,
    order: initialData?.order ?? 0,
    coverImage: initialData?.coverImage ?? "",
    publishedAt: initialPublishedAt,
  });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  function set<K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) {
    isDirty.current = true;
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(value: string) {
    isDirty.current = true;
    setDirty(true);
    set("title", value);
    if (!slugManuallyEdited) set("slug", toSlug(value));
  }

  function addTag() {
    isDirty.current = true;
    setDirty(true);
    const tag = tagInput.trim();
    if (tag && !form.techTags.includes(tag)) {
      set("techTags", [...form.techTags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    isDirty.current = true;
    setDirty(true);
    set("techTags", form.techTags.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        projectId ? `/api/admin/projects/${projectId}` : "/api/admin/projects",
        {
          method: projectId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, order: Number(form.order), publishedAt: form.publishedAt }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }
      isDirty.current = false;
      setDirty(false);
      setSaved(true);
      setTimeout(() => {
        router.push("/admin/projects");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              set("slug", e.target.value);
            }}
            required
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Summary</label>
        <textarea
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
          required
          rows={2}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Content</label>
        <div data-color-mode="dark">
          <MDEditor
            value={form.content}
            onChange={(val) => set("content", val ?? "")}
            height={400}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Type</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value as ProjectType)}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Order</label>
          <input
            type="number"
            value={form.order}
            onChange={(e) => set("order", parseInt(e.target.value) || 0)}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="w-4 h-4 accent-cyan-500"
            />
            Featured
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Tech tags</label>
        <div className="flex gap-1 flex-wrap mb-2">
          {form.techTags.map((tag) => (
            <span key={tag} className="tag flex items-center gap-1 text-xs">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-slate-500 hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag, press Enter"
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
          <button type="button" onClick={addTag} className="btn-secondary text-sm">
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">GitHub URL</label>
          <input
            type="url"
            value={form.githubUrl}
            onChange={(e) => set("githubUrl", e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Live URL</label>
          <input
            type="url"
            value={form.liveUrl}
            onChange={(e) => set("liveUrl", e.target.value)}
            className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Cover image URL</label>
        <input
          type="text"
          value={form.coverImage}
          onChange={(e) => {
            isDirty.current = true;
            setDirty(true);
            const value = e.target.value;
            setForm((prev) => ({ ...prev, coverImage: value }));
            setCoverImageValid(/^https?:\/\/.+\..+/.test(value));
          }}
          placeholder="/uploads/my-image.jpg"
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
        />
        {form.coverImage && coverImageValid && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.coverImage}
            alt="Cover preview"
            className="mt-2 rounded border border-[#2a2d3a] max-h-32 object-cover w-full"
            onError={() => setCoverImageValid(false)}
          />
        )}
        {form.coverImage && !coverImageValid && (
          <p className="text-red-400 text-xs mt-1">Invalid URL</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Status</label>
        <div className="flex items-center gap-3">
          <select
            value={form.publishedAt ? "PUBLISHED" : "DRAFT"}
            onChange={(e) => {
              isDirty.current = true;
              setDirty(true);
              if (e.target.value === "PUBLISHED") {
                setForm((prev) => ({ ...prev, publishedAt: prev.publishedAt ?? new Date().toISOString() }));
              } else {
                setForm((prev) => ({ ...prev, publishedAt: null }));
              }
            }}
            className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          {form.publishedAt ? (
            <span className="text-xs px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              Published
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
              Draft
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || saved}
          className={`btn-primary transition-colors ${saved ? "bg-cyan-600 border-cyan-600 hover:bg-cyan-600" : ""}`}
        >
          {saved ? "Saved ✓" : saving ? "Saving…" : projectId ? "Update project" : "Create project"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (isDirty.current && !window.confirm("Discard unsaved changes?")) {
              e.preventDefault();
              return;
            }
            router.push("/admin/projects");
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
