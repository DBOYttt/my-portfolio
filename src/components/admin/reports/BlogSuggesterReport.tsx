import Link from "next/link";
import type { BlogSuggesterRawData } from "@/types/agent-reports";

interface Props {
  data: BlogSuggesterRawData;
  createSeriesDrafts: (formData: FormData) => Promise<void>;
}

export default function BlogSuggesterReport({ data, createSeriesDrafts }: Props) {
  return (
    <div className="space-y-4 mb-6">
      {/* Standalone suggestions */}
      {data.suggestions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">
              Suggested Topics ({data.suggestions.length})
            </p>
          </div>
          <div className="divide-y divide-[#2a2d3a]">
            {data.suggestions.map((s, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-slate-100 text-sm font-medium">{s.title}</p>
                  <Link
                    href={`/admin/blog/new?title=${encodeURIComponent(s.title)}`}
                    className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                  >
                    Draft →
                  </Link>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">{s.rationale}</p>
                {s.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {s.tags.map((tag) => (
                      <span key={tag} className="tag text-xs">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Series */}
      {data.series && data.series.length > 0 && (
        <div className="space-y-3">
          <p className="text-slate-100 text-sm font-medium">Content Series</p>
          {data.series.map((series, si) => (
            <div key={si} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a] flex items-center justify-between gap-3">
                <p className="text-slate-100 text-sm font-semibold">{series.seriesTitle}</p>
                <form action={createSeriesDrafts}>
                  <input
                    type="hidden"
                    name="posts"
                    value={JSON.stringify(
                      series.posts.map((p) => ({ title: p.title, tags: p.tags }))
                    )}
                  />
                  <button
                    type="submit"
                    className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                  >
                    Create {series.posts.length} drafts
                  </button>
                </form>
              </div>
              <ol className="divide-y divide-[#2a2d3a]">
                {series.posts.map((post, pi) => (
                  <li key={pi} className="px-4 py-2.5 flex items-start gap-3">
                    <span className="text-slate-600 text-xs font-mono w-5 flex-shrink-0 mt-0.5">
                      {pi + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-100 text-sm">{post.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{post.rationale}</p>
                      {post.tags.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {post.tags.map((tag) => (
                            <span key={tag} className="tag text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
