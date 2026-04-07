import { ImageResponse } from "next/og";
import { OWNER } from "@/lib/mock-data";

export const alt = `${OWNER.name} — Software Engineer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            color: "#06b6d4",
            fontSize: "20px",
            marginBottom: "16px",
            fontFamily: "monospace",
          }}
        >
          {">"} portfolio
        </div>
        <div
          style={{
            color: "#f8fafc",
            fontSize: "64px",
            fontWeight: "bold",
            lineHeight: 1.1,
          }}
        >
          {OWNER.name}
        </div>
        <div
          style={{
            color: "#94a3b8",
            fontSize: "28px",
            marginTop: "16px",
          }}
        >
          Software Engineer · Robotics
        </div>
        <div
          style={{
            color: "#06b6d4",
            fontSize: "18px",
            marginTop: "40px",
            fontFamily: "monospace",
          }}
        >
          {OWNER.location}
        </div>
      </div>
    ),
    { ...size }
  );
}
