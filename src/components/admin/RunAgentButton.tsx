"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  agentId: string;
  agentEnabled: boolean;
  agentStatus: string;
  label?: string;
  redirectOnSuccess?: boolean;
}

export default function RunAgentButton({
  agentId,
  agentEnabled,
  agentStatus,
  label,
  redirectOnSuccess = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<"ok" | "error" | null>(null);

  const disabled = !agentEnabled || agentStatus === "running" || loading;

  async function handleRun() {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/run`, { method: "POST" });
      if (res.ok) {
        setLastResult("ok");
        if (redirectOnSuccess) {
          const data = (await res.json()) as { reportId?: string };
          if (data.reportId) {
            router.push(`/admin/agents/reports/${data.reportId}`);
            return;
          }
        }
        router.refresh();
      } else {
        setLastResult("error");
      }
    } catch {
      setLastResult("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRun}
      disabled={disabled}
      className={`text-xs py-1.5 px-3 rounded border transition-colors ${
        lastResult === "error"
          ? "text-red-400 border-red-500/30 bg-red-500/10"
          : lastResult === "ok"
          ? "text-green-400 border-green-500/30 bg-green-500/10"
          : "btn-secondary"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Running…
        </span>
      ) : lastResult === "error" ? (
        "Failed"
      ) : lastResult === "ok" ? (
        "Done ✓"
      ) : agentStatus === "running" ? (
        "Running…"
      ) : (
        label ?? "Run now"
      )}
    </button>
  );
}
