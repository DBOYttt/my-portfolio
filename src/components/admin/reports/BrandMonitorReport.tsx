import type { BrandMonitorRawData } from "@/types/agent-reports";

interface Props {
  data: BrandMonitorRawData;
}

export default function BrandMonitorReport({ data }: Props) {
  return (
    <div className="space-y-4 mb-6">
      {data.githubDelta.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">GitHub Star / Fork Delta</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Repo</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Stars</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Stars Delta</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Forks</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Forks Delta</th>
                </tr>
              </thead>
              <tbody>
                {data.githubDelta.map((r, i) => (
                  <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{r.repo}</td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{r.stars}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">
                      {r.starDelta > 0 ? (
                        <span className="text-emerald-400">+{r.starDelta}</span>
                      ) : r.starDelta < 0 ? (
                        <span className="text-red-400">{r.starDelta}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{r.forks}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">
                      {r.forkDelta > 0 ? (
                        <span className="text-emerald-400">+{r.forkDelta}</span>
                      ) : r.forkDelta < 0 ? (
                        <span className="text-red-400">{r.forkDelta}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {data.googleAlerts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">
              Google Alerts ({data.googleAlerts.length})
            </p>
          </div>
          <ul className="divide-y divide-[#2a2d3a]">
            {data.googleAlerts.map((a, i) => (
              <li key={i} className="flex items-start justify-between px-4 py-2.5 gap-3">
                <div className="flex-1 min-w-0">
                  <a
                    href={a.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-100 text-sm hover:text-cyan-400 transition-colors"
                  >
                    {a.title}
                  </a>
                  {a.pubDate && (
                    <p className="text-slate-600 text-xs font-mono mt-0.5">{a.pubDate}</p>
                  )}
                </div>
                {a.sentiment && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                      a.sentiment === "positive"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : a.sentiment === "negative"
                          ? "text-red-400 bg-red-500/10 border-red-500/20"
                          : "text-slate-400 bg-slate-700/20 border-slate-600/40"
                    }`}
                  >
                    {a.sentiment}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2d3a]">
          <p className="text-slate-100 text-sm font-medium">
            Dev.to Mentions ({data.devToMentions.length})
          </p>
        </div>
        {data.devToMentions.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">No Dev.to mentions found.</p>
        ) : (
          <ul className="divide-y divide-[#2a2d3a]">
            {data.devToMentions.map((m, i) => (
              <li key={i} className="px-4 py-2.5">
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-100 text-sm hover:text-cyan-400 transition-colors truncate block"
                >
                  {m.title}
                </a>
                <p className="text-slate-500 text-xs mt-0.5">
                  {m.author}
                  {m.publishedAt && (
                    <span className="ml-2 font-mono">
                      {new Date(m.publishedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
