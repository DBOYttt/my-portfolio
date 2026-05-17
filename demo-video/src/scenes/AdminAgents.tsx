import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger } from "../utils";
import { C, F } from "../design";
import { AGENTS } from "../data";
import { interTight, jetbrainsMono } from "../Root";

const DURATION = 330;

const NAV_ITEMS = [
  { label: "Dashboard", active: false },
  { label: "Blog",      active: false },
  { label: "Projects",  active: false },
  { label: "Skills",    active: false },
  { label: "Experience",active: false },
  { label: "Media",     active: false },
  { label: "Agents",    active: true  },
  { label: "MCP",       active: false },
  { label: "Career",    active: false },
  { label: "Tools",     active: false },
];

function Sidebar() {
  return (
    <div style={{
      width: 224,
      background: C.adminCard,
      borderRight: `1px solid ${C.adminBorder}`,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${C.adminBorder}` }}>
        <div style={{ fontFamily: jetbrainsMono, fontSize: 12, color: C.adminCyan }}>{">"} admin</div>
      </div>
      {NAV_ITEMS.map(({ label, active }) => (
        <div key={label} style={{
          padding: "9px 20px",
          fontFamily: interTight, fontSize: 13, fontWeight: 500,
          color: active ? "#22d3ee" : C.adminMuted,
          background: active ? "rgba(6,182,212,0.10)" : "transparent",
          borderLeft: active ? "2px solid #22d3ee" : "2px solid transparent",
          letterSpacing: "0.01em",
        }}>
          {label}
        </div>
      ))}
    </div>
  );
}

function TopBar() {
  return (
    <div style={{
      height: 56,
      background: C.adminCard,
      borderBottom: `1px solid ${C.adminBorder}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: "0 24px",
      gap: 12,
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: jetbrainsMono, fontSize: 11, color: C.adminMuted }}>admin@localhost</span>
      <span style={{
        fontFamily: interTight, fontSize: 12, color: C.adminText,
        border: `1px solid ${C.adminBorder}`, padding: "4px 12px", borderRadius: 4,
      }}>Sign out</span>
    </div>
  );
}

function FeatureBar({ label, sub, frame, DURATION: dur }: {
  label: string; sub: string; frame: number; DURATION: number;
}) {
  const opacity = interpolate(
    frame,
    [25, 40, dur - 35, dur - 20],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 44,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", padding: "0 48px", gap: 16,
      opacity, pointerEvents: "none", zIndex: 20,
    }}>
      <div style={{
        width: 4, height: 20, borderRadius: 2,
        background: "#06b6d4",
      }} />
      <div style={{ fontFamily: jetbrainsMono, fontSize: 12, color: "#fff", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: jetbrainsMono, fontSize: 11, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" }}>
        {sub}
      </div>
    </div>
  );
}

function Callout({ label, x, y, from, to, frame }: {
  label: string; x: number; y: number; from: number; to: number; frame: number;
}) {
  const opacity = interpolate(
    frame, [from, from + 12, to - 8, to], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div style={{
      position: "absolute", left: x, top: y, opacity,
      pointerEvents: "none", zIndex: 15,
    }}>
      <div style={{
        background: "rgba(12,12,20,0.85)", backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.20)", borderRadius: 5,
        padding: "5px 12px", fontSize: 12, color: "#fff", fontWeight: 500,
        fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}>
        {label}
      </div>
    </div>
  );
}

export const AdminAgents: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFadeIn = fadeOut(frame, 0, 20);
  const globalFadeOut = fadeIn(frame, DURATION - 20, 20);

  return (
    <AbsoluteFill style={{ background: C.adminBg, display: "flex", flexDirection: "row" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />

        <div style={{ padding: 24, flex: 1, overflowY: "hidden" }}>
          <h1 style={{
            fontFamily: interTight, fontSize: 22, fontWeight: 700,
            color: C.adminText, margin: "0 0 4px",
          }}>
            AI Agents
          </h1>
          <p style={{
            fontFamily: jetbrainsMono, fontSize: 12, color: C.adminMuted,
            margin: "0 0 20px", letterSpacing: "0.02em",
          }}>
            7 autonomous research agents — run on cron or trigger manually
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {AGENTS.map((agent, i) => (
              <div key={i} style={{
                background: C.adminCard,
                border: `1px solid ${C.adminBorder}`,
                borderRadius: 8,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: stagger(i, frame, 20, 20, 22),
                transform: `translateY(${interpolate(
                  frame,
                  [20 + i * 20, 42 + i * 20],
                  [10, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )}px)`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <span style={{
                      fontFamily: interTight, fontSize: 14, fontWeight: 600, color: C.adminText,
                    }}>
                      {agent.name}
                    </span>
                    <span style={{
                      fontFamily: jetbrainsMono, fontSize: 9, color: C.adminCyan,
                      background: C.adminBadgeBg, padding: "2px 7px", borderRadius: 999,
                    }}>
                      1 new
                    </span>
                    <span style={{
                      fontFamily: jetbrainsMono, fontSize: 9,
                      color: "#4ade80", background: "rgba(74,222,128,0.10)",
                      padding: "2px 7px", borderRadius: 999,
                    }}>
                      enabled
                    </span>
                  </div>
                  <p style={{
                    fontFamily: interTight, fontSize: 12, color: C.adminMuted, margin: "0 0 6px",
                  }}>
                    {agent.desc}
                  </p>
                  <span style={{
                    fontFamily: jetbrainsMono, fontSize: 10, color: C.adminFaint,
                  }}>
                    Latest: Report — May 2026 · 5/15/2026
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0, marginLeft: 20 }}>
                  <span style={{
                    fontFamily: interTight, fontSize: 12, color: C.adminText,
                    background: C.adminBg, border: `1px solid ${C.adminBorder}`,
                    padding: "6px 14px", borderRadius: 4,
                  }}>
                    Run now
                  </span>
                  <span style={{
                    fontFamily: interTight, fontSize: 12, color: C.adminMuted,
                    border: `1px solid ${C.adminBorder}`,
                    padding: "6px 14px", borderRadius: 4,
                  }}>
                    View reports
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Callout annotations */}
      <Callout frame={frame} label="7 agents — run weekly via cron" x={248} y={85} from={30} to={150} />
      <Callout frame={frame} label='"N new" — unread report counter' x={248} y={188} from={80} to={200} />
      <Callout frame={frame} label="Run now — instant manual trigger" x={870} y={188} from={140} to={260} />
      <Callout frame={frame} label="Each agent stores reports in DB" x={248} y={310} from={200} to={320} />

      {/* Feature bar */}
      <FeatureBar
        label="Admin Panel — AI Agents"
        sub="7 autonomous agents · run on cron or manually · reports stored in DB"
        frame={frame}
        DURATION={DURATION}
      />

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
