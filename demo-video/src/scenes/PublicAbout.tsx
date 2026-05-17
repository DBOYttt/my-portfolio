import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, stagger } from "../utils";

const PAPER = "#f5f0e8";
const PAPER2 = "#ede8df";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";
const INK_FAINT = "#a89a8f";
const HAIRLINE = "rgba(44,38,33,0.15)";

const SKILLS = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Prisma",
  "Docker",
  "ROS2",
  "Tailwind CSS",
  "Auth.js",
  "Vitest",
];

export const PublicAbout: React.FC = () => {
  const frame = useCurrentFrame();

  const headerOpacity = fadeIn(frame, 0, 20);
  const bioOpacity = fadeIn(frame, 12, 25);
  const skillsHeaderOpacity = fadeIn(frame, 45, 20);

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
      {/* Minimal nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 60px",
          borderBottom: `1px solid ${HAIRLINE}`,
          opacity: headerOpacity,
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
                color: item === "About" ? ACCENT : INK_SOFT,
                borderBottom: item === "About" ? `1px solid ${ACCENT}` : "none",
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
          padding: "32px 60px 0",
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
          §01
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <h2
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: INK,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            About
          </h2>
          <div
            style={{ flex: 1, height: 1, background: HAIRLINE }}
          />
        </div>
      </div>

      {/* Logbook row — two column */}
      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "28px 60px",
          gap: 0,
          opacity: bioOpacity,
        }}
      >
        {/* Left margin */}
        <div
          style={{
            width: 120,
            flexShrink: 0,
            paddingTop: 4,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontFamily: "'Courier New', monospace",
              color: INK_FAINT,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              lineHeight: 1.8,
            }}
          >
            ABOUT
            <br />
            ME
          </div>
        </div>

        {/* Right body */}
        <div style={{ flex: 1, borderLeft: `1px solid ${HAIRLINE}`, paddingLeft: 40 }}>
          <p
            style={{
              fontSize: 16,
              color: INK,
              lineHeight: 1.8,
              margin: "0 0 14px 0",
              maxWidth: 620,
            }}
          >
            I build full-stack web systems and autonomous robots. My work sits at
            the intersection of software and the physical world — from REST APIs
            and React UIs to ROS2 navigation stacks and embedded control loops.
          </p>
          <p
            style={{
              fontSize: 16,
              color: INK_SOFT,
              lineHeight: 1.8,
              margin: "0 0 24px 0",
              maxWidth: 620,
            }}
          >
            Currently building this portfolio platform to demonstrate what I can
            ship end-to-end. Open to software engineering roles — especially
            teams working on robotics, tooling, or developer infrastructure.
          </p>

          {/* Skills section */}
          <div style={{ opacity: skillsHeaderOpacity }}>
            <div
              style={{
                fontSize: 10,
                fontFamily: "'Courier New', monospace",
                color: INK_FAINT,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              SKILLS &amp; TOOLS
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {SKILLS.map((skill, i) => (
                <SkillPill
                  key={skill}
                  label={skill}
                  opacity={stagger(i, frame, 55, 6, 12)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SkillPill({ label, opacity }: { label: string; opacity: number }) {
  return (
    <span
      style={{
        padding: "5px 12px",
        border: "1px solid rgba(44,38,33,0.18)",
        borderRadius: 3,
        fontSize: 12,
        color: "#2c2621",
        fontFamily: "'Courier New', monospace",
        background: "rgba(44,38,33,0.04)",
        opacity,
        letterSpacing: "0.3px",
      }}
    >
      {label}
    </span>
  );
}
