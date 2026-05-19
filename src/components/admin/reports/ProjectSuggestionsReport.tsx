import type { ProjectSuggestionsRawData } from "@/types/agent-reports";
import { PROJECT_TYPE_COLORS, formatProjectType } from "./project-type";

interface Props {
  data: ProjectSuggestionsRawData;
  existingProjectSlugs: Set<string>;
  existingProjectGithubUrls: Set<string>;
  createDraft: (formData: FormData) => Promise<void>;
}

export default function ProjectSuggestionsReport({
  data,
  existingProjectSlugs,
  existingProjectGithubUrls,
  createDraft,
}: Props) {
  if (data.suggestions.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-slate-100 text-sm font-medium mb-3">
        Project Drafts ({data.suggestions.length})
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.suggestions.map((s, i) => {
          const alreadyExists =
            existingProjectSlugs.has(s.slug.toLowerCase()) ||
            !!(s.githubUrl && existingProjectGithubUrls.has(s.githubUrl.toLowerCase()));
          return (
            <div key={i} className={`card p-4 flex flex-col gap-3 ${alreadyExists ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 font-medium text-sm truncate">{s.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{s.summary}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${PROJECT_TYPE_COLORS[s.type] ?? PROJECT_TYPE_COLORS.SOFTWARE}`}
                >
                  {formatProjectType(s.type)}
                </span>
              </div>

              {s.techTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.techTags.slice(0, 5).map((tag) => (
                    <span key={tag} className="tag text-xs">
                      {tag}
                    </span>
                  ))}
                  {s.techTags.length > 5 && (
                    <span className="text-xs text-slate-600">+{s.techTags.length - 5}</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                <a
                  href={s.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors truncate"
                >
                  {s.githubUrl.replace("https://github.com/", "github/")}
                </a>
                {alreadyExists ? (
                  <span className="text-xs py-1 px-2.5 text-slate-500 border border-slate-700 rounded-lg flex-shrink-0 cursor-default">
                    Already exists
                  </span>
                ) : (
                  <form action={createDraft}>
                    <input type="hidden" name="suggestion" value={JSON.stringify(s)} />
                    <button
                      type="submit"
                      className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                    >
                      Create as Draft
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
