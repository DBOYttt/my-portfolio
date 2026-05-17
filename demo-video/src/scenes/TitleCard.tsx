import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, fadeOut } from "../utils";

const PAPER = "#f5f0e8";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = fadeIn(frame, 0, 25);
  const subtitleOpacity = fadeIn(frame, 18, 20);
  const iconsOpacity = fadeIn(frame, 30, 15);
  const globalFadeOut = fadeOut(frame, 52, 18);
  const opacity = Math.min(titleOpacity, 1) * (1 - globalFadeOut);

  const bgColor = `rgba(245,240,232,${interpolateBg(frame)})`;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bgColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative top rule */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 1,
          background: `rgba(44,38,33,${0.15 * opacity})`,
        }}
      />

      {/* Main title */}
      <div style={{ opacity, textAlign: "center" }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: INK,
            letterSpacing: "-1px",
            lineHeight: 1.1,
            marginBottom: 20,
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
            margin: "0 auto 28px",
            opacity: subtitleOpacity,
          }}
        />

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: INK_SOFT,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            opacity: subtitleOpacity,
            letterSpacing: "0.3px",
          }}
        >
          Full-stack portfolio · Admin panel · AI agents
        </div>

        {/* Icon row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            marginTop: 40,
            opacity: iconsOpacity,
          }}
        >
          <FeaturePill icon="🌐" label="Public Portfolio" />
          <FeaturePill icon="🔒" label="Admin Panel" />
          <FeaturePill icon="🤖" label="7 AI Agents" />
        </div>

        {/* Stack pills */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            marginTop: 32,
            opacity: iconsOpacity,
          }}
        >
          {["Next.js 14", "TypeScript", "PostgreSQL", "Auth.js"].map((t) => (
            <span
              key={t}
              style={{
                padding: "4px 12px",
                border: `1px solid rgba(44,38,33,0.2)`,
                borderRadius: 3,
                fontSize: 13,
                color: INK_SOFT,
                fontFamily: "'Courier New', monospace",
                background: "rgba(44,38,33,0.04)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Decorative bottom rule */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 1,
          background: `rgba(44,38,33,${0.15 * opacity})`,
        }}
      />

      {/* Corner date stamp */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          fontSize: 11,
          color: INK_SOFT,
          fontFamily: "'Courier New', monospace",
          opacity: iconsOpacity * (1 - globalFadeOut),
          letterSpacing: "1px",
        }}
      >
        2026
      </div>
    </div>
  );
};

function FeaturePill({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        background: "rgba(44,38,33,0.06)",
        borderRadius: 4,
        border: "1px solid rgba(44,38,33,0.12)",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span
        style={{
          fontSize: 14,
          color: INK,
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function interpolateBg(frame: number): number {
  // Start white, animate to paper color
  if (frame < 15) return 1;
  return 1;
}
