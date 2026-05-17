import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn, fadeOut } from "../utils";

export const AdminTransition: React.FC = () => {
  const frame = useCurrentFrame();

  const bgOpacity = fadeIn(frame, 0, 20);
  const iconScale = interpolate(frame, [15, 35], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const iconOpacity = fadeIn(frame, 15, 20);
  const textOpacity = fadeIn(frame, 25, 18);
  const subOpacity = fadeIn(frame, 33, 15);
  const pillOpacity = fadeIn(frame, 40, 15);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: `rgba(15,17,23,${bgOpacity})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          opacity: bgOpacity,
        }}
      />

      {/* Lock icon */}
      <div
        style={{
          fontSize: 52,
          marginBottom: 24,
          opacity: iconOpacity,
          transform: `scale(${iconScale})`,
          filter: "drop-shadow(0 0 20px rgba(6,182,212,0.4))",
        }}
      >
        🔒
      </div>

      {/* "Admin Panel" title */}
      <div
        style={{
          fontSize: 52,
          fontWeight: 700,
          color: "#e2e8f0",
          letterSpacing: "-1px",
          opacity: textOpacity,
          marginBottom: 12,
        }}
      >
        Admin Panel
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 16,
          color: "#94a3b8",
          opacity: subOpacity,
          marginBottom: 32,
          letterSpacing: "0.3px",
        }}
      >
        Powered by Auth.js v5
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          gap: 12,
          opacity: pillOpacity,
        }}
      >
        {[
          "Content CRUD",
          "Markdown Editor",
          "AI Agents",
          "CV Pipeline",
        ].map((feat) => (
          <span
            key={feat}
            style={{
              padding: "6px 14px",
              border: "1px solid rgba(6,182,212,0.3)",
              borderRadius: 4,
              fontSize: 12,
              color: "#06b6d4",
              background: "rgba(6,182,212,0.08)",
              letterSpacing: "0.3px",
            }}
          >
            {feat}
          </span>
        ))}
      </div>

      {/* Corner accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle at 0 0, rgba(6,182,212,0.06), transparent)",
          opacity: bgOpacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle at 100% 100%, rgba(6,182,212,0.06), transparent)",
          opacity: bgOpacity,
        }}
      />
    </div>
  );
};
