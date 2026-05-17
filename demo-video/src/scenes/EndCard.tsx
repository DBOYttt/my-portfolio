import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn, fadeOut, stagger } from "../utils";

const PAPER = "#f5f0e8";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";
const INK_FAINT = "#a89a8f";
const HAIRLINE = "rgba(44,38,33,0.15)";

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();

  const bgOpacity = fadeIn(frame, 0, 25);
  const titleOpacity = fadeIn(frame, 15, 20);
  const detailsOpacity = fadeIn(frame, 30, 20);
  const badgesOpacity = fadeIn(frame, 50, 20);
  const ctaOpacity = fadeIn(frame, 65, 20);
  const finalFade = fadeOut(frame, 110, 20);

  const overallOpacity = bgOpacity * (1 - finalFade);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PAPER,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
        opacity: overallOpacity,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top rule */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 1,
          background: HAIRLINE,
        }}
      />

      {/* Main content */}
      <div style={{ textAlign: "center", opacity: titleOpacity }}>
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: ACCENT,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          OPEN SOURCE
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 60,
            fontWeight: "bold",
            color: INK,
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Portfolio Platform
        </div>

        {/* Accent rule */}
        <div
          style={{
            width: 60,
            height: 3,
            background: ACCENT,
            margin: "0 auto 24px",
          }}
        />

        {/* GitHub URL */}
        <div
          style={{
            fontSize: 16,
            fontFamily: "'Courier New', monospace",
            color: INK_SOFT,
            opacity: detailsOpacity,
            marginBottom: 10,
            letterSpacing: "0.5px",
          }}
        >
          github.com/DBOYttt/my-portfolio
        </div>

        {/* Live URL */}
        <div
          style={{
            fontSize: 20,
            color: ACCENT,
            fontStyle: "italic",
            opacity: detailsOpacity,
            marginBottom: 32,
            borderBottom: `1px solid ${ACCENT}`,
            paddingBottom: 2,
            display: "inline-block",
          }}
        >
          diboy.dev
        </div>

        {/* Badges row */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            marginBottom: 36,
            opacity: badgesOpacity,
          }}
        >
          {[
            { label: "MIT License", color: "#2c2621" },
            { label: "Next.js 14", color: "#2c2621" },
            { label: "TypeScript", color: "#2c2621" },
            { label: "Open Source", color: "#c17d3c" },
          ].map(({ label, color }) => (
            <span
              key={label}
              style={{
                padding: "5px 14px",
                border: `1px solid rgba(44,38,33,0.2)`,
                borderRadius: 3,
                fontSize: 12,
                color,
                fontFamily: "'Courier New', monospace",
                background: "rgba(44,38,33,0.04)",
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            opacity: ctaOpacity,
          }}
        >
          <button
            style={{
              padding: "13px 28px",
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 4,
              background: ACCENT,
              color: "#fff",
              fontSize: 15,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: "0.3px",
            }}
          >
            ⭐ Star on GitHub
          </button>
          <button
            style={{
              padding: "13px 28px",
              border: `1.5px solid rgba(44,38,33,0.2)`,
              borderRadius: 4,
              background: "transparent",
              color: INK_SOFT,
              fontSize: 15,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              cursor: "pointer",
            }}
          >
            /setup-portfolio
          </button>
        </div>
      </div>

      {/* Bottom rule */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 1,
          background: HAIRLINE,
        }}
      />

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          gap: 32,
          opacity: ctaOpacity,
        }}
      >
        {["Fork it", "Fill it", "Deploy it"].map((step, i) => (
          <span
            key={i}
            style={{
              fontSize: 12,
              color: INK_FAINT,
              fontFamily: "'Courier New', monospace",
              letterSpacing: "1px",
            }}
          >
            {`0${i + 1}. ${step}`}
          </span>
        ))}
      </div>
    </div>
  );
};
