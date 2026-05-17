import React from "react";
import { useCurrentFrame, Img, staticFile, interpolate, AbsoluteFill } from "remotion";
import { fadeIn, fadeOut } from "../utils";

const DURATION = 180;

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

export const AdminAgents: React.FC = () => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, DURATION], [1.0, 1.04], { extrapolateRight: "clamp" });
  const ty = interpolate(frame, [0, DURATION], [0, -12], { extrapolateRight: "clamp" });

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
          src={staticFile("screenshots/admin-agents.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
        />
      </div>

      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeInOverlay, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: fadeOutOverlay, pointerEvents: "none" }} />

      <Callout frame={frame} from={20} to={90} x={280} y={85} label="7 AI research agents" />
      <Callout frame={frame} from={40} to={130} x={280} y={180} label='"N new" — unread reports counter' />
      <Callout frame={frame} from={65} to={155} x={945} y={180} label="Run now — instant trigger" />
      <Callout frame={frame} from={90} to={175} x={280} y={540} label="Brand Monitor · Skills Inference · GitHub Summarizer" />
    </AbsoluteFill>
  );
};
