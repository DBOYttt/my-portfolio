import type { RoboticsDigestRawData, DigestItem } from "@/lib/agents/robotics-news";

interface Props {
  data: RoboticsDigestRawData;
}

export default function RoboticsDigestReport({ data }: Props) {
  return (
    <div className="space-y-4 mb-6">
      {/* Header chips */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
          {data.newItemCount} new article{data.newItemCount !== 1 ? "s" : ""}
        </span>
        {data.seenCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
            {data.seenCount} already seen
          </span>
        )}
      </div>

      {/* Digest — curated top 5 with "why" */}
      {data.digest.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a] flex flex-wrap items-center gap-3">
            <p className="text-slate-100 text-sm font-medium">
              Curated Digest ({data.digest.length})
            </p>
            {data.digestError && (
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                ⚠ {data.digestError}
              </span>
            )}
          </div>
          <ol className="divide-y divide-[#2a2d3a]">
            {data.digest.map((item: DigestItem, i: number) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-slate-600 text-xs font-mono w-5 flex-shrink-0 mt-0.5">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-100 text-sm font-medium hover:text-cyan-400 transition-colors"
                  >
                    {item.title}
                  </a>
                  <p className="text-slate-500 text-xs mt-0.5 italic">{item.why}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Raw items — collapsed full list */}
      {data.rawItems.length > 0 && (
        <details className="card overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
            <p className="text-slate-400 text-sm">
              All new articles ({data.rawItems.length})
            </p>
            <span className="text-slate-600 text-xs font-mono">toggle</span>
          </summary>
          <ul className="divide-y divide-[#2a2d3a]">
            {data.rawItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 text-xs hover:text-cyan-400 transition-colors truncate"
                >
                  {item.title}
                </a>
                <span className="text-slate-600 text-xs font-mono flex-shrink-0">{item.source}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
