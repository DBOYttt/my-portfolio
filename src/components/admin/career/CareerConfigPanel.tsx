"use client";

import { useState, useEffect, useCallback } from "react";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { CareerConfig, SyncResponse } from "@/types/career";
import { INPUT_CLS, FieldGroup } from "./shared";

export default function CareerConfigPanel() {
  const [config, setConfig] = useState<CareerConfig>({});
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { saved: savedIndicator, error: saveError, markServerState } = useAutoSave(
    config,
    async (updated) => {
      const res = await fetch("/api/admin/career/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("save failed");
    }
  );

  const loadConfig = useCallback(() => {
    setConfigLoading(true);
    setConfigError(false);
    fetch("/api/admin/career/config")
      .then((r) => r.json())
      .then((data: CareerConfig) => {
        markServerState(data);
        setConfig(data);
        setConfigLoading(false);
      })
      .catch(() => {
        setConfigError(true);
        setConfigLoading(false);
      });
  }, [markServerState]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

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
    setConfig((prev) => ({ ...prev, target_roles: { ...prev.target_roles, primary: arr } }));
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/admin/career/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      setSyncResult(
        res.ok && data.ok
          ? { ok: true, message: "Synced — profile.yml and cv.md updated" }
          : { ok: false, message: data.error ?? "Sync failed" }
      );
    } catch {
      setSyncResult({ ok: false, message: "Network error — could not reach career-ops" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-slate-100 font-semibold">Career Profile</h2>
        <div className="flex items-center gap-2">
          {savedIndicator && (
            <span className="text-xs text-green-400 font-mono flex items-center gap-1">
              <span>&#10003;</span> Saved
            </span>
          )}
          {saveError && !configLoading && !configError && (
            <span
              title="Auto-save failed — check your session"
              className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1 align-middle"
            />
          )}
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || configLoading}
            className="btn-secondary text-xs py-1 px-3 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync to career-ops"}
          </button>
        </div>
      </div>
      <p className="text-slate-500 text-xs font-mono mb-4">
        Auto-saved. Sync pushes profile.yml + cv.md to career-ops container.
      </p>

      {syncResult && (
        <div
          className={`mb-4 text-xs font-mono px-3 py-2 rounded border ${
            syncResult.ok
              ? "text-green-400 border-green-500/20 bg-green-500/10"
              : "text-red-400 border-red-500/20 bg-red-500/10"
          }`}
        >
          {syncResult.message}
        </div>
      )}

      <div className="space-y-4">
        {configLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-[#2a2d3a] rounded" />
            ))}
          </div>
        ) : configError ? (
          <div className="text-red-400 text-sm font-mono space-y-2">
            <p>Could not load career profile.</p>
            <button
              onClick={loadConfig}
              className="text-cyan-400 hover:text-cyan-300 underline text-xs"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
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
                <FieldGroup label="Twitter handle">
                  <input
                    type="text"
                    className={INPUT_CLS}
                    placeholder="@yourhandle"
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
                        superpowers: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
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
                  <input type="text" className={INPUT_CLS} placeholder="$80K-120K"
                    value={config.compensation?.target_range ?? ""}
                    onChange={(e) => setCompensation({ target_range: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Currency">
                  <input type="text" className={INPUT_CLS} placeholder="USD"
                    value={config.compensation?.currency ?? ""}
                    onChange={(e) => setCompensation({ currency: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Minimum">
                  <input type="text" className={INPUT_CLS} placeholder="$70K"
                    value={config.compensation?.minimum ?? ""}
                    onChange={(e) => setCompensation({ minimum: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Location flexibility">
                  <input type="text" className={INPUT_CLS} placeholder="Remote or hybrid"
                    value={config.compensation?.location_flexibility ?? ""}
                    onChange={(e) => setCompensation({ location_flexibility: e.target.value })} />
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
                  <input type="text" className={INPUT_CLS} placeholder="Poland"
                    value={config.location?.country ?? ""}
                    onChange={(e) => setLocation({ country: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="City">
                  <input type="text" className={INPUT_CLS} placeholder="Kraków"
                    value={config.location?.city ?? ""}
                    onChange={(e) => setLocation({ city: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Timezone">
                  <input type="text" className={INPUT_CLS} placeholder="CET"
                    value={config.location?.timezone ?? ""}
                    onChange={(e) => setLocation({ timezone: e.target.value })} />
                </FieldGroup>
                <FieldGroup label="Visa status">
                  <input type="text" className={INPUT_CLS} placeholder="EU citizen"
                    value={config.location?.visa_status ?? ""}
                    onChange={(e) => setLocation({ visa_status: e.target.value })} />
                </FieldGroup>
              </div>
            </details>

            <div className="border-t border-[#2a2d3a]" />

            {/* CV Settings */}
            <details>
              <summary className="text-slate-300 text-sm font-semibold cursor-pointer select-none py-1">
                CV Settings
              </summary>
              <div className="mt-3 border-t border-[#2a2d3a] pt-3">
                <FieldGroup label="Output format">
                  <select
                    className={INPUT_CLS}
                    value={config.cv_output_format ?? "pdf"}
                    onChange={(e) => setConfig((prev) => ({ ...prev, cv_output_format: e.target.value }))}
                  >
                    <option value="pdf">PDF</option>
                    <option value="html">HTML</option>
                    <option value="docx">DOCX</option>
                  </select>
                </FieldGroup>
              </div>
            </details>
          </>
        )}
      </div>
    </div>
  );
}

