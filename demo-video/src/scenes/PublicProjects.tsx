import React from "react";
import { useCurrentFrame, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut, stagger } from "../utils";
import { C, F } from "../design";
import { PROJECTS } from "../data";
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
            color: l.startsWith("03") ? C.accent : C.inkSoft,
            letterSpacing: "0.06em", textTransform: "uppercase",
            borderBottom: l.startsWith("03") ? `1px solid ${C.accent}` : "none",
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

export const PublicProjects: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = fadeIn(frame, 8, 20);
  const filtersOpacity = fadeIn(frame, 18, 15);
  const globalFadeIn = fadeOut(frame, 0, 20);
  const globalFadeOut = fadeIn(frame, DURATION - 20, 20);

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
          <div style={{ color: C.accent, fontSize: 13 }}>§ 03</div>
          <div>PROJECTS</div>
        </div>

        {/* Right content */}
        <div>
          <h2 style={{
            fontFamily: newsreader,
            fontSize: 42,
            fontWeight: 500,
            color: C.ink,
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
            opacity: titleOpacity,
          }}>
            Projects <em style={{ color: C.inkSoft }}>& builds</em>
          </h2>

          {/* Filter tabs */}
          <div style={{
            display: "flex",
            gap: 20,
            marginBottom: 24,
            fontFamily: jetbrainsMono,
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            opacity: filtersOpacity,
          }}>
            {["ALL", "SOFTWARE", "ROBOTICS", "HARDWARE", "RESEARCH"].map((t, i) => (
              <span key={t} style={{
                color: i === 0 ? C.ink : C.inkFaint,
                borderBottom: i === 0 ? `1px solid ${C.ink}` : "none",
                paddingBottom: 2,
              }}>
                {t}
              </span>
            ))}
          </div>

          {/* Project entries */}
          {PROJECTS.map((p, i) => (
            <div key={i} style={{
              borderTop: `1px solid ${C.hairline}`,
              padding: "20px 0",
              display: "grid",
              gridTemplateColumns: "56px 1fr 80px",
              gap: 24,
              alignItems: "start",
              opacity: stagger(i, frame, 40, 30, 25),
              transform: `translateY(${interpolate(
                frame,
                [40 + i * 30, 65 + i * 30],
                [12, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )}px)`,
            }}>
              <span style={{
                fontFamily: jetbrainsMono, fontSize: 11, color: C.inkFaint, paddingTop: 3,
              }}>
                FIG. 0{i + 1}
              </span>
              <div>
                <div style={{
                  fontFamily: newsreader, fontSize: 20, fontWeight: 500, color: C.ink, marginBottom: 6,
                }}>
                  {p.title}
                </div>
                <p style={{
                  fontFamily: interTight, fontSize: 13, color: C.inkSoft, lineHeight: 1.5, margin: "0 0 10px",
                }}>
                  {p.summary}
                </p>
                <div style={{
                  fontFamily: jetbrainsMono, fontSize: 10, color: C.inkFaint, letterSpacing: "0.04em",
                }}>
                  {p.tags.join(" · ")}
                </div>
              </div>
              <span style={{
                fontFamily: jetbrainsMono, fontSize: 10, color: C.inkFaint,
                textTransform: "uppercase", letterSpacing: "0.06em",
                padding: "3px 8px", border: `1px solid ${C.hairline}`, borderRadius: 2,
                whiteSpace: "nowrap", textAlign: "center", alignSelf: "start",
              }}>
                {p.type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Callout annotations */}
      <Callout frame={frame} label="Filter by project type" x={250} y={120} from={50} to={180} />
      <Callout frame={frame} label="FIG. numbers — logbook entry style" x={640} y={180} from={100} to={230} />
      <Callout frame={frame} label="Tech stack tags on every project" x={250} y={280} from={160} to={285} />

      {/* Feature bar */}
      <FeatureBar
        label="§03 Projects"
        sub="4 real projects · filter by type: SOFTWARE / ROBOTICS / HARDWARE"
        frame={frame}
        DURATION={DURATION}
      />

      {/* Crossfade overlays */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeIn, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: globalFadeOut, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
