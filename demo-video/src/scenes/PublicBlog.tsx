import React from "react";
import { useCurrentFrame, Img, staticFile, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut } from "../utils";

const DURATION = 120;

function Callout({ x, y, label, from, to, frame }: {
  x: number; y: number; label: string; from: number; to: number; frame: number;
}) {
  const opacity = interpolate(
    frame, [from, from + 12, to - 8, to], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none", zIndex: 10 }}>
      <div style={{
        background: "rgba(0,0,0,0.80)", backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.25)", borderRadius: 4,
        padding: "4px 10px", fontSize: 12, color: "#fff", fontWeight: 500,
        fontFamily: "Inter, system-ui, sans-serif", whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}>
        {label}
      </div>
    </div>
  );
}

export const PublicBlog: React.FC = () => {
  const frame = useCurrentFrame();

  // First screenshot: public-blog-preview.png
  const scale1 = interpolate(frame, [0, DURATION], [1.0, 1.04], { extrapolateRight: "clamp" });
  const ty1 = interpolate(frame, [0, DURATION], [0, -8], { extrapolateRight: "clamp" });

  // Second screenshot: blog-post.png
  const scale2 = interpolate(frame, [0, DURATION], [1.0, 1.04], { extrapolateRight: "clamp" });
  const tx2 = interpolate(frame, [0, DURATION], [0, -6], { extrapolateRight: "clamp" });

  // Crossfade: second image fades in over frames 55–75
  const secondOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fadeInOverlay = fadeOut(frame, 0, 20);
  const fadeOutOverlay = fadeIn(frame, DURATION - 20, 20);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* First screenshot */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
        transform: `scale(${scale1}) translateY(${ty1}px)`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("screenshots/public-blog-preview.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      {/* Second screenshot — crossfades in */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
        transform: `scale(${scale2}) translateX(${tx2}px)`,
        transformOrigin: "center center",
        opacity: secondOpacity,
      }}>
        <Img
          src={staticFile("screenshots/blog-post.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeInOverlay, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeOutOverlay, pointerEvents: "none" }} />

      <Callout frame={frame} from={20} to={58} x={300} y={85} label="§06 Writing — Engineering Logbook posts" />
      <Callout frame={frame} from={35} to={63} x={300} y={200} label="12 min read — real markdown + code blocks" />
      <Callout frame={frame} from={75} to={115} x={300} y={100} label="Full post with ToC, syntax highlighting" />
    </AbsoluteFill>
  );
};
