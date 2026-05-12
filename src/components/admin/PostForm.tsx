"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AgentSuggestPanel from "./AgentSuggestPanel";
import { useUnsavedChanges } from "./UnsavedChangesContext";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED";
  scheduledFor: string;
  seoTitle: string;
  seoDesc: string;
  tags: string[];
}

interface OutlineSection {
  heading: string;
  description: string;
}

interface PostFormProps {
  initialData?: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    status: string;
    scheduledFor: Date | string | null;
    seoTitle: string | null;
    seoDesc: string | null;
    tags: { name: string }[];
  };
  postId?: string;
}

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toDatetimeLocal(value: Date | string | null): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export default function PostForm({ initialData, postId }: PostFormProps) {
  const router = useRouter();
  const { setDirty } = useUnsavedChanges();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [showSeo, setShowSeo] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [generatingOutline, setGeneratingOutline] = useState(false);
  const [outline, setOutline] = useState<OutlineSection[] | null>(null);
  const [showOutlinePrompt, setShowOutlinePrompt] = useState(false);
  const isDirty = useRef(false);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const [form, setForm] = useState<PostFormData>({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    excerpt: initialData?.excerpt ?? "",
    content: initialData?.content ?? "",
    status: (initialData?.status as PostFormData["status"]) ?? "DRAFT",
    scheduledFor: toDatetimeLocal(initialData?.scheduledFor ?? null),
    seoTitle: initialData?.seoTitle ?? "",
    seoDesc: initialData?.seoDesc ?? "",
    tags: initialData?.tags.map((t) => t.name) ?? [],
  });

  function set(key: keyof PostFormData, value: string | string[]) {
    isDirty.current = true;
    setDirty(true);
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(value: string) {
    set("title", value);
    if (!slugManuallyEdited) set("slug", toSlug(value));
  }

  function addTag() {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set("tags", [...form.tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    set("tags", form.tags.filter((t) => t !== tag));
  }

  async function generateOutline() {
    if (!form.title.trim()) return;
    setGeneratingOutline(true);
    setError("");
    setOutline(null);
    try {
      const res = await fetch("/api/admin/blog/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, tags: form.tags }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to generate outline");
        return;
      }
      const data = await res.json() as { outline: OutlineSection[] };
      setOutline(data.outline);
      setShowOutlinePrompt(false);
    } catch {
      setError("Failed to generate outline");
    } finally {
      setGeneratingOutline(false);
    }
  }

  async function generateContent() {
    if (!form.title.trim()) return;
    setGeneratingContent(true);
    setOutline(null);
    setShowOutlinePrompt(false);
    setError("");
    try {
      const res = await fetch("/api/admin/blog/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, tags: form.tags, excerpt: form.excerpt }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Failed to generate content");
        return;
      }
      const data = await res.json() as { content: string };
      set("content", data.content);
    } catch {
      setError("Failed to generate content");
    } finally {
      setGeneratingContent(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        postId ? `/api/admin/posts/${postId}` : "/api/admin/posts",
        {
          method: postId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form }),
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
        router.push("/admin/blog");
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

      <div>
        <label className="block text-sm text-slate-400 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
        />
        <AgentSuggestPanel
          agentId="agent-blog-suggester"
          buttonLabel="💡 Suggest topics"
          className="mt-2"
          renderResult={(rawData) => {
            const data = rawData as { suggestions?: Array<{ title: string; tags: string[]; rationale: string }> };
            const suggestions = data?.suggestions ?? [];
            if (suggestions.length === 0)
              return <p className="text-slate-500 text-sm">No suggestions available.</p>;
            return (
              <div className="space-y-2">
                <p className="text-slate-500 text-xs font-mono">Click a suggestion to apply it:</p>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        set("title", s.title);
                        if (!slugManuallyEdited) set("slug", toSlug(s.title));
                        set("tags", (() => {
                          const existing = new Set(form.tags.map((t) => t.toLowerCase()));
                          const newTags = s.tags.filter((t) => !existing.has(t.toLowerCase()));
                          return [...form.tags, ...newTags];
                        })());
                        setOutline(null);
                        setShowOutlinePrompt(true);
                      }}
                      className="text-left p-3 rounded-lg border border-[#2a2d3a] hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-colors"
                    >
                      <p className="text-slate-100 text-sm font-medium">{s.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{s.rationale}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {s.tags.map((tag) => (
                          <span key={tag} className="tag text-xs">{tag}</span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }}
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

      <div>
        <label className="block text-sm text-slate-400 mb-1">Excerpt</label>
        <textarea
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          rows={2}
          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm text-slate-400">Content</label>
          <button
            type="button"
            onClick={generateContent}
            disabled={generatingContent || generatingOutline || !form.title.trim()}
            className="text-xs text-slate-500 hover:text-cyan-400 font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {generatingContent ? "Generating…" : "✍ Generate draft"}
          </button>
        </div>

        {/* BS-D: Outline prompt shown after suggestion pill click */}
        {showOutlinePrompt && !outline && (
          <div className="mb-3 flex items-center gap-2 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
            <p className="text-slate-400 text-xs flex-1">
              Generate an outline first to review structure before writing the full post.
            </p>
            <button
              type="button"
              onClick={generateOutline}
              disabled={generatingOutline || !form.title.trim()}
              className="btn-secondary text-xs px-2 py-1 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {generatingOutline ? "Outlining…" : "Generate outline"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowOutlinePrompt(false);
                generateContent();
              }}
              disabled={generatingContent || !form.title.trim()}
              className="text-xs text-slate-500 hover:text-slate-300 flex-shrink-0 disabled:opacity-40"
            >
              Skip
            </button>
          </div>
        )}

        {/* BS-D: Outline preview card */}
        {outline && outline.length > 0 && (
          <div className="mb-3 rounded-lg border border-[#2a2d3a] bg-[#1a1d27] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2d3a]">
              <p className="text-slate-300 text-xs font-medium">Outline preview</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateContent}
                  disabled={generatingContent || !form.title.trim()}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generatingContent ? "Generating…" : "Looks good, generate full post"}
                </button>
                <button
                  type="button"
                  onClick={() => setOutline(null)}
                  className="text-xs text-slate-600 hover:text-slate-400"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <ol className="divide-y divide-[#2a2d3a]">
              {outline.map((section, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span className="text-slate-600 text-xs font-mono w-5 flex-shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{section.heading}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{section.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div data-color-mode="dark">
          <MDEditor
            value={form.content}
            onChange={(val) => set("content", val ?? "")}
            height={400}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-1">Tags</label>
        <div className="flex gap-2 flex-wrap mb-2">
          {form.tags.map((tag) => (
            <span key={tag} className="tag flex items-center gap-1">
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-slate-500 hover:text-red-400 ml-1"
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

      <div className="flex gap-4 items-end flex-wrap">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
        {form.status === "SCHEDULED" && (
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Schedule for
            </label>
            <input
              type="datetime-local"
              value={form.scheduledFor}
              onChange={(e) => set("scheduledFor", e.target.value)}
              className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSeo((v) => !v)}
          className="text-sm text-slate-500 hover:text-slate-300 font-mono"
        >
          {showSeo ? "▾" : "▸"} SEO fields
        </button>
        {showSeo && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                SEO title
              </label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => set("seoTitle", e.target.value)}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                SEO description
              </label>
              <textarea
                value={form.seoDesc}
                onChange={(e) => set("seoDesc", e.target.value)}
                rows={2}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || saved}
          className={`btn-primary transition-colors ${saved ? "bg-cyan-600 border-cyan-600 hover:bg-cyan-600" : ""}`}
        >
          {saved
            ? "Saved ✓"
            : saving
              ? "Saving…"
              : form.status === "PUBLISHED"
                ? (postId ? "Save & publish" : "Publish")
                : form.status === "SCHEDULED"
                  ? (postId ? "Update scheduled post" : "Schedule post")
                  : (postId ? "Update post" : "Create post")}
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (isDirty.current && !window.confirm("Discard unsaved changes?")) {
              e.preventDefault();
              return;
            }
            router.push("/admin/blog");
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
