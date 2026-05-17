import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, slideUp } from "../utils";

const PAPER = "#f5f0e8";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";
const INK_FAINT = "#a89a8f";
const HAIRLINE = "rgba(44,38,33,0.15)";

export const PublicHero: React.FC = () => {
  const frame = useCurrentFrame();

  const navOpacity = fadeIn(frame, 0, 20);
  const heroOpacity = fadeIn(frame, 15, 25);
  const heroY = slideUp(frame, 15, 30, 30);
  const ctaOpacity = fadeIn(frame, 35, 20);
  const rulerOpacity = fadeIn(frame, 10, 20);

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
      {/* Nav bar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 60px",
          borderBottom: `1px solid ${HAIRLINE}`,
          opacity: navOpacity,
          background: PAPER,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: INK,
            letterSpacing: "-0.5px",
          }}
        >
          Portfolio
        </div>
        <div
          style={{
            display: "flex",
            gap: 36,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: INK_SOFT,
            letterSpacing: "0.5px",
          }}
        >
          {["About", "Projects", "Blog", "Contact"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div
          style={{
            fontSize: 12,
            fontFamily: "'Courier New', monospace",
            color: INK_FAINT,
            letterSpacing: "1px",
          }}
        >
          [dark mode]
        </div>
      </nav>

      {/* Hero content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 60px 0 120px",
          opacity: heroOpacity,
          transform: `translateY(${heroY}px)`,
        }}
      >
        {/* Margin label */}
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: ACCENT,
            letterSpacing: "2px",
            marginBottom: 20,
            textTransform: "uppercase",
          }}
        >
          INTRO
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontSize: 58,
            fontWeight: "bold",
            color: INK,
            lineHeight: 1.15,
            margin: "0 0 20px 0",
            maxWidth: 680,
            letterSpacing: "-1px",
          }}
        >
          Software Engineer
          <br />
          <span style={{ fontStyle: "italic", color: INK_SOFT }}>
            & Robotics Enthusiast
          </span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 18,
            color: INK_SOFT,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            margin: "0 0 36px 0",
            maxWidth: 520,
            lineHeight: 1.6,
          }}
        >
          Building full-stack systems and autonomous robots. Open to
          engineering roles where software meets the physical world.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex",
            gap: 16,
            opacity: ctaOpacity,
          }}
        >
          <button
            style={{
              padding: "12px 28px",
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 4,
              background: "transparent",
              color: ACCENT,
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            View Projects
          </button>
          <button
            style={{
              padding: "12px 28px",
              border: `1.5px solid ${HAIRLINE}`,
              borderRadius: 4,
              background: "transparent",
              color: INK_SOFT,
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              cursor: "pointer",
            }}
          >
            Read Blog
          </button>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            marginTop: 48,
            fontSize: 11,
            color: INK_FAINT,
            fontFamily: "'Courier New', monospace",
            letterSpacing: "1.5px",
            opacity: ctaOpacity,
          }}
        >
          ↓ scroll to explore
        </div>
      </div>

      {/* Bottom rule */}
      <div
        style={{
          height: 1,
          background: HAIRLINE,
          opacity: rulerOpacity,
          margin: "0 60px",
        }}
      />
      <div
        style={{
          padding: "14px 60px",
          display: "flex",
          gap: 24,
          opacity: rulerOpacity * ctaOpacity,
        }}
      >
        {["github.com/DBOYttt", "diboy.dev", "Open to work"].map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              color: INK_FAINT,
              fontFamily: "'Courier New', monospace",
              letterSpacing: "0.5px",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};
