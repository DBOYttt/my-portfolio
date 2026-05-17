import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { fadeIn } from "../utils";

const PAPER = "#f5f0e8";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";
const INK_FAINT = "#a89a8f";
const HAIRLINE = "rgba(44,38,33,0.15)";

export const PublicContact: React.FC = () => {
  const frame = useCurrentFrame();

  const formScale = interpolate(frame, [10, 35], [0.96, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const formOpacity = fadeIn(frame, 10, 25);
  const navOpacity = fadeIn(frame, 0, 15);
  const socialOpacity = fadeIn(frame, 50, 20);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: PAPER,
        fontFamily: "Georgia, serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 60px",
          borderBottom: `1px solid ${HAIRLINE}`,
          opacity: navOpacity,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: "bold", color: INK }}>
          Portfolio
        </div>
        <div
          style={{
            display: "flex",
            gap: 36,
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            color: INK_SOFT,
          }}
        >
          {["About", "Projects", "Blog", "Contact"].map((item) => (
            <span
              key={item}
              style={{
                color: item === "Contact" ? ACCENT : INK_SOFT,
                borderBottom:
                  item === "Contact" ? `1px solid ${ACCENT}` : "none",
                paddingBottom: 2,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div style={{ width: 80 }} />
      </nav>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 80,
          padding: "0 80px",
        }}
      >
        {/* Left: heading */}
        <div style={{ opacity: formOpacity, maxWidth: 280 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "'Courier New', monospace",
              color: ACCENT,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            §06
          </div>
          <h2
            style={{
              fontSize: 36,
              fontWeight: "bold",
              color: INK,
              margin: "0 0 16px 0",
              lineHeight: 1.2,
              letterSpacing: "-0.5px",
            }}
          >
            Get in
            <br />
            Touch
          </h2>
          <p
            style={{
              fontSize: 15,
              color: INK_SOFT,
              lineHeight: 1.7,
              margin: "0 0 28px 0",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Open to engineering roles, robotics projects, and interesting
            collaborations.
          </p>

          {/* Social links */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              opacity: socialOpacity,
            }}
          >
            {[
              { label: "GitHub", value: "github.com/DBOYttt" },
              { label: "Email", value: "andrzejcn041@gmail.com" },
              { label: "Site", value: "diboy.dev" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: "flex", gap: 10, alignItems: "center" }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "'Courier New', monospace",
                    color: INK_FAINT,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    width: 50,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: ACCENT,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: contact form */}
        <div
          style={{
            opacity: formOpacity,
            transform: `scale(${formScale})`,
            background: "rgba(44,38,33,0.04)",
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 6,
            padding: "32px",
            width: 380,
          }}
        >
          <FormField label="Name" placeholder="Your name" />
          <FormField label="Email" placeholder="your@email.com" />
          <FormTextarea label="Message" placeholder="What's on your mind?" />

          <button
            style={{
              width: "100%",
              padding: "13px",
              background: ACCENT,
              border: "none",
              borderRadius: 4,
              color: "#fff",
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              cursor: "pointer",
              marginTop: 4,
              letterSpacing: "0.3px",
            }}
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

function FormField({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontFamily: "'Courier New', monospace",
          color: "#a89a8f",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div
        style={{
          padding: "10px 14px",
          background: "#f5f0e8",
          border: "1px solid rgba(44,38,33,0.2)",
          borderRadius: 3,
          fontSize: 14,
          color: "#a89a8f",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {placeholder}
      </div>
    </div>
  );
}

function FormTextarea({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontFamily: "'Courier New', monospace",
          color: "#a89a8f",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div
        style={{
          padding: "10px 14px",
          background: "#f5f0e8",
          border: "1px solid rgba(44,38,33,0.2)",
          borderRadius: 3,
          fontSize: 14,
          color: "#a89a8f",
          fontFamily: "'Inter', sans-serif",
          height: 90,
          lineHeight: 1.6,
        }}
      >
        {placeholder}
      </div>
    </div>
  );
}
