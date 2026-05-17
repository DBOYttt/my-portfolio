import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn, stagger } from "../utils";

const BG = "#0f1117";
const CARD = "#1a1d27";
const BORDER = "#2a2d3a";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const CYAN = "#06b6d4";
const CODE_BG = "#111318";

const NAV_ITEMS = ["Dashboard", "Blog", "Projects", "Agents", "Career", "Settings"];

const MARKDOWN_LINES = [
  "# Introduction to ROS2 Navigation Stack",
  "",
  "Nav2 is the standard autonomous navigation solution for ROS2.",
  "In this post we configure it with SLAM Toolbox.",
  "",
  "## Prerequisites",
  "",
  "- ROS2 Humble installed",
  "- A working robot URDF",
  "- `slam_toolbox` and `nav2_bringup` packages",
  "",
  "## Configuration",
  "",
  "```yaml",
  "bt_navigator:",
  "  ros__parameters:",
  "    use_sim_time: false",
  "    global_costmap:",
  "      global_frame: map",
  "```",
  "",
  "## Running the Stack",
];

export const AdminBlogEditor: React.FC = () => {
  const frame = useCurrentFrame();

  const uiOpacity = fadeIn(frame, 0, 20);
  const editorOpacity = fadeIn(frame, 15, 20);

  // Simulate "typing" — reveal lines progressively
  const visibleLines = Math.min(
    Math.floor(
      interpolate(frame, [20, 140], [1, MARKDOWN_LINES.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    ),
    MARKDOWN_LINES.length
  );

  // Cursor blink
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

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
              color: item === "Blog" ? CYAN : MUTED,
              background:
                item === "Blog" ? "rgba(6,182,212,0.08)" : "transparent",
              borderLeft:
                item === "Blog" ? `2px solid ${CYAN}` : "2px solid transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div
          style={{
            padding: "16px 28px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: uiOpacity,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: MUTED }}>Blog</span>
            <span style={{ color: BORDER, fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: TEXT, fontWeight: 500 }}>
              Edit Post
            </span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                padding: "7px 16px",
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                background: "transparent",
                color: MUTED,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Save Draft
            </button>
            <button
              style={{
                padding: "7px 16px",
                border: "none",
                borderRadius: 4,
                background: CYAN,
                color: "#000",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Publish
            </button>
          </div>
        </div>

        {/* Title input */}
        <div
          style={{
            padding: "20px 28px 0",
            opacity: editorOpacity,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: TEXT,
              padding: "10px 0",
              borderBottom: `1px solid ${BORDER}`,
              marginBottom: 0,
              letterSpacing: "-0.3px",
            }}
          >
            Introduction to ROS2 Navigation Stack
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: "10px 28px",
            display: "flex",
            gap: 4,
            borderBottom: `1px solid ${BORDER}`,
            opacity: editorOpacity,
          }}
        >
          {["B", "I", "</>", "🔗", "H1", "H2", "—"].map((btn) => (
            <button
              key={btn}
              style={{
                padding: "4px 10px",
                border: `1px solid ${BORDER}`,
                borderRadius: 3,
                background: "transparent",
                color: MUTED,
                fontSize: 12,
                cursor: "pointer",
                fontFamily:
                  btn === "</>" ? "'Courier New', monospace" : "inherit",
              }}
            >
              {btn}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 11, color: "#475569", alignSelf: "center" }}>
            Markdown
          </span>
        </div>

        {/* Two-panel editor */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left: Markdown source */}
          <div
            style={{
              flex: 1,
              background: CODE_BG,
              borderRight: `1px solid ${BORDER}`,
              padding: "20px 24px",
              overflow: "hidden",
              opacity: editorOpacity,
              fontFamily: "'Courier New', monospace",
              fontSize: 13,
              color: MUTED,
              lineHeight: 1.7,
            }}
          >
            {MARKDOWN_LINES.slice(0, visibleLines).map((line, i) => (
              <div key={i} style={{ color: getLineColor(line) }}>
                {line || " "}
                {i === visibleLines - 1 && cursorVisible && (
                  <span
                    style={{
                      display: "inline-block",
                      width: 2,
                      height: "1em",
                      background: CYAN,
                      marginLeft: 1,
                      verticalAlign: "text-bottom",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Right: Preview */}
          <div
            style={{
              flex: 1,
              background: "#13161f",
              padding: "20px 28px",
              overflow: "hidden",
              opacity: editorOpacity,
              fontFamily: "Georgia, serif",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "'Courier New', monospace",
                color: "#475569",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Preview
            </div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: TEXT,
                marginBottom: 12,
                lineHeight: 1.3,
              }}
            >
              Introduction to ROS2 Navigation Stack
            </h1>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.8, margin: "0 0 12px" }}>
              Nav2 is the standard autonomous navigation solution for ROS2.
              In this post we configure it with SLAM Toolbox.
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: TEXT, margin: "16px 0 8px" }}>
              Prerequisites
            </h2>
            <ul
              style={{
                fontSize: 13,
                color: MUTED,
                lineHeight: 1.8,
                paddingLeft: 20,
                margin: "0 0 12px",
              }}
            >
              <li>ROS2 Humble installed</li>
              <li>A working robot URDF</li>
              <li>slam_toolbox and nav2_bringup</li>
            </ul>
            <div
              style={{
                background: CODE_BG,
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                padding: "12px 16px",
                fontSize: 12,
                fontFamily: "'Courier New', monospace",
                color: "#7dd3fc",
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: "#94a3b8" }}>bt_navigator:</div>
              <div style={{ paddingLeft: 16, color: "#94a3b8" }}>
                ros__parameters:
              </div>
              <div style={{ paddingLeft: 32, color: "#86efac" }}>
                use_sim_time: false
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function getLineColor(line: string): string {
  if (line.startsWith("# ")) return "#7dd3fc";
  if (line.startsWith("## ")) return "#93c5fd";
  if (line.startsWith("```")) return "#a78bfa";
  if (line.startsWith("- ")) return "#86efac";
  if (line.trim() === "") return "transparent";
  return "#94a3b8";
}
