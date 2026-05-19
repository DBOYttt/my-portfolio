import Link from "next/link";
import type { ProjectCreatedRawData } from "@/types/agent-reports";
import { PROJECT_TYPE_COLORS, formatProjectType } from "./project-type";

interface Props {
  data: ProjectCreatedRawData;
}

export default function ProjectCreatedReport({ data }: Props) {
  return (
    <div className="mb-6">
      <p className="text-slate-100 text-sm font-medium mb-3">
        Projects Created ({data.created.length})
      </p>
      {data.created.length === 0 ? (
        <div className="card p-4">
          <p className="text-slate-500 text-sm">All repositories are already in the portfolio.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-[#2a2d3a]">
            {data.created.map((p) => (
              <li key={p.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${PROJECT_TYPE_COLORS[p.type] ?? PROJECT_TYPE_COLORS.SOFTWARE}`}>
                      {formatProjectType(p.type)}
                    </span>
                    {typeof p.readmeScore === "number" && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border font-mono flex-shrink-0 ${
                          p.readmeScore <= 2
                            ? "border-red-500/20 bg-red-500/10 text-red-400"
                            : p.readmeScore === 3
                            ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        }`}
                        title={`README score: ${p.readmeScore}/5`}
                      >
                        README {p.readmeScore}/5
                      </span>
                    )}
                    <span className="text-slate-100 text-sm font-medium truncate">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors hidden md:block"
                    >
                      {p.githubUrl.replace("https://github.com/", "github/")}
                    </a>
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                    >
                      Edit draft →
                    </Link>
                  </div>
                </div>
                {p.readmeNote && (
                  <p className="text-xs text-amber-400 ml-0.5">{p.readmeNote}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
