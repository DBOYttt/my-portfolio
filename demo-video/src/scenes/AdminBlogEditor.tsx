import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut } from "../utils";
import { C, F } from "../design";
import { newsreader, interTight, jetbrainsMono } from "../Root";

const DURATION = 360;

const NAV_ITEMS = [
  { label: "Dashboard", active: false },
  { label: "Blog",      active: true  },
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

function TopBar({ frame }: { frame: number }) {
  const topbarOpacity = fadeIn(frame, 0, 20);
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
      opacity: topbarOpacity,
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

export const AdminBlogEditor: React.FC = () => {
  const frame = useCurrentFrame();

  const globalFadeIn = fadeOut(frame, 0, 20);
  const globalFadeOut = fadeIn(frame, DURATION - 20, 20);

  // Animate how many markdown lines are visible — typing effect
  const lineCount = Math.floor(
    interpolate(frame, [30, 280], [0, 14], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const MARKDOWN_LINES: { text: string; color: string }[] = [
    { text: "## Introduction",                              color: "#7dd3fc" },
    { text: "",                                              color: C.adminMuted },
    { text: "Particle filter SLAM represents the",          color: C.adminMuted },
    { text: "robot's belief as a set of weighted",          color: C.adminMuted },
    { text: "particles.",                                    color: C.adminMuted },
    { text: "",                                              color: "" },
    { text: "### Prediction Step",                          color: "#93c5fd" },
    { text: "",                                              color: "" },
    { text: "```cpp",                                        color: "#a5b4fc" },
    { text: "void predict(Particle& p) {",                  color: "#c4b5fd" },
    { text: "  p.theta += w * dt;",                         color: "#c4b5fd" },
    { text: "  p.x += v * cos(p.theta);",                   color: "#c4b5fd" },
    { text: "}",                                             color: "#c4b5fd" },
    { text: "```",                                           color: "#a5b4fc" },
  ];

  const TOOLBAR_BTNS = ["B", "I", "S", "H1", "H2", "—", "</>", "🔗", "❝", "🖼"];

  return (
    <AbsoluteFill style={{ background: C.adminBg, display: "flex", flexDirection: "row" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar frame={frame} />

        <div style={{ padding: 24, flex: 1, overflowY: "hidden" }}>
          <h1 style={{
            fontFamily: interTight, fontSize: 20, fontWeight: 700,
            color: C.adminText, margin: "0 0 20px",
          }}>
            New post
          </h1>

          {/* Title field */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: interTight, fontSize: 12, color: C.adminMuted, marginBottom: 6 }}>
              Title
            </div>
            <div style={{
              background: C.adminCard, border: `1px solid ${C.adminBorder}`,
              borderRadius: 4, padding: "8px 12px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontFamily: interTight, fontSize: 14, color: C.adminText }}>
                Implementing SLAM from Scratch with ROS2
              </span>
              <span style={{
                fontFamily: interTight, fontSize: 12, color: C.adminMuted,
                background: C.adminBg, border: `1px solid ${C.adminBorder}`,
                borderRadius: 4, padding: "4px 10px", flexShrink: 0, marginLeft: 12,
              }}>
                Suggest topics
              </span>
            </div>
          </div>

          {/* Slug + Excerpt */}
          {[
            { label: "Slug",    height: 36, value: "implementing-slam-ros2" },
            { label: "Excerpt", height: 60, value: "A deep dive into building a particle filter SLAM implementation..." },
          ].map(({ label, height, value }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: interTight, fontSize: 12, color: C.adminMuted, marginBottom: 6 }}>
                {label}
              </div>
              <div style={{
                background: C.adminCard, border: `1px solid ${C.adminBorder}`,
                borderRadius: 4, height, padding: "8px 12px",
                display: "flex", alignItems: label === "Slug" ? "center" : "flex-start",
              }}>
                <span style={{ fontFamily: jetbrainsMono, fontSize: 12, color: C.adminMuted }}>
                  {value}
                </span>
              </div>
            </div>
          ))}

          {/* Content header row */}
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: 8,
          }}>
            <div style={{ fontFamily: interTight, fontSize: 12, color: C.adminMuted }}>
              Content
            </div>
            <span style={{ fontFamily: interTight, fontSize: 12, color: C.adminCyan }}>
              Generate draft
            </span>
          </div>

          {/* Markdown toolbar */}
          <div style={{
            background: C.adminCard,
            border: `1px solid ${C.adminBorder}`,
            borderBottom: "none",
            borderRadius: "4px 4px 0 0",
            padding: "6px 10px",
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}>
            {TOOLBAR_BTNS.map((btn) => (
              <span key={btn} style={{
                fontFamily: jetbrainsMono, fontSize: 11, color: C.adminMuted,
                padding: "2px 5px", borderRadius: 2,
              }}>
                {btn}
              </span>
            ))}
          </div>

          {/* Split editor */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            height: 210,
            border: `1px solid ${C.adminBorder}`,
            borderRadius: "0 0 4px 4px",
            overflow: "hidden",
          }}>
            {/* Left: markdown source with typing animation */}
            <div style={{
              background: "#111318",
              borderRight: `1px solid ${C.adminBorder}`,
              padding: 14,
              fontFamily: jetbrainsMono,
              fontSize: 12,
              lineHeight: 1.7,
              overflow: "hidden",
            }}>
              {MARKDOWN_LINES.slice(0, lineCount).map(({ text, color }, i) => (
                <div key={i} style={{ color: color || C.adminMuted, whiteSpace: "pre" }}>
                  {text}
                </div>
              ))}
              {/* Blinking cursor */}
              <span style={{
                background: C.adminCyan,
                width: 7,
                height: 14,
                display: "inline-block",
                opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0,
                verticalAlign: "middle",
              }} />
            </div>

            {/* Right: rendered preview */}
            <div style={{ background: C.adminCard, padding: 14, overflow: "hidden" }}>
              <h2 style={{
                fontFamily: newsreader, fontSize: 17, color: C.adminText,
                margin: "0 0 10px", fontWeight: 600,
              }}>
                Introduction
              </h2>
              <p style={{
                fontFamily: interTight, fontSize: 12, color: C.adminMuted,
                lineHeight: 1.6, margin: "0 0 10px",
              }}>
                Particle filter SLAM represents the robot's belief as a set of weighted particles.
              </p>
              <h3 style={{
                fontFamily: newsreader, fontSize: 14, color: C.adminText, margin: "0 0 8px",
              }}>
                Prediction Step
              </h3>
              <div style={{
                background: C.adminBg, borderRadius: 4, padding: "10px 14px",
                fontFamily: jetbrainsMono, fontSize: 11, color: "#c4b5fd", lineHeight: 1.7,
              }}>
                <div>{"void predict(Particle& p) {"}</div>
                <div>{"  p.theta += w * dt;"}</div>
                <div>{"  p.x += v * cos(p.theta);"}</div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Callout annotations */}
      <Callout frame={frame} label="Title + 💡 Suggest topics (AI)" x={248} y={175} from={50} to={180} />
      <Callout frame={frame} label="🦆 Generate draft with AI" x={248} y={465} from={130} to={260} />
      <Callout frame={frame} label="Left: Markdown source · Right: live preview" x={248} y={510} from={200} to={330} />
      <Callout frame={frame} label="Blinking cursor · typing animation" x={248} y={560} from={280} to={352} />

      {/* Feature bar */}
      <FeatureBar
        label="Admin Panel — Blog Editor"
        sub="Split Markdown editor · 💡 AI topic suggester · 🦆 AI draft generator · live preview"
        frame={frame}
        DURATION={DURATION}
      />

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
