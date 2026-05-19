"use client";

import type { JobStatus } from "@/types/career";

export const STATUS_COLORS: Record<JobStatus, string> = {
  pending: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  running: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  done: "text-green-400 bg-green-500/10 border-green-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

export const INPUT_CLS =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 placeholder-slate-600";

export const LABEL_CLS = "block text-slate-400 text-xs font-mono mb-1";

export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}
