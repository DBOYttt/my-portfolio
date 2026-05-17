import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger } from "../utils";
import { C, F } from "../design";
import { AGENTS } from "../data";
import { interTight, jetbrainsMono } from "../Root";

const DURATION = 180;

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

export const AdminAgents: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFadeIn = fadeOut(frame, 0, 18);
  const globalFadeOut = fadeIn(frame, DURATION - 18, 18);

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
                opacity: stagger(i, frame, 15, 15, 20),
                transform: `translateY(${interpolate(
                  frame,
                  [15 + i * 15, 35 + i * 15],
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

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
