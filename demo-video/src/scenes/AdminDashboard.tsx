import React from "react";
import { useCurrentFrame, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger, countUp } from "../utils";
import { C, F } from "../design";
import { newsreader, interTight, jetbrainsMono } from "../Root";

const DURATION = 150;

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

export const AdminDashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFadeIn = fadeOut(frame, 0, 18);
  const globalFadeOut = fadeIn(frame, DURATION - 18, 18);
  const insightsOpacity = fadeIn(frame, 60, 20);

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
                opacity: stagger(i, frame, 15, 12, 18),
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
                opacity: stagger(i, frame, 65, 8, 12),
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

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
