import Link from "next/link";
import type { GitHubAuditRawData, ActivityLevel } from "@/lib/agents/github-summarizer";

function ActivityBadge({ level }: { level: ActivityLevel }) {
  if (level === "active") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        Active
      </span>
    );
  }
  if (level === "recent") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
        Recent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
      Dormant
    </span>
  );
}

function ConsistencyBadge({ status }: { status: "match" | "mismatch" | "missing" }) {
  if (status === "match") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        Match
      </span>
    );
  }
  if (status === "mismatch") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
        Mismatch
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-500">
      Missing
    </span>
  );
}

interface Props {
  data: GitHubAuditRawData;
}

export default function GitHubAuditReport({ data }: Props) {
  return (
    <div className="space-y-4 mb-6">
      {/* Activity summary chips */}
      <div className="flex flex-wrap gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          {data.activitySummary.active} Active
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          {data.activitySummary.recent} Recent
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
          {data.activitySummary.dormant} Dormant
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[#2a2d3a] text-slate-500">
          {data.repoCount} repos total
        </span>
      </div>

      {/* Portfolio Gaps — most important, shown first */}
      <details open className="card overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
          <p className="text-slate-100 text-sm font-medium">
            Portfolio Gaps
            {data.portfolioGaps.length > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {data.portfolioGaps.length}
              </span>
            )}
          </p>
          <span className="text-slate-600 text-xs font-mono">toggle</span>
        </summary>
        {data.portfolioGaps.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">
            All notable repos are already in the portfolio.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Repo</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Stars</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Activity</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.portfolioGaps.map((gap, i) => (
                  <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="px-4 py-2.5">
                      <a
                        href={gap.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-100 font-medium hover:text-cyan-400 transition-colors font-mono text-xs"
                      >
                        {gap.repo}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">
                      {gap.stars > 0 ? `${gap.stars} ★` : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <ActivityBadge level={gap.activity} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={gap.importUrl}
                        className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                      >
                        Import →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>

      {/* Missing Descriptions */}
      <details className="card overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
          <p className="text-slate-100 text-sm font-medium">
            Missing Descriptions
            {data.missingDescriptions.length > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                {data.missingDescriptions.length}
              </span>
            )}
          </p>
          <span className="text-slate-600 text-xs font-mono">toggle</span>
        </summary>
        {data.missingDescriptions.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">All repos have descriptions.</p>
        ) : (
          <ul className="divide-y divide-[#2a2d3a]">
            {data.missingDescriptions.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <span className="font-mono text-xs text-slate-300">{r.repo}</span>
                <a
                  href={`${r.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                >
                  Edit on GitHub →
                </a>
              </li>
            ))}
          </ul>
        )}
      </details>

      {/* Missing READMEs */}
      <details className="card overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
          <p className="text-slate-100 text-sm font-medium">
            Missing READMEs
            {data.missingReadmes.length > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                {data.missingReadmes.length}
              </span>
            )}
          </p>
          <span className="text-slate-600 text-xs font-mono">toggle</span>
        </summary>
        {data.missingReadmes.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">All checked repos have READMEs.</p>
        ) : (
          <ul className="divide-y divide-[#2a2d3a]">
            {data.missingReadmes.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <span className="font-mono text-xs text-slate-300">{r.repo}</span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                >
                  View on GitHub →
                </a>
              </li>
            ))}
          </ul>
        )}
      </details>

      {/* Missing Topics */}
      <details className="card overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
          <p className="text-slate-100 text-sm font-medium">
            Missing Topics / Tags
            {data.missingTopics.length > 0 && (
              <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                {data.missingTopics.length}
              </span>
            )}
          </p>
          <span className="text-slate-600 text-xs font-mono">toggle</span>
        </summary>
        {data.missingTopics.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">All repos have topics set.</p>
        ) : (
          <ul className="divide-y divide-[#2a2d3a]">
            {data.missingTopics.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                <span className="font-mono text-xs text-slate-300">{r.repo}</span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                >
                  Edit on GitHub →
                </a>
              </li>
            ))}
          </ul>
        )}
      </details>

      {/* Profile Consistency */}
      {data.profileConsistency.length > 0 && (
        <details className="card overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">Profile Consistency</p>
            <span className="text-slate-600 text-xs font-mono">toggle</span>
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Field</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">GitHub</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">DB value</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.profileConsistency.map((f, i) => (
                  <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="px-4 py-2.5 text-slate-300 font-medium text-xs capitalize">
                      {f.field}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate">
                      {f.githubValue ?? <span className="text-slate-600 italic">not set</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate hidden md:table-cell">
                      {f.dbValue ?? <span className="text-slate-600 italic">not set</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <ConsistencyBadge status={f.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
