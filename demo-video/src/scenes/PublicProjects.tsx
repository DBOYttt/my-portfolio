import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn, stagger } from "../utils";

const PAPER = "#f5f0e8";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";
const INK_FAINT = "#a89a8f";
const HAIRLINE = "rgba(44,38,33,0.15)";

const PROJECTS = [
  {
    title: "Portfolio Platform",
    description:
      "Self-hosted full-stack portfolio with admin panel, 7 AI agents, and a CV pipeline. Built to get hired.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Auth.js"],
    status: "Live",
    statusColor: "#16a34a",
  },
  {
    title: "ROS2 Nav Stack",
    description:
      "Autonomous mobile robot navigation using ROS2, Nav2, and a custom SLAM implementation for indoor mapping.",
    stack: ["ROS2", "Python", "C++", "Nav2"],
    status: "In Progress",
    statusColor: "#b45309",
  },
  {
    title: "MCP Server",
    description:
      "Model Context Protocol server exposing 14 tools and 9 resources over stdio + HTTP/SSE transports.",
    stack: ["Node.js", "TypeScript", "MCP"],
    status: "Live",
    statusColor: "#16a34a",
  },
];

export const PublicProjects: React.FC = () => {
  const frame = useCurrentFrame();

  const navOpacity = fadeIn(frame, 0, 15);
  const headerOpacity = fadeIn(frame, 5, 20);
  const footerOpacity = fadeIn(frame, 80, 20);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PAPER,
        fontFamily: "Georgia, serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 60px",
          borderBottom: `1px solid ${HAIRLINE}`,
          opacity: navOpacity,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: "bold", color: INK }}>
          Portfolio
        </div>
        <div
          style={{
            display: "flex",
            gap: 36,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: INK_SOFT,
          }}
        >
          {["About", "Projects", "Blog", "Contact"].map((item) => (
            <span
              key={item}
              style={{
                color: item === "Projects" ? ACCENT : INK_SOFT,
                borderBottom:
                  item === "Projects" ? `1px solid ${ACCENT}` : "none",
                paddingBottom: 2,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div style={{ width: 80 }} />
      </nav>

      {/* Section header */}
      <div
        style={{
          padding: "28px 60px 0",
          opacity: headerOpacity,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: ACCENT,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          §03
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: INK,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Projects
          </h2>
          <div style={{ flex: 1, height: 1, background: HAIRLINE }} />
        </div>
      </div>

      {/* Project cards */}
      <div
        style={{
          display: "flex",
          gap: 20,
          padding: "24px 60px",
          flex: 1,
          alignItems: "stretch",
        }}
      >
        {PROJECTS.map((project, i) => {
          const cardOpacity = stagger(i, frame, 20, 20, 25);
          const cardX = interpolate(
            frame,
            [20 + i * 20, 45 + i * 20],
            [30, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return (
            <ProjectCard
              key={i}
              {...project}
              opacity={cardOpacity}
              translateX={cardX}
            />
          );
        })}
      </div>

      {/* Footer link */}
      <div
        style={{
          padding: "0 60px 28px",
          display: "flex",
          justifyContent: "flex-end",
          opacity: footerOpacity,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: ACCENT,
            fontStyle: "italic",
            fontFamily: "Georgia, serif",
            borderBottom: `1px solid ${ACCENT}`,
            paddingBottom: 1,
          }}
        >
          Full portfolio →
        </span>
      </div>
    </div>
  );
};

function ProjectCard({
  title,
  description,
  stack,
  status,
  statusColor,
  opacity,
  translateX,
}: {
  title: string;
  description: string;
  stack: string[];
  status: string;
  statusColor: string;
  opacity: number;
  translateX: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(44,38,33,0.04)",
        border: "1px solid rgba(44,38,33,0.12)",
        borderRadius: 6,
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* Status badge */}
      <div style={{ marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: statusColor,
            background: `${statusColor}18`,
            padding: "3px 8px",
            borderRadius: 3,
            letterSpacing: "0.5px",
            border: `1px solid ${statusColor}40`,
          }}
        >
          {status}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: "#2c2621",
          marginBottom: 10,
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: 14,
          color: "#6b5e54",
          lineHeight: 1.7,
          margin: "0 0 auto 0",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {description}
      </p>

      {/* Tech pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          marginTop: 20,
        }}
      >
        {stack.map((tech) => (
          <span
            key={tech}
            style={{
              fontSize: 11,
              fontFamily: "'Courier New', monospace",
              color: "#6b5e54",
              padding: "2px 8px",
              border: "1px solid rgba(44,38,33,0.15)",
              borderRadius: 2,
              background: "rgba(44,38,33,0.03)",
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Read more */}
      <div
        style={{
          marginTop: 16,
          fontSize: 13,
          color: "#c17d3c",
          fontStyle: "italic",
        }}
      >
        Case study →
      </div>
    </div>
  );
}
