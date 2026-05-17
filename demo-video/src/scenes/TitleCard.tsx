import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn, fadeOut } from "../utils";
import { C } from "../design";
import { newsreader, interTight, jetbrainsMono } from "../Root";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = fadeIn(frame, 0, 25);
  const subtitleOpacity = fadeIn(frame, 18, 20);
  const iconsOpacity = fadeIn(frame, 30, 15);
  const globalFadeOut = fadeOut(frame, 70, 20);
  const opacity = Math.min(titleOpacity, 1) * (1 - globalFadeOut);

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: C.paper,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative top rule */}
      <div style={{
        position: "absolute", top: 80, left: "50%",
        transform: "translateX(-50%)",
        width: 400, height: 1,
        background: C.hairline,
        opacity,
      }} />

      {/* Main title */}
      <div style={{ opacity, textAlign: "center" }}>
        <div style={{
          fontFamily: jetbrainsMono,
          fontSize: 11,
          color: C.accent,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 20,
          opacity: subtitleOpacity,
        }}>
          A.C.N. · 2026 · Vol. III
        </div>

        <div style={{
          fontSize: 68,
          fontWeight: 500,
          fontFamily: newsreader,
          color: C.ink,
          letterSpacing: "-0.025em",
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          Portfolio Platform
        </div>

        {/* Accent rule */}
        <div style={{
          width: 56,
          height: 2,
          background: C.accent,
          margin: "0 auto 24px",
          opacity: subtitleOpacity,
        }} />

        {/* Subtitle */}
        <div style={{
          fontSize: 18,
          color: C.inkSoft,
          fontFamily: newsreader,
          fontStyle: "italic",
          fontWeight: 400,
          opacity: subtitleOpacity,
          letterSpacing: "0.01em",
        }}>
          Full-stack portfolio · Admin panel · AI agents
        </div>

        {/* Feature pills */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          marginTop: 40,
          opacity: iconsOpacity,
        }}>
          <FeaturePill label="Public Portfolio" />
          <FeaturePill label="Admin Panel" />
          <FeaturePill label="7 AI Agents" />
        </div>

        {/* Stack pills */}
        <div style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginTop: 28,
          opacity: iconsOpacity,
        }}>
          {["Next.js 14", "TypeScript", "PostgreSQL", "Auth.js"].map((t) => (
            <span key={t} style={{
              padding: "4px 12px",
              border: `1px solid ${C.hairline}`,
              borderRadius: 3,
              fontSize: 12,
              color: C.inkSoft,
              fontFamily: jetbrainsMono,
              background: C.accentSoft,
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Decorative bottom rule */}
      <div style={{
        position: "absolute", bottom: 80, left: "50%",
        transform: "translateX(-50%)",
        width: 400, height: 1,
        background: C.hairline,
        opacity,
      }} />

      {/* Corner date stamp */}
      <div style={{
        position: "absolute", bottom: 40, right: 60,
        fontSize: 11,
        color: C.inkFaint,
        fontFamily: jetbrainsMono,
        opacity: iconsOpacity * (1 - globalFadeOut),
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        2026
      </div>
    </div>
  );
};

function FeaturePill({ label }: { label: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 18px",
      background: C.accentSoft,
      borderRadius: 4,
      border: `1px solid ${C.hairline}`,
    }}>
      <span style={{
        fontSize: 13,
        color: C.ink,
        fontFamily: interTight,
        fontWeight: 500,
      }}>
        {label}
      </span>
    </div>
  );
}
