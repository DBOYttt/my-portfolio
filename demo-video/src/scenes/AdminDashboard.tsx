import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger, countUp } from "../utils";
import { C, F } from "../design";
import { newsreader, interTight, jetbrainsMono } from "../Root";

const DURATION = 270;

const NAV_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Blog",      active: false },
  { label: "Projects",  active: false },
  { label: "Skills",    active: false },
  { label: "Experience",active: false },
  { label: "Media",     active: false },
  { label: "Agents",    active: false },
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
      <div style={{
        padding: "16px 20px 14px",
        borderBottom: `1px solid ${C.adminBorder}`,
      }}>
        <div style={{ fontFamily: jetbrainsMono, fontSize: 12, color: C.adminCyan }}>
          {">"} admin
        </div>
      </div>
      {NAV_ITEMS.map(({ label, active }) => (
        <div key={label} style={{
          padding: "9px 20px",
          fontFamily: interTight,
          fontSize: 13,
          fontWeight: 500,
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
      <span style={{ fontFamily: jetbrainsMono, fontSize: 11, color: C.adminMuted }}>
        admin@localhost
      </span>
      <span style={{
        fontFamily: interTight, fontSize: 12, color: C.adminText,
        border: `1px solid ${C.adminBorder}`, padding: "4px 12px", borderRadius: 4,
      }}>
        Sign out
      </span>
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

export const AdminDashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFadeIn = fadeOut(frame, 0, 20);
  const globalFadeOut = fadeIn(frame, DURATION - 20, 20);
  const insightsOpacity = fadeIn(frame, 90, 25);

  const AGENT_REPORTS = [
    { title: "Skills Analysis — May 2026",         agent: "Skills Inference",        highlighted: false },
    { title: "GitHub Audit — May 2026",             agent: "GitHub Summarizer",       highlighted: false },
    { title: "GitHub Project Import — May 2026",   agent: "GitHub Project Importer", highlighted: true  },
    { title: "Brand Monitor — May 2026",            agent: "Brand Monitor",           highlighted: false },
    { title: "Platform Sync — May 2026",            agent: "Platform Sync",           highlighted: false },
  ];

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
            Dashboard
          </h1>
          <p style={{
            fontFamily: jetbrainsMono, fontSize: 12, color: C.adminMuted,
            margin: "0 0 24px", letterSpacing: "0.02em",
          }}>
            Overview of your portfolio content
          </p>

          {/* Stat cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}>
            {[
              { label: "Total Posts",  start: 20, target: 1  },
              { label: "Published",    start: 26, target: 1  },
              { label: "Projects",     start: 32, target: 8  },
              { label: "Skills",       start: 38, target: 23 },
            ].map(({ label, start, target }, i) => (
              <div key={label} style={{
                background: C.adminCard,
                border: `1px solid ${C.adminBorder}`,
                borderRadius: 8,
                padding: "20px 20px",
                opacity: stagger(i, frame, 20, 15, 20),
              }}>
                <div style={{
                  fontFamily: interTight, fontSize: 11, color: C.adminMuted,
                  marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase",
                }}>
                  {label}
                </div>
                <div style={{
                  fontFamily: jetbrainsMono, fontSize: 36, fontWeight: 700,
                  color: C.adminCyan, lineHeight: 1,
                }}>
                  {countUp(frame, start, 35, target)}
                </div>
              </div>
            ))}
          </div>

          {/* Agent insights card */}
          <div style={{
            background: C.adminCard,
            border: `1px solid ${C.adminBorder}`,
            borderRadius: 8,
            padding: 20,
            opacity: insightsOpacity,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: interTight, fontSize: 14, fontWeight: 600, color: C.adminText }}>
                  Agent insights
                </span>
                <span style={{
                  background: C.adminBadgeBg, color: C.adminCyan,
                  fontFamily: jetbrainsMono, fontSize: 10, padding: "2px 8px", borderRadius: 999,
                }}>
                  5 unread
                </span>
              </div>
              <span style={{ fontFamily: interTight, fontSize: 12, color: C.adminCyan }}>
                View all
              </span>
            </div>

            {AGENT_REPORTS.map(({ title, agent, highlighted }, i) => (
              <div key={i} style={{
                padding: "10px 0",
                borderBottom: i < AGENT_REPORTS.length - 1 ? `1px solid ${C.adminBorder}` : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: highlighted ? "rgba(6,182,212,0.06)" : "transparent",
                opacity: stagger(i, frame, 95, 10, 15),
                paddingLeft: highlighted ? 8 : 0,
              }}>
                <div>
                  <div style={{
                    fontFamily: interTight, fontSize: 13,
                    color: highlighted ? C.adminCyan : C.adminText,
                  }}>
                    {title}
                  </div>
                  <div style={{
                    fontFamily: jetbrainsMono, fontSize: 10, color: C.adminMuted, marginTop: 2,
                  }}>
                    {agent}
                  </div>
                </div>
                <span style={{ fontFamily: jetbrainsMono, fontSize: 10, color: C.adminMuted }}>
                  1d ago
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Callout annotations */}
      <Callout frame={frame} label="10 admin sections" x={12} y={200} from={45} to={180} />
      <Callout frame={frame} label="Live stats — real DB counts" x={248} y={170} from={80} to={200} />
      <Callout frame={frame} label="AI agent reports · 5 unread" x={248} y={320} from={130} to={260} />

      {/* Feature bar */}
      <FeatureBar
        label="Admin Panel — Dashboard"
        sub="Content overview · live stats · AI agent insights"
        frame={frame}
        DURATION={DURATION}
      />

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
