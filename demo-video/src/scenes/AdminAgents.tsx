import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn, stagger } from "../utils";

const BG = "#0f1117";
const CARD = "#1a1d27";
const BORDER = "#2a2d3a";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const CYAN = "#06b6d4";

const NAV_ITEMS = ["Dashboard", "Blog", "Projects", "Agents", "Career", "Settings"];

const AGENTS = [
  {
    name: "GitHub Summarizer",
    description: "Summarizes GitHub activity into blog-ready digest",
    status: "Completed",
    lastRun: "2m ago",
    running: false,
  },
  {
    name: "Robotics News",
    description: "Curates ROS and robotics news from RSS feeds",
    status: "Completed",
    lastRun: "1h ago",
    running: false,
  },
  {
    name: "Blog Suggester",
    description: "Suggests post topics based on recent activity",
    status: "Running",
    lastRun: "now",
    running: true,
  },
  {
    name: "Brand Monitor",
    description: "Scans for mentions of your name online",
    status: "Scheduled",
    lastRun: "3h ago",
    running: false,
  },
  {
    name: "Skills Inference",
    description: "Infers skills from GitHub repos and generates diff",
    status: "Completed",
    lastRun: "6h ago",
    running: false,
  },
  {
    name: "Project Importer",
    description: "Imports GitHub repos as portfolio projects",
    status: "Completed",
    lastRun: "12h ago",
    running: false,
  },
  {
    name: "Platform Sync",
    description: "Syncs profile data across connected platforms",
    status: "Scheduled",
    lastRun: "1d ago",
    running: false,
  },
];

export const AdminAgents: React.FC = () => {
  const frame = useCurrentFrame();
  const uiOpacity = fadeIn(frame, 0, 20);

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
          opacity: uiOpacity,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "0 20px 24px",
            borderBottom: `1px solid ${BORDER}`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>
            Portfolio
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Admin</div>
        </div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              color: item === "Agents" ? CYAN : MUTED,
              background:
                item === "Agents" ? "rgba(6,182,212,0.08)" : "transparent",
              borderLeft:
                item === "Agents"
                  ? `2px solid ${CYAN}`
                  : "2px solid transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${BORDER}`,
            opacity: uiOpacity,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>
            AI Agents
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
            7 autonomous agents — run on cron or trigger manually
          </div>
        </div>

        <div
          style={{
            padding: "20px 28px",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
            overflow: "hidden",
          }}
        >
          {AGENTS.slice(0, 6).map((agent, i) => (
            <AgentCard
              key={agent.name}
              {...agent}
              opacity={stagger(i, frame, 15, 15, 20)}
              frame={frame}
            />
          ))}
        </div>

        {/* 7th agent — full width mini */}
        <div
          style={{
            padding: "0 28px",
            opacity: stagger(6, frame, 15, 15, 20),
          }}
        >
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
                {AGENTS[6].name}
              </div>
              <div style={{ fontSize: 11, color: MUTED }}>
                {AGENTS[6].description}
              </div>
            </div>
            <StatusBadge status={AGENTS[6].status} />
            <span style={{ fontSize: 11, color: "#475569" }}>
              {AGENTS[6].lastRun}
            </span>
            <button
              style={{
                padding: "5px 12px",
                border: `1px solid ${CYAN}`,
                borderRadius: 4,
                background: "transparent",
                color: CYAN,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Run now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function AgentCard({
  name,
  description,
  status,
  lastRun,
  running,
  opacity,
  frame,
}: {
  name: string;
  description: string;
  status: string;
  lastRun: string;
  running: boolean;
  opacity: number;
  frame: number;
}) {
  // Spinner rotation for running agent
  const rotation = running ? (frame * 8) % 360 : 0;

  return (
    <div
      style={{
        background: CARD,
        border: running
          ? `1px solid rgba(6,182,212,0.4)`
          : `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity,
        boxShadow: running ? "0 0 0 1px rgba(6,182,212,0.15)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
          {name}
        </div>
        {running ? (
          <div
            style={{
              width: 14,
              height: 14,
              border: `2px solid transparent`,
              borderTopColor: CYAN,
              borderRightColor: CYAN,
              borderRadius: "50%",
              transform: `rotate(${rotation}deg)`,
            }}
          />
        ) : (
          <StatusBadge status={status} />
        )}
      </div>

      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
        {description}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 4,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "#475569",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {running ? "Running..." : `Last: ${lastRun}`}
        </span>
        <button
          style={{
            padding: "4px 10px",
            border: `1px solid ${running ? CYAN : BORDER}`,
            borderRadius: 3,
            background: running ? "rgba(6,182,212,0.1)" : "transparent",
            color: running ? CYAN : MUTED,
            fontSize: 11,
            cursor: "pointer",
          }}
        >
          {running ? "Running..." : "Run now"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Completed: { bg: "rgba(52,211,153,0.15)", color: "#34d399" },
    Running: { bg: "rgba(6,182,212,0.15)", color: "#06b6d4" },
    Scheduled: { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" },
    Failed: { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
  };
  const c = colors[status] || colors.Scheduled;
  return (
    <span
      style={{
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 3,
        background: c.bg,
        color: c.color,
        fontWeight: 500,
        letterSpacing: "0.3px",
      }}
    >
      {status}
    </span>
  );
}
