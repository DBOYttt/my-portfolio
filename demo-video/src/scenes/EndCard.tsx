import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, fadeOut } from "../utils";
import { C } from "../design";
import { newsreader, interTight, jetbrainsMono } from "../Root";

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
    <div style={{
      width: "100%",
      height: "100%",
      background: C.paper,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: overallOpacity,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top rule */}
      <div style={{
        position: "absolute", top: 80, left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 1, background: C.hairline,
      }} />

      {/* Main content */}
      <div style={{ textAlign: "center", opacity: titleOpacity }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 11,
          fontFamily: jetbrainsMono,
          color: C.accent,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          marginBottom: 16,
        }}>
          OPEN SOURCE
        </div>

        {/* Title */}
        <div style={{
          fontSize: 60,
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
          width: 56, height: 2, background: C.accent,
          margin: "0 auto 24px",
        }} />

        {/* GitHub URL */}
        <div style={{
          fontSize: 14,
          fontFamily: jetbrainsMono,
          color: C.inkSoft,
          opacity: detailsOpacity,
          marginBottom: 10,
          letterSpacing: "0.02em",
        }}>
          github.com/DBOYttt/my-portfolio
        </div>

        {/* Live URL */}
        <div style={{
          fontSize: 20,
          color: C.accent,
          fontFamily: newsreader,
          fontStyle: "italic",
          opacity: detailsOpacity,
          marginBottom: 32,
          borderBottom: `1px solid ${C.accent}`,
          paddingBottom: 2,
          display: "inline-block",
        }}>
          diboy.dev
        </div>

        {/* Badges row */}
        <div style={{
          display: "flex",
          gap: 12,
          justifyContent: "center",
          marginBottom: 36,
          opacity: badgesOpacity,
        }}>
          {[
            { label: "MIT License",  color: C.ink },
            { label: "Next.js 14",   color: C.ink },
            { label: "TypeScript",   color: C.ink },
            { label: "Open Source",  color: C.accent },
          ].map(({ label, color }) => (
            <span key={label} style={{
              padding: "5px 14px",
              border: `1px solid ${C.hairline}`,
              borderRadius: 3,
              fontSize: 12,
              color,
              fontFamily: jetbrainsMono,
              background: C.accentSoft,
            }}>
              {label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          opacity: ctaOpacity,
        }}>
          <div style={{
            padding: "12px 28px",
            border: `1.5px solid ${C.accent}`,
            borderRadius: 4,
            background: C.accent,
            color: C.paper,
            fontSize: 14,
            fontFamily: interTight,
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}>
            Star on GitHub
          </div>
          <div style={{
            padding: "12px 28px",
            border: `1.5px solid ${C.hairline}`,
            borderRadius: 4,
            background: "transparent",
            color: C.inkSoft,
            fontSize: 14,
            fontFamily: jetbrainsMono,
            fontWeight: 400,
            letterSpacing: "0.04em",
          }}>
            /setup-portfolio
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div style={{
        position: "absolute", bottom: 80, left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 1, background: C.hairline,
      }} />

      {/* Footer */}
      <div style={{
        position: "absolute", bottom: 40,
        display: "flex", gap: 32,
        opacity: ctaOpacity,
      }}>
        {["Fork it", "Fill it", "Deploy it"].map((step, i) => (
          <span key={i} style={{
            fontSize: 11,
            color: C.inkFaint,
            fontFamily: jetbrainsMono,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            {`0${i + 1}. ${step}`}
          </span>
        ))}
      </div>
    </div>
  );
};
