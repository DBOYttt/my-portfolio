import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn } from "../utils";
import { C } from "../design";
import { interTight, jetbrainsMono } from "../Root";

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
    <div style={{
      width: "100%",
      height: "100%",
      background: `rgba(15,17,23,${bgOpacity})`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: interTight,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        opacity: bgOpacity,
      }} />

      {/* Lock icon */}
      <div style={{
        fontSize: 52,
        marginBottom: 24,
        opacity: iconOpacity,
        transform: `scale(${iconScale})`,
        filter: "drop-shadow(0 0 20px rgba(6,182,212,0.4))",
      }}>
        {/* SVG lock */}
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={C.adminCyan} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      {/* "Admin Panel" title */}
      <div style={{
        fontSize: 52,
        fontWeight: 700,
        fontFamily: interTight,
        color: C.adminText,
        letterSpacing: "-0.02em",
        opacity: textOpacity,
        marginBottom: 12,
      }}>
        Admin Panel
      </div>

      {/* Subtitle */}
      <div style={{
        fontSize: 16,
        fontFamily: jetbrainsMono,
        color: C.adminMuted,
        opacity: subOpacity,
        marginBottom: 32,
        letterSpacing: "0.02em",
      }}>
        Powered by Auth.js v5
      </div>

      {/* Feature pills */}
      <div style={{
        display: "flex",
        gap: 12,
        opacity: pillOpacity,
      }}>
        {["Content CRUD", "Markdown Editor", "AI Agents", "CV Pipeline"].map((feat) => (
          <span key={feat} style={{
            padding: "6px 14px",
            border: `1px solid rgba(6,182,212,0.3)`,
            borderRadius: 4,
            fontSize: 12,
            fontFamily: jetbrainsMono,
            color: C.adminCyan,
            background: "rgba(6,182,212,0.08)",
            letterSpacing: "0.04em",
          }}>
            {feat}
          </span>
        ))}
      </div>

      {/* Corner accents */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 200, height: 200,
        background: "radial-gradient(circle at 0 0, rgba(6,182,212,0.06), transparent)",
        opacity: bgOpacity,
      }} />
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 200, height: 200,
        background: "radial-gradient(circle at 100% 100%, rgba(6,182,212,0.06), transparent)",
        opacity: bgOpacity,
      }} />
    </div>
  );
};
