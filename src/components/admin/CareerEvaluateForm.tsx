"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type JobStatus = "pending" | "running" | "done" | "error";

interface EvaluateResponse {
  jobId?: string;
  error?: string;
}

interface StatusResponse {
  status?: JobStatus;
  log?: string[];
  pdfPath?: string;
  error?: string;
}

interface PublishResponse {
  ok?: boolean;
  publishedAt?: string;
  error?: string;
}

interface SyncResponse {
  ok?: boolean;
  profileFields?: string[];
  error?: string;
}

interface CareerConfig {
  contact?: { phone?: string; location?: string; twitter?: string };
  target_roles?: { primary?: string[]; archetypes?: Array<{ name: string; level: string; fit: string }> };
  narrative?: { headline?: string; exit_story?: string; superpowers?: string[] };
  compensation?: { target_range?: string; currency?: string; minimum?: string; location_flexibility?: string };
  location?: { country?: string; city?: string; timezone?: string; visa_status?: string };
  cv_output_format?: string;
}

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  running: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  done: "text-green-400 bg-green-500/10 border-green-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

const INPUT_CLS =
  "w-full bg-[#0f1117] border border-[#2a2d3a] text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 placeholder-slate-600";

const LABEL_CLS = "block text-slate-400 text-xs font-mono mb-1";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      {children}
    </div>
  );
}

export default function CareerEvaluateForm() {
  // ── Career profile state ──────────────────────────────────────────────────
  const [config, setConfig] = useState<CareerConfig>({});
  const [savedIndicator, setSavedIndicator] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    fetch("/api/admin/career/config")
      .then((r) => r.json())
      .then((data: CareerConfig) => {
        setConfig(data);
      })
      .catch(() => {});
  }, []);

  const persistConfig = useCallback((updated: CareerConfig) => {
    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await fetch("/api/admin/career/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        setSavedIndicator(true);
        setTimeout(() => setSavedIndicator(false), 2000);
      } catch {
        // silent — not critical
      }
    }, 800);
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    persistConfig(config);
  }, [config, persistConfig]);

  function setContact(patch: Partial<NonNullable<CareerConfig["contact"]>>) {
    setConfig((prev) => ({ ...prev, contact: { ...prev.contact, ...patch } }));
  }

  function setNarrative(patch: Partial<NonNullable<CareerConfig["narrative"]>>) {
    setConfig((prev) => ({ ...prev, narrative: { ...prev.narrative, ...patch } }));
  }

  function setCompensation(patch: Partial<NonNullable<CareerConfig["compensation"]>>) {
    setConfig((prev) => ({ ...prev, compensation: { ...prev.compensation, ...patch } }));
  }

  function setLocation(patch: Partial<NonNullable<CareerConfig["location"]>>) {
    setConfig((prev) => ({ ...prev, location: { ...prev.location, ...patch } }));
  }

  function setTargetRoles(primary: string) {
    const arr = primary.split("\n").map((s) => s.trim()).filter(Boolean);
    setConfig((prev) => ({
      ...prev,
      target_roles: { ...prev.target_roles, primary: arr },
    }));
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/career/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      if (res.ok && data.ok) {
        setSyncResult({ ok: true, message: "Synced — profile.yml and cv.md updated" });
      } else {
        setSyncResult({ ok: false, message: data.error ?? "Sync failed" });
      }
    } catch {
      setSyncResult({ ok: false, message: "Network error — could not reach career-ops" });
    } finally {
      setSyncing(false);
    }
  }

  // ── Job evaluation state ──────────────────────────────────────────────────
  const [url, setUrl] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [publishResult, setPublishResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);
  const logBoxRef = useRef<HTMLPreElement | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const POLL_MAX = 100;

  const pollStatus = useCallback(
    (jobId: string) => {
      pollCountRef.current = 0;
      pollRef.current = setInterval(async () => {
        pollCountRef.current += 1;

        if (pollCountRef.current >= POLL_MAX) {
          stopPolling();
          setEvaluating(false);
          setJobStatus("error");
          setLogLines((prev) => [...prev, "\nTimed out after 5 minutes."]);
          return;
        }

        try {
          const res = await fetch(`/api/admin/career/status/${jobId}`);
          const data = (await res.json()) as StatusResponse;

          if (data.log) {
            setLogLines(data.log);
            if (logBoxRef.current) {
              logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
            }
          }

          const knownStatuses: JobStatus[] = ["pending", "running", "done", "error"];
          const status = data.status && knownStatuses.includes(data.status) ? data.status : null;

          if (status) {
            setJobStatus(status);
            if (status === "done" || status === "error") {
              stopPolling();
              setEvaluating(false);
            }
          } else if (data.status) {
            stopPolling();
            setEvaluating(false);
            setJobStatus("error");
            setLogLines((prev) => [...prev, `\nUnexpected status: ${data.status}`]);
          }
        } catch {
          stopPolling();
          setEvaluating(false);
          setJobStatus("error");
        }
      }, 3000);
    },
    [stopPolling]
  );

  async function handleEvaluate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) return;

    stopPolling();
    setLogLines([]);
    setJobStatus("pending");
    setEvaluating(true);

    try {
      const res = await fetch("/api/admin/career/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json()) as EvaluateResponse;

      if (!res.ok || !data.jobId) {
        setJobStatus("error");
        setLogLines([data.error ?? "Failed to start evaluation"]);
        setEvaluating(false);
        return;
      }

      setJobStatus("running");
      pollStatus(data.jobId);
    } catch {
      setJobStatus("error");
      setLogLines(["Network error — could not reach career-ops service"]);
      setEvaluating(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishResult(null);

    try {
      const res = await fetch("/api/admin/career/cv/publish", { method: "POST" });
      const data = (await res.json()) as PublishResponse;

      if (res.ok && data.ok) {
        setPublishResult({
          ok: true,
          message: `Published at ${data.publishedAt ? new Date(data.publishedAt).toLocaleString() : "—"}`,
        });
      } else {
        setPublishResult({ ok: false, message: data.error ?? "Publish failed" });
      }
    } catch {
      setPublishResult({ ok: false, message: "Network error — could not publish CV" });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <>
      {/* Section 0 — Career Profile */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-slate-100 font-semibold">Career Profile</h2>
          {savedIndicator && (
            <span className="text-green-400 text-xs font-mono flex items-center gap-1">
              <span>&#10003;</span> Saved
            </span>
          )}
        </div>
        <p className="text-slate-500 text-xs font-mono mb-4">
          Stored in your user record — auto-synced to career-ops on demand
        </p>

        <div className="space-y-4">
          {/* Contact */}
          <details open>
            <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
              Contact
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#2a2d3a] pt-3">
              <FieldGroup label="Phone">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="+48 123 456 789"
                  value={config.contact?.phone ?? ""}
                  onChange={(e) => setContact({ phone: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Location override">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Kraków, Poland"
                  value={config.contact?.location ?? ""}
                  onChange={(e) => setContact({ location: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Twitter URL">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="https://x.com/yourhandle"
                  value={config.contact?.twitter ?? ""}
                  onChange={(e) => setContact({ twitter: e.target.value })}
                />
              </FieldGroup>
            </div>
          </details>

          <div className="border-t border-[#2a2d3a]" />

          {/* Target Roles */}
          <details>
            <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
              Target Roles
            </summary>
            <div className="mt-3 border-t border-[#2a2d3a] pt-3">
              <FieldGroup label="Primary roles (one per line)">
                <textarea
                  rows={4}
                  className={INPUT_CLS}
                  placeholder={"Software Engineer\nBackend Developer\nRobotics Software Engineer"}
                  value={(config.target_roles?.primary ?? []).join("\n")}
                  onChange={(e) => setTargetRoles(e.target.value)}
                />
              </FieldGroup>
            </div>
          </details>

          <div className="border-t border-[#2a2d3a]" />

          {/* Narrative */}
          <details>
            <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
              Narrative
            </summary>
            <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#2a2d3a] pt-3">
              <FieldGroup label="Headline">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Software engineer specialising in full-stack and robotics systems"
                  value={config.narrative?.headline ?? ""}
                  onChange={(e) => setNarrative({ headline: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Exit story">
                <textarea
                  rows={3}
                  className={INPUT_CLS}
                  placeholder="What you've done and where you're heading next"
                  value={config.narrative?.exit_story ?? ""}
                  onChange={(e) => setNarrative({ exit_story: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Superpowers (one per line)">
                <textarea
                  rows={3}
                  className={INPUT_CLS}
                  placeholder={"Full-stack web development\nRobotics and embedded systems\nCI/CD and DevOps"}
                  value={(config.narrative?.superpowers ?? []).join("\n")}
                  onChange={(e) =>
                    setNarrative({
                      superpowers: e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </FieldGroup>
            </div>
          </details>

          <div className="border-t border-[#2a2d3a]" />

          {/* Compensation */}
          <details>
            <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
              Compensation
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#2a2d3a] pt-3">
              <FieldGroup label="Target range">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="$80K-120K"
                  value={config.compensation?.target_range ?? ""}
                  onChange={(e) => setCompensation({ target_range: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Currency">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="USD"
                  value={config.compensation?.currency ?? ""}
                  onChange={(e) => setCompensation({ currency: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Minimum">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="$70K"
                  value={config.compensation?.minimum ?? ""}
                  onChange={(e) => setCompensation({ minimum: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Location flexibility">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Remote or hybrid"
                  value={config.compensation?.location_flexibility ?? ""}
                  onChange={(e) => setCompensation({ location_flexibility: e.target.value })}
                />
              </FieldGroup>
            </div>
          </details>

          <div className="border-t border-[#2a2d3a]" />

          {/* Location */}
          <details>
            <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
              Location
            </summary>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#2a2d3a] pt-3">
              <FieldGroup label="Country">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Poland"
                  value={config.location?.country ?? ""}
                  onChange={(e) => setLocation({ country: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="City">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="Kraków"
                  value={config.location?.city ?? ""}
                  onChange={(e) => setLocation({ city: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Timezone">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="CET"
                  value={config.location?.timezone ?? ""}
                  onChange={(e) => setLocation({ timezone: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Visa status">
                <input
                  type="text"
                  className={INPUT_CLS}
                  placeholder="EU citizen"
                  value={config.location?.visa_status ?? ""}
                  onChange={(e) => setLocation({ visa_status: e.target.value })}
                />
              </FieldGroup>
            </div>
          </details>
        </div>

        {/* Sync button */}
        <div className="mt-5 pt-4 border-t border-[#2a2d3a] flex items-center gap-4 flex-wrap">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 rounded bg-cyan-500 text-[#0f1117] font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {syncing ? "Syncing…" : "Sync to career-ops"}
          </button>

          {syncResult && (
            <p
              className={`text-sm font-mono ${
                syncResult.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {syncResult.message}
            </p>
          )}
        </div>
      </div>

      {/* Section 1 — Evaluate */}
      <div className="card p-4 mb-6">
        <h2 className="text-slate-100 font-semibold mb-1">Evaluate a Job</h2>
        <p className="text-slate-500 text-xs font-mono mb-4">
          Submit a job posting URL for career-ops analysis
        </p>

        <form onSubmit={handleEvaluate} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/jobs/123"
            required
            disabled={evaluating}
            className="flex-1 bg-[#0f1117] border border-[#2a2d3a] text-slate-100 rounded px-3 py-2 font-mono text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={evaluating || !url.trim()}
            className="px-4 py-2 rounded bg-cyan-500 text-[#0f1117] font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {evaluating ? "Running…" : "Evaluate"}
          </button>
        </form>

        {jobStatus && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs font-mono">Status:</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[jobStatus]}`}
              >
                {jobStatus}
              </span>
            </div>

            {logLines.length > 0 && (
              <pre
                ref={logBoxRef}
                className="bg-[#0f1117] border border-[#2a2d3a] rounded p-3 text-xs font-mono text-slate-400 max-h-64 overflow-y-auto whitespace-pre-wrap break-words"
              >
                {logLines.join("")}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Section 2 — Publish CV */}
      <div className="card p-4 mb-6">
        <h2 className="text-slate-100 font-semibold mb-1">Publish Master CV</h2>
        <p className="text-slate-500 text-xs font-mono mb-4">
          Copy the master CV from the career-ops output volume to{" "}
          <span className="text-slate-300">public/cv.pdf</span>
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={handlePublish}
            disabled={publishing || evaluating}
            className="px-4 py-2 rounded bg-cyan-500 text-[#0f1117] font-semibold text-sm hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {publishing ? "Publishing…" : "Publish CV"}
          </button>

          {publishResult && (
            <p
              className={`text-sm font-mono ${
                publishResult.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {publishResult.message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
