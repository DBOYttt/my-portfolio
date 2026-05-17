import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, stagger, countUp } from "../utils";

const BG = "#0f1117";
const CARD = "#1a1d27";
const BORDER = "#2a2d3a";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const CYAN = "#06b6d4";

const STATS = [
  { label: "Blog Posts", value: 12, icon: "✍️" },
  { label: "Projects", value: 8, icon: "📁" },
  { label: "AI Agents", value: 7, icon: "🤖" },
  { label: "Skills", value: 24, icon: "⚡" },
];

const NAV_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Blog", active: false },
  { label: "Projects", active: false },
  { label: "Agents", active: false },
  { label: "Career", active: false },
  { label: "Settings", active: false },
];

const ACTIVITY = [
  { type: "agent", text: "GitHub Summarizer ran successfully", time: "2m ago" },
  { type: "post", text: 'New post: "ROS2 Nav Stack"', time: "1h ago" },
  { type: "agent", text: "Skills Inference generated diff", time: "3h ago" },
  { type: "job", text: "Job eval: Score 92% — Recommended", time: "6h ago" },
];

export const AdminDashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const sidebarOpacity = fadeIn(frame, 0, 20);
  const headerOpacity = fadeIn(frame, 8, 18);
  const activityOpacity = fadeIn(frame, 70, 20);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BG,
        display: "flex",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 200,
          background: CARD,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          opacity: sidebarOpacity,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "0 20px 24px",
            borderBottom: `1px solid ${BORDER}`,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: TEXT,
              letterSpacing: "-0.3px",
            }}
          >
            Portfolio
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
            Admin
          </div>
        </div>

        {/* Nav items */}
        {NAV_ITEMS.map((item) => (
          <div
            key={item.label}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              color: item.active ? CYAN : MUTED,
              background: item.active ? "rgba(6,182,212,0.08)" : "transparent",
              borderLeft: item.active ? `2px solid ${CYAN}` : "2px solid transparent",
              cursor: "pointer",
              letterSpacing: "0.2px",
            }}
          >
            {item.label}
          </div>
        ))}

        {/* Bottom user */}
        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 12, color: MUTED }}>admin</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
            diboy.dev
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            padding: "20px 32px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: headerOpacity,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>
              Dashboard
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              Overview of your portfolio platform
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: MUTED,
              fontFamily: "'Courier New', monospace",
              letterSpacing: "0.5px",
            }}
          >
            2026-05-17
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px", flex: 1, overflow: "hidden" }}>
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {STATS.map((stat, i) => {
              const cardOpacity = stagger(i, frame, 15, 12, 18);
              const value = countUp(frame, 20 + i * 8, 30, stat.value);
              return (
                <div
                  key={stat.label}
                  style={{
                    background: CARD,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: "18px 20px",
                    opacity: cardOpacity,
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      marginBottom: 10,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: CYAN,
                      lineHeight: 1,
                      marginBottom: 6,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED }}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent activity */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              overflow: "hidden",
              opacity: activityOpacity,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${BORDER}`,
                fontSize: 13,
                fontWeight: 600,
                color: TEXT,
              }}
            >
              Recent Activity
            </div>
            {ACTIVITY.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 20px",
                  borderBottom:
                    i < ACTIVITY.length - 1
                      ? `1px solid ${BORDER}`
                      : "none",
                  gap: 12,
                  opacity: stagger(i, frame, 75, 8, 12),
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      item.type === "agent"
                        ? CYAN
                        : item.type === "job"
                        ? "#a78bfa"
                        : "#34d399",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: MUTED, flex: 1 }}>
                  {item.text}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
