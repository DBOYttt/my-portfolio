import React from "react";
import { useCurrentFrame, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger } from "../utils";
import { C, F } from "../design";
import { interTight, jetbrainsMono } from "../Root";

const DURATION = 150;

const NAV_ITEMS = [
  { label: "Dashboard", active: false },
  { label: "Blog",      active: false },
  { label: "Projects",  active: false },
  { label: "Skills",    active: false },
  { label: "Experience",active: false },
  { label: "Media",     active: false },
  { label: "Agents",    active: false },
  { label: "MCP",       active: false },
  { label: "Career",    active: true  },
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

export const AdminCareer: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFadeIn = fadeOut(frame, 0, 18);
  const globalFadeOut = fadeIn(frame, DURATION - 18, 18);

  const EVALUATIONS = [
    { title: "Senior Software Engineer", co: "@ Acme Corp",            score: 87, rec: "Recommended", color: "#22c55e" },
    { title: "Robotics Engineer",        co: "@ TechCorp Automation",  score: 92, rec: "Recommended", color: "#22c55e" },
    { title: "Frontend Developer",       co: "@ StartupXYZ",           score: 64, rec: "Review",       color: "#f59e0b" },
  ];

  return (
    <AbsoluteFill style={{ background: C.adminBg, display: "flex", flexDirection: "row" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />

        <div style={{ padding: 24, flex: 1, overflowY: "hidden" }}>
          {/* Header row */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}>
            <div>
              <h1 style={{
                fontFamily: interTight, fontSize: 22, fontWeight: 700,
                color: C.adminText, margin: "0 0 4px",
              }}>
                Career Ops
              </h1>
              <p style={{
                fontFamily: jetbrainsMono, fontSize: 12, color: C.adminMuted,
                margin: 0, letterSpacing: "0.02em",
              }}>
                AI-powered job evaluation and CV pipeline
              </p>
            </div>
            <div style={{
              background: C.adminCyan, color: "#000",
              fontFamily: interTight, fontSize: 12, fontWeight: 600,
              padding: "8px 16px", borderRadius: 4, flexShrink: 0,
            }}>
              Publish Master CV
            </div>
          </div>

          {/* Evaluate form */}
          <div style={{
            background: C.adminCard,
            border: `1px solid ${C.adminBorder}`,
            borderRadius: 8,
            padding: 20,
            marginBottom: 24,
            opacity: fadeIn(frame, 8, 20),
          }}>
            <h2 style={{
              fontFamily: interTight, fontSize: 14, fontWeight: 600,
              color: C.adminText, margin: "0 0 12px",
            }}>
              Evaluate Job Posting
            </h2>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{
                flex: 1, background: C.adminBg,
                border: `1px solid ${C.adminBorder}`,
                borderRadius: 4, padding: "8px 12px",
                display: "flex", alignItems: "center",
              }}>
                <span style={{ fontFamily: jetbrainsMono, fontSize: 12, color: C.adminFaint }}>
                  https://jobs.example.com/senior-engineer...
                </span>
              </div>
              <div style={{
                background: C.adminCyan, color: "#000",
                fontFamily: interTight, fontSize: 12, fontWeight: 600,
                padding: "8px 16px", borderRadius: 4, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}>
                Evaluate Job
              </div>
            </div>
          </div>

          {/* Evaluation results */}
          {EVALUATIONS.map(({ title, co, score, rec, color }, i) => (
            <div key={i} style={{
              background: C.adminCard,
              border: `1px solid ${C.adminBorder}`,
              borderRadius: 8,
              padding: "16px 20px",
              marginBottom: 12,
              opacity: stagger(i, frame, 35, 15, 18),
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: interTight, fontSize: 14, fontWeight: 600, color: C.adminText, marginBottom: 10,
                  }}>
                    {title}{" "}
                    <span style={{ color: C.adminMuted, fontWeight: 400 }}>{co}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Score bar */}
                    <div style={{
                      width: 160, height: 6, background: C.adminBg, borderRadius: 3, overflow: "hidden",
                    }}>
                      <div style={{
                        width: `${score}%`, height: "100%", background: color, borderRadius: 3,
                      }} />
                    </div>
                    <span style={{
                      fontFamily: jetbrainsMono, fontSize: 12, color, fontWeight: 600,
                    }}>
                      {score}%
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <span style={{
                    fontFamily: jetbrainsMono, fontSize: 11, color,
                    background: color === "#22c55e" ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
                    padding: "3px 10px", borderRadius: 999,
                  }}>
                    {rec}
                  </span>
                  <span style={{
                    fontFamily: interTight, fontSize: 12, color: C.adminMuted,
                    border: `1px solid ${C.adminBorder}`,
                    padding: "5px 12px", borderRadius: 4,
                  }}>
                    View Report
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
