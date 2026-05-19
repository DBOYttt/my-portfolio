import type { SkillsDiffRawData } from "@/types/agent-reports";

interface Props {
  data: SkillsDiffRawData;
  appliedSkillNames: Set<string>;
  skillIdByName: Map<string, string>;
  reportId: string;
  applyAdd: (formData: FormData) => Promise<void>;
  applyAllAdditions: (formData: FormData) => Promise<void>;
  applyUpgrade: (formData: FormData) => Promise<void>;
  dismissStale: (formData: FormData) => Promise<void>;
}

export default function SkillsDiffReport({
  data,
  appliedSkillNames,
  skillIdByName,
  applyAdd,
  applyAllAdditions,
  applyUpgrade,
  dismissStale,
}: Props) {
  return (
    <div className="space-y-6 mb-6">
      {data.add.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a] flex items-center justify-between gap-3 flex-wrap">
            <p className="text-slate-100 text-sm font-medium">
              Skills to Add ({data.add.length})
            </p>
            {data.add.some((s) => !appliedSkillNames.has(s.name.toLowerCase())) && (
              <form action={applyAllAdditions}>
                <input
                  type="hidden"
                  name="items"
                  value={JSON.stringify(
                    data.add
                      .filter((s) => !appliedSkillNames.has(s.name.toLowerCase()))
                      .map((s) => ({ name: s.name, category: s.category, level: s.level }))
                  )}
                />
                <button
                  type="submit"
                  className="text-xs py-1.5 px-3 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                >
                  Apply all{" "}
                  {data.add.filter((s) => !appliedSkillNames.has(s.name.toLowerCase())).length}{" "}
                  additions
                </button>
              </form>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Category</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Level</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">Evidence</th>
                <th className="text-right px-4 py-2 text-slate-500 font-medium">Apply</th>
              </tr>
            </thead>
            <tbody>
              {data.add.map((s, i) => {
                const isApplied = appliedSkillNames.has(s.name.toLowerCase());
                return (
                  <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="text-slate-100 font-medium">{s.name}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{s.category}</td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{s.level}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs hidden md:table-cell max-w-xs truncate">
                      {s.evidence}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isApplied ? (
                        <span className="text-xs py-1 px-2.5 text-slate-500 border border-slate-700 rounded-lg cursor-default">
                          Applied ✓
                        </span>
                      ) : (
                        <form action={applyAdd}>
                          <input type="hidden" name="name" value={s.name} />
                          <input type="hidden" name="category" value={s.category} />
                          <input type="hidden" name="level" value={s.level} />
                          <button
                            type="submit"
                            className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                          >
                            Apply
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data.upgrade.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">
              Skills to Upgrade ({data.upgrade.length})
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Name</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium">Level Change</th>
                <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">Evidence</th>
                <th className="text-right px-4 py-2 text-slate-500 font-medium">Apply</th>
              </tr>
            </thead>
            <tbody>
              {data.upgrade.map((s, i) => (
                <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                  <td className="px-4 py-2.5 text-slate-100 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">
                    <span className="text-slate-400">{s.currentLevel}</span>
                    <span className="text-slate-600 mx-1.5">→</span>
                    <span className="text-cyan-400">{s.suggestedLevel}</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs hidden md:table-cell max-w-xs truncate">
                    {s.evidence}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <form action={applyUpgrade}>
                      <input type="hidden" name="name" value={s.name} />
                      <input type="hidden" name="level" value={s.suggestedLevel} />
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
      )}

      {data.stale.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2a2d3a]">
            <p className="text-slate-100 text-sm font-medium">
              Possibly Stale ({data.stale.length})
            </p>
          </div>
          <ul className="divide-y divide-[#2a2d3a]">
            {data.stale.map((s, i) => {
              const skillId = skillIdByName.get(s.name.toLowerCase());
              return (
                <li key={i} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-slate-100 text-sm font-medium min-w-32">{s.name}</span>
                  <span className="text-slate-500 text-xs flex-1">{s.reason}</span>
                  {skillId && (
                    <form action={dismissStale} className="flex-shrink-0">
                      <input type="hidden" name="id" value={skillId} />
                      <button
                        type="submit"
                        className="text-xs py-1 px-2.5 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
