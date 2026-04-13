"use client";

import { useState } from "react";

interface Props {
  agentId: string;
  buttonLabel: string;
  renderResult: (rawData: unknown) => React.ReactNode;
  className?: string;
}

type PanelState = "idle" | "loading" | "result" | "error";

export default function AgentSuggestPanel({
  agentId,
  buttonLabel,
  renderResult,
  className,
}: Props) {
  const [state, setState] = useState<PanelState>("idle");
  const [rawData, setRawData] = useState<unknown>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleRun() {
    setState("loading");
    setErrorMsg("");
    setRawData(null);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/run`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as Record<string, unknown>).error)
            : "Agent run failed";
        throw new Error(err);
      }
      const payload =
        typeof data === "object" && data !== null && "rawData" in data
          ? (data as Record<string, unknown>).rawData
          : null;
      setRawData(payload);
      setState("result");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Unexpected error");
      setState("error");
    }
  }

  function handleClose() {
    setState("idle");
    setRawData(null);
    setErrorMsg("");
  }

  return (
    <div className={className}>
      {state === "idle" || state === "error" ? (
        <button
          type="button"
          onClick={handleRun}
          className="btn-secondary text-xs px-2 py-1"
        >
          {buttonLabel}
        </button>
      ) : state === "loading" ? (
        <button type="button" disabled className="btn-secondary text-xs px-2 py-1 opacity-60 cursor-not-allowed">
          Running…
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClose}
          className="btn-secondary text-xs px-2 py-1"
        >
          Close
        </button>
      )}

      {state === "error" && (
        <p className="text-red-400 text-xs font-mono mt-1">{errorMsg}</p>
      )}

      {state === "result" && (
        <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-4 mt-2">
          {renderResult(rawData)}
        </div>
      )}
    </div>
  );
}
