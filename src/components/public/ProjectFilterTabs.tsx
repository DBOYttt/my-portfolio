"use client";

import { useRouter } from "next/navigation";

const TYPES = ["SOFTWARE", "ROBOTICS", "HARDWARE", "RESEARCH"] as const;

const typeColors: Record<string, { active: string; hover: string }> = {
  ROBOTICS: { active: "text-emerald-400 border-emerald-500/50 bg-emerald-500/10", hover: "hover:text-emerald-400 hover:border-emerald-500/30" },
  SOFTWARE: { active: "text-blue-400 border-blue-500/50 bg-blue-500/10", hover: "hover:text-blue-400 hover:border-blue-500/30" },
  HARDWARE: { active: "text-amber-400 border-amber-500/50 bg-amber-500/10", hover: "hover:text-amber-400 hover:border-amber-500/30" },
  RESEARCH: { active: "text-purple-400 border-purple-500/50 bg-purple-500/10", hover: "hover:text-purple-400 hover:border-purple-500/30" },
};

interface Props {
  activeType: string | null;
}

export default function ProjectFilterTabs({ activeType }: Props) {
  const router = useRouter();

  function setFilter(type: string | null) {
    router.push(type ? `/projects?type=${type}` : "/projects");
  }

  return (
    <div className="flex flex-wrap gap-2 mt-6 mb-2">
      <button
        onClick={() => setFilter(null)}
        className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${
          activeType === null
            ? "text-slate-100 border-slate-400/50 bg-slate-500/10"
            : "text-slate-500 border-[#2a2d3a] hover:text-slate-300 hover:border-slate-500/30"
        }`}
      >
        All
      </button>
      {TYPES.map((type) => {
        const colors = typeColors[type];
        const isActive = activeType === type;
        return (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${
              isActive
                ? colors.active
                : `text-slate-500 border-[#2a2d3a] ${colors.hover}`
            }`}
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </button>
        );
      })}
    </div>
  );
}
