import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut } from "../utils";
import { C, F } from "../design";
import { OWNER } from "../data";
import { newsreader, interTight, jetbrainsMono } from "../Root";

const DURATION = 300;

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
      {/* Left: brand */}
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
      {/* Center: nav links */}
      <div style={{ display: "flex", gap: 24 }}>
        {NAV_LINKS.map((l) => (
          <span key={l} style={{
            fontFamily: jetbrainsMono, fontSize: 10, color: C.inkSoft,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {l}
          </span>
        ))}
      </div>
      {/* Right: theme toggle */}
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

function Callout({ label, x, y, from, to, frame }: {
  label: string; x: number; y: number; from: number; to: number; frame: number;
}) {
  const opacity = interpolate(
    frame, [from, from + 12, to - 8, to], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div style={{
      position: "absolute", left: x, top: y, opacity,
      pointerEvents: "none", zIndex: 15,
    }}>
      <div style={{
        background: "rgba(12,12,20,0.85)", backdropFilter: "blur(6px)",
        border: "1px solid rgba(255,255,255,0.20)", borderRadius: 5,
        padding: "5px 12px", fontSize: 12, color: "#fff", fontWeight: 500,
        fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap",
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}>
        {label}
      </div>
    </div>
  );
}

export const PublicHero: React.FC = () => {
  const frame = useCurrentFrame();

  const nameOpacity = fadeIn(frame, 20, 35);
  const slideY = interpolate(frame, [20, 55], [30, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const tagOpacity = fadeIn(frame, 50, 30);
  const ctaOpacity = fadeIn(frame, 75, 25);
  const statsOpacity = fadeIn(frame, 95, 25);

  const globalFadeIn = fadeOut(frame, 0, 20);    // black overlay fades out on open
  const globalFadeOut = fadeIn(frame, DURATION - 20, 20);  // black overlay fades in on close

  return (
    <AbsoluteFill style={{ background: C.paper, display: "flex", flexDirection: "column" }}>
      <NavBar />

      {/* Main two-column layout */}
      <div style={{
        maxWidth: 1240,
        width: "100%",
        margin: "0 auto",
        padding: "32px 48px 0",
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 56,
        flex: 1,
      }}>
        {/* Left marginalia */}
        <div style={{
          fontFamily: jetbrainsMono, fontSize: 11, color: C.inkFaint,
          letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.6,
          paddingTop: 4,
        }}>
          <div style={{ color: C.accent, fontSize: 13 }}>§ 00</div>
          <div>COVER</div>
          <div>Vol. III · 2026 ed.</div>
          <div style={{ marginTop: 4 }}>{OWNER.location}</div>
          <div style={{ marginTop: 16, fontFamily: newsreader, fontStyle: "italic", fontSize: 13, color: C.inkFaint, textTransform: "none" }}>
            "start here"
          </div>
        </div>

        {/* Right: hero content */}
        <div>
          {/* Status line */}
          <div style={{
            display: "flex", gap: 16, alignItems: "center", marginBottom: 16,
            fontFamily: jetbrainsMono, fontSize: 11, color: C.inkFaint,
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: C.accent,
              display: "inline-block", flexShrink: 0,
            }} />
            <span>OPEN TO OPPORTUNITIES — SPRING 2026</span>
            <span style={{ color: C.inkFaint }}>ENTRY NO. 001 · VOL. III · 2026 ED.</span>
          </div>

          {/* Big name */}
          <h1 style={{
            fontFamily: newsreader,
            fontSize: 80,
            fontWeight: 500,
            lineHeight: 0.95,
            letterSpacing: "-0.025em",
            color: C.ink,
            margin: 0,
            transform: `translateY(${slideY}px)`,
            opacity: nameOpacity,
          }}>
            {OWNER.nameParts[0]}
            <br />
            {OWNER.nameParts[1]}
            <span style={{ color: C.accent }}>*</span>
            <br />
            {OWNER.nameParts[2]}
          </h1>

          {/* Tagline */}
          <p style={{
            fontFamily: newsreader,
            fontStyle: "italic",
            fontSize: 20,
            color: C.inkSoft,
            marginTop: 24,
            marginBottom: 0,
            lineHeight: 1.4,
            opacity: tagOpacity,
            maxWidth: 600,
          }}>
            Software engineer, robotics builder, perpetual tinkerer — currently logging entries from Kraków, Poland.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 24, marginTop: 28, opacity: ctaOpacity }}>
            <span style={{
              fontFamily: jetbrainsMono, fontSize: 12, color: C.ink,
              letterSpacing: "0.04em", borderBottom: `1px solid ${C.ink}`, paddingBottom: 2,
            }}>
              Read the entries →
            </span>
            <span style={{
              fontFamily: jetbrainsMono, fontSize: 12, color: C.inkSoft, letterSpacing: "0.04em",
            }}>
              Get in touch ↘
            </span>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div style={{
        height: 64,
        borderTop: `1px solid ${C.hairline}`,
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        alignItems: "center",
        padding: "0 48px",
        marginTop: "auto",
        opacity: statsOpacity,
      }}>
        {[
          { label: "LANGUAGES",    value: "C# · C++ · Python · TS" },
          { label: "DISCIPLINES",  value: "Software · Robotics · Embedded" },
          { label: "BUILT SO FAR", value: "14+ projects" },
          { label: "BASED IN",     value: OWNER.location },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{
              fontFamily: jetbrainsMono, fontSize: 9, color: C.inkFaint,
              letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2,
            }}>
              {label}
            </div>
            <div style={{
              fontFamily: jetbrainsMono, fontSize: 12, color: C.ink, letterSpacing: "0.02em",
            }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Callout annotations */}
      <Callout frame={frame} label="● OPEN TO OPPORTUNITIES — SPRING 2026" x={310} y={118} from={45} to={200} />
      <Callout frame={frame} label="→ Read the entries / Get in touch" x={310} y={530} from={75} to={220} />
      <Callout frame={frame} label="§ 00 · Kraków, Poland" x={48} y={135} from={120} to={260} />
      <Callout frame={frame} label="C# · C++ · Python — real skill stack" x={310} y={640} from={170} to={285} />

      {/* Feature bar */}
      <FeatureBar
        label="Public Portfolio"
        sub="Engineering Logbook — light/dark theme · Newsreader serif design"
        frame={frame}
        DURATION={DURATION}
      />

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
