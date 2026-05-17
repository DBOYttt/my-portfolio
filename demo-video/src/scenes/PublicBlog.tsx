import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, stagger } from "../utils";

const PAPER = "#f5f0e8";
const INK = "#2c2621";
const ACCENT = "#c17d3c";
const INK_SOFT = "#6b5e54";
const INK_FAINT = "#a89a8f";
const HAIRLINE = "rgba(44,38,33,0.15)";

const POSTS = [
  {
    date: "2026-05-10",
    title: "Introduction to ROS2 Navigation Stack",
    excerpt:
      "Nav2 is the standard autonomous navigation solution for ROS2. Here's how to configure it for a real robot with SLAM Toolbox and a custom costmap.",
    readTime: "8 min read",
  },
  {
    date: "2026-04-28",
    title: "Building a Full-Stack Portfolio with Next.js 14 App Router",
    excerpt:
      "Walking through the architecture decisions behind this platform: RSC, Prisma with PrismaPg adapter, Auth.js v5, and why I chose PostgreSQL over MongoDB.",
    readTime: "12 min read",
  },
  {
    date: "2026-04-14",
    title: "MCP: Giving Claude Real-Time Access to Your App",
    excerpt:
      "Model Context Protocol lets you expose your database and business logic as callable tools. I built a 14-tool MCP server for this portfolio.",
    readTime: "6 min read",
  },
];

export const PublicBlog: React.FC = () => {
  const frame = useCurrentFrame();

  const navOpacity = fadeIn(frame, 0, 15);
  const headerOpacity = fadeIn(frame, 5, 20);
  const viewAllOpacity = fadeIn(frame, 80, 20);

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
                color: item === "Blog" ? ACCENT : INK_SOFT,
                borderBottom: item === "Blog" ? `1px solid ${ACCENT}` : "none",
                paddingBottom: 2,
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div style={{ width: 80 }} />
      </nav>

      {/* Section header */}
      <div
        style={{ padding: "28px 60px 0", opacity: headerOpacity }}
      >
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: ACCENT,
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          §04
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: INK,
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            Engineering Logbook
          </h2>
          <div style={{ flex: 1, height: 1, background: HAIRLINE }} />
        </div>
      </div>

      {/* Blog entries */}
      <div style={{ flex: 1, padding: "20px 60px 0" }}>
        {POSTS.map((post, i) => {
          const entryOpacity = stagger(i, frame, 20, 22, 20);
          return (
            <BlogEntry key={i} {...post} opacity={entryOpacity} />
          );
        })}
      </div>

      {/* View all */}
      <div
        style={{
          padding: "0 60px 28px",
          display: "flex",
          justifyContent: "flex-end",
          opacity: viewAllOpacity,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: ACCENT,
            fontStyle: "italic",
            borderBottom: `1px solid ${ACCENT}`,
            paddingBottom: 1,
          }}
        >
          All posts →
        </span>
      </div>
    </div>
  );
};

function BlogEntry({
  date,
  title,
  excerpt,
  readTime,
  opacity,
}: {
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
  opacity: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderTop: "1px solid rgba(44,38,33,0.1)",
        padding: "18px 0",
        opacity,
      }}
    >
      {/* Margin: date */}
      <div style={{ width: 120, flexShrink: 0, paddingTop: 2 }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: "#a89a8f",
            letterSpacing: "0.5px",
            lineHeight: 1.6,
          }}
        >
          {date.replace(/-/g, ".")}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          borderLeft: "1px solid rgba(44,38,33,0.1)",
          paddingLeft: 32,
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#2c2621",
            marginBottom: 8,
            letterSpacing: "-0.2px",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <p
          style={{
            fontSize: 14,
            color: "#6b5e54",
            lineHeight: 1.7,
            margin: "0 0 10px 0",
            fontFamily: "'Inter', sans-serif",
            maxWidth: 620,
          }}
        >
          {excerpt}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#c17d3c",
              fontStyle: "italic",
            }}
          >
            Read →
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#a89a8f",
              fontFamily: "'Courier New', monospace",
            }}
          >
            {readTime}
          </span>
        </div>
      </div>
    </div>
  );
}
