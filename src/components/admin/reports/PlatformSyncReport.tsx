import Link from "next/link";
import type { ProfileConsistencyRow, PlatformSyncRawData } from "@/lib/agents/platform-sync";

interface Props {
  data: PlatformSyncRawData;
}

export default function PlatformSyncReport({ data }: Props) {
  return (
    <div className="space-y-4 mb-6">
      {/* Configured platforms chips */}
      <div className="flex flex-wrap gap-3">
        {data.configuredPlatforms.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {p}
          </span>
        ))}
        {data.dbExperienceCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[#2a2d3a] text-slate-500">
            {data.dbExperienceCount} experience entr{data.dbExperienceCount !== 1 ? "ies" : "y"} in DB
          </span>
        )}
      </div>

      {/* PS-B: Profile consistency table */}
      {data.profileConsistency.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">Profile Consistency</p>
          </div>
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
                {data.profileConsistency.map((row: ProfileConsistencyRow, i: number) => (
                  <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="px-4 py-2.5 text-slate-300 font-medium text-xs capitalize">
                      {row.field}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate">
                      {row.githubValue ?? <span className="text-slate-600 italic">not set</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate hidden md:table-cell">
                      {row.dbValue ?? <span className="text-slate-600 italic">not set</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.status === "match" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          Match
                        </span>
                      ) : row.status === "mismatch" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                          Mismatch
                        </span>
                      ) : row.status === "missing_github" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-500">
                          Not on GitHub
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-500">
                          Missing in DB
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PS-A: LinkedIn cross-reference note */}
      <div className="card p-4 flex items-start gap-3">
        <div className="flex-1">
          <p className="text-slate-300 text-sm font-medium mb-1">LinkedIn Cross-Reference</p>
          <p className="text-slate-500 text-xs">
            {data.dbExperienceCount} experience entr{data.dbExperienceCount !== 1 ? "ies" : "y"} in DB.
            Run the{" "}
            <Link href="/admin" className="text-cyan-400 hover:underline">
              LinkedIn CSV import
            </Link>{" "}
            in the admin panel to compare against your portfolio experience entries.
          </p>
        </div>
      </div>

      {/* PS-C: Twitter section — conditional */}
      {data.twitter ? (
        <div className="card p-4">
          <p className="text-slate-300 text-sm font-medium mb-2">X / Twitter</p>
          <dl className="space-y-1 text-sm">
            <div className="flex gap-3">
              <dt className="text-slate-500 w-24 flex-shrink-0">Followers</dt>
              <dd className="text-slate-300">{data.twitter.followerCount}</dd>
            </div>
            {data.twitter.bio && (
              <div className="flex gap-3">
                <dt className="text-slate-500 w-24 flex-shrink-0">Bio</dt>
                <dd className="text-slate-400 text-xs">{data.twitter.bio}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <div className="card p-4">
          <p className="text-slate-500 text-sm">
            X / Twitter: Not configured — set{" "}
            <code className="font-mono text-xs text-slate-400">TWITTER_BEARER_TOKEN</code> to enable.
          </p>
        </div>
      )}
    </div>
  );
}
