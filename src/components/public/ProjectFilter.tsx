"use client";

import { useState } from "react";
import type { ProjectSummary } from "@/types";
import { SketchPlaceholder } from "@/components/ui/hand-drawn";

const TYPE_DISPLAY: Record<string, string> = {
  ROBOTICS: "Robotics",
  SOFTWARE: "Software",
  HARDWARE: "Hardware",
  RESEARCH: "Research",
};

const FILTERS = ["All", "Software", "Robotics", "Hardware"];

function ProjectEntry({ p, num }: { p: ProjectSummary; num: string }) {
  const [open, setOpen] = useState(false);
  const typeLabel = TYPE_DISPLAY[p.type] ?? p.type;

  return (
    <article className="entry">
      <div className="entry-head">
        <span className="entry-num">No. {num}</span>
        <h3 className="entry-title">{p.title}</h3>
        <span className="entry-meta-right">
          {p.year} · {typeLabel}
        </span>
      </div>
      <div className="entry-body">
        <div />
        <div>
          <p className="entry-summary">{p.summary}</p>
          <div className="entry-tags">
            {p.techTags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="entry-actions">
            {p.githubUrl && (
              <a href={p.githubUrl} target="_blank" rel="noopener noreferrer">
                <span className="ar">↗</span> source on github
              </a>
            )}
            <button onClick={() => setOpen((o) => !o)}>
              <span style={{ color: "var(--accent)" }}>{open ? "▾" : "▸"}</span>{" "}
              {open ? "hide sketch" : "see sketch"}
            </button>
          </div>
          {open && (
            <div style={{ marginTop: 18, maxWidth: 480 }}>
              <SketchPlaceholder
                label={p.sketchLabel ?? `FIG. ${num} — project sketch`}
                topLeft={`DWG-${num}`}
                topRight="REV. A"
                bottomRight="placeholder"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProjectFilter({ projects }: { projects: ProjectSummary[] }) {
  const [filter, setFilter] = useState("All");
  const filtered = projects.filter(
    (p) => filter === "All" || TYPE_DISPLAY[p.type] === filter
  );

  return (
    <>
      <div className="logbook-row" style={{ marginBottom: 8 }}>
        <aside className="margin">
          <span>Filter by</span>
          <span className="meta">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
          </span>
        </aside>
        <div className="row" style={{ gap: 4 }}>
          {FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                background: "none",
                border: `1px solid ${filter === t ? "var(--accent)" : "var(--hairline)"}`,
                color: filter === t ? "var(--accent)" : "var(--ink-soft)",
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: 11.5,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
                padding: "6px 12px",
                cursor: "pointer",
                borderRadius: 0,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="logbook-row">
        <aside className="margin" />
        <div>
          {filtered.map((p) => (
            <ProjectEntry
              key={p.slug}
              p={p}
              num={String(projects.indexOf(p) + 1).padStart(2, "0")}
            />
          ))}
        </div>
      </div>
    </>
  );
}
