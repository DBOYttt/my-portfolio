import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger } from "../utils";
import { C, F } from "../design";
import { OWNER, SKILLS } from "../data";
import { newsreader, interTight, jetbrainsMono } from "../Root";

const DURATION = 270;

const NAV_LINKS = ["01 ABOUT", "02 STACK", "03 PROJECTS", "04 ROBOTICS", "05 EXPERIENCE", "06 WRITING", "07 CONTACT"];

function NavBar() {
  return (
    <div style={{
      height: 52,
      background: C.paper,
      borderBottom: `1px solid ${C.hairline}`,
      display: "flex",
      alignItems: "center",
      padding: "0 48px",
      justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: newsreader, fontSize: 17, color: C.ink, letterSpacing: "-0.01em" }}>
          The Logbook
        </span>
        <span style={{
          fontFamily: jetbrainsMono, fontSize: 10, color: C.accent,
          border: `1px solid ${C.accent}`, padding: "2px 6px", borderRadius: 2,
          transform: "rotate(-2deg)", letterSpacing: "0.04em", display: "inline-block",
        }}>
          A.C.N. · 2026
        </span>
      </div>
      <div style={{ display: "flex", gap: 24 }}>
        {NAV_LINKS.map((l) => (
          <span key={l} style={{
            fontFamily: jetbrainsMono, fontSize: 10,
            color: l.startsWith("01") ? C.accent : C.inkSoft,
            letterSpacing: "0.06em", textTransform: "uppercase",
            borderBottom: l.startsWith("01") ? `1px solid ${C.accent}` : "none",
            paddingBottom: 2,
          }}>
            {l}
          </span>
        ))}
      </div>
      <span style={{
        fontFamily: jetbrainsMono, fontSize: 11, color: C.inkSoft,
        border: `1px solid ${C.hairline}`, padding: "4px 10px", letterSpacing: "0.04em",
      }}>
        ← DARK
      </span>
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
        background: "oklch(58% 0.13 45)",
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

export const PublicAbout: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = fadeIn(frame, 8, 20);
  const globalFadeIn = fadeOut(frame, 0, 20);
  const globalFadeOut = fadeIn(frame, DURATION - 20, 20);

  const BIO_PARAS = [
    "I'm a software engineer with a solid foundation in designing, programming, and testing applications. I enjoy working at the intersection of software and hardware.",
    "My background spans Python, C++ and C#, with hands-on experience in .NET, Next.js, PostgreSQL, and Linux. I automate workflows with n8n and AI agents.",
    "Outside of engineering I'm interested in machine learning and automation, and I explore the impact of emerging technology on everyday life.",
  ];

  return (
    <AbsoluteFill style={{ background: C.paper, display: "flex", flexDirection: "column" }}>
      <NavBar />

      <div style={{
        maxWidth: 1240,
        width: "100%",
        margin: "0 auto",
        padding: "48px 48px 0",
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 56,
        flex: 1,
      }}>
        {/* Left marginalia */}
        <div style={{
          fontFamily: jetbrainsMono, fontSize: 11, color: C.inkFaint,
          textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.7,
        }}>
          <div style={{ color: C.accent, fontSize: 13 }}>§ 01</div>
          <div>ABOUT</div>
        </div>

        {/* Right content */}
        <div>
          <h2 style={{
            fontFamily: newsreader,
            fontSize: 42,
            fontWeight: 500,
            color: C.ink,
            margin: "0 0 24px",
            letterSpacing: "-0.02em",
            opacity: titleOpacity,
          }}>
            About <em style={{ color: C.inkSoft }}>me</em>
          </h2>

          {/* Bio paragraphs */}
          {BIO_PARAS.map((text, i) => (
            <p key={i} style={{
              fontFamily: newsreader,
              fontSize: 16,
              lineHeight: 1.65,
              color: C.inkSoft,
              margin: "0 0 16px",
              opacity: stagger(i, frame, 30, 20, 25),
            }}>
              {text}
            </p>
          ))}

          {/* Skills grid */}
          <div style={{ marginTop: 32 }}>
            <div style={{
              fontFamily: jetbrainsMono, fontSize: 9, color: C.inkFaint,
              letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16,
              opacity: stagger(0, frame, 110, 0, 20),
            }}>
              TECHNICAL STACK
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px 32px",
              opacity: stagger(0, frame, 120, 0, 25),
            }}>
              {SKILLS.map(({ category, skills }) => (
                <div key={category}>
                  <div style={{
                    fontFamily: jetbrainsMono, fontSize: 9, color: C.inkFaint,
                    letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6,
                  }}>
                    {category}
                  </div>
                  <div style={{
                    fontFamily: jetbrainsMono, fontSize: 12, color: C.inkSoft,
                    letterSpacing: "0.01em",
                  }}>
                    {skills.join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature bar */}
      <FeatureBar
        label="§01 About"
        sub="Bio · tech background · multi-category skills"
        frame={frame}
        DURATION={DURATION}
      />

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
