import type { ProjectSyncUpdate, ProjectSyncDiffRawData } from "@/lib/agents/github-project-importer";

interface Props {
  data: ProjectSyncDiffRawData;
  applyUpdate: (formData: FormData) => Promise<void>;
}

export default function ProjectSyncDiffReport({ data, applyUpdate }: Props) {
  return (
    <div className="mb-6">
      <p className="text-slate-100 text-sm font-medium mb-3">
        Project Sync Suggestions ({data.updates.length})
      </p>
      {data.updates.length === 0 ? (
        <div className="card p-4">
          <p className="text-slate-500 text-sm">All portfolio entries appear up-to-date.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Project</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Field</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">Current</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium">Suggested</th>
                  <th className="text-left px-4 py-2 text-slate-500 font-medium hidden lg:table-cell">Reason</th>
                  <th className="text-right px-4 py-2 text-slate-500 font-medium">Apply</th>
                </tr>
              </thead>
              <tbody>
                {data.updates.map((u: ProjectSyncUpdate, i: number) => (
                  <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{u.slug}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{u.field}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[140px] truncate hidden md:table-cell">
                      {u.currentValue}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-cyan-400 max-w-[160px] truncate">
                      {u.suggestedValue}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate hidden lg:table-cell">
                      {u.reason}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <form action={applyUpdate}>
                        <input type="hidden" name="slug" value={u.slug} />
                        <input type="hidden" name="field" value={u.field} />
                        <input type="hidden" name="suggestedValue" value={u.suggestedValue} />
                        <button
                          type="submit"
                          className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                        >
                          Apply
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
