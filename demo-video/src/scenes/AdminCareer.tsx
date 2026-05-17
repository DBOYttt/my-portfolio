import React from "react";
import { useCurrentFrame, Img, staticFile, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut } from "../utils";

const DURATION = 150;

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

export const AdminCareer: React.FC = () => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, DURATION], [1.0, 1.05], { extrapolateRight: "clamp" });
  const ty = interpolate(frame, [0, DURATION], [0, 8], { extrapolateRight: "clamp" });

  const fadeInOverlay = fadeOut(frame, 0, 20);
  const fadeOutOverlay = fadeIn(frame, DURATION - 20, 20);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden",
        transform: `scale(${scale}) translateY(${ty}px)`,
        transformOrigin: "center center",
      }}>
        <Img
          src={staticFile("screenshots/admin-career.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeInOverlay, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeOutOverlay, pointerEvents: "none" }} />

      <Callout frame={frame} from={20} to={80} x={280} y={100} label="Evaluate job URL with Claude AI" />
      <Callout frame={frame} from={45} to={120} x={280} y={200} label="Match score + recommendation" />
      <Callout frame={frame} from={80} to={140} x={280} y={300} label="Full evaluation pipeline" />
      <Callout frame={frame} from={110} to={148} x={900} y={85} label="Publish Master CV → public/cv.pdf" />
    </AbsoluteFill>
  );
};
