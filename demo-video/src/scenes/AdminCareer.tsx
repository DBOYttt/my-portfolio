import React from "react";
import { useCurrentFrame } from "remotion";
import { fadeIn, stagger } from "../utils";

const BG = "#0f1117";
const CARD = "#1a1d27";
const BORDER = "#2a2d3a";
const TEXT = "#e2e8f0";
const MUTED = "#94a3b8";
const CYAN = "#06b6d4";

const NAV_ITEMS = ["Dashboard", "Blog", "Projects", "Agents", "Career", "Settings"];

const JOBS = [
  {
    title: "Senior Software Engineer",
    company: "Acme Corp",
    score: 87,
    recommendation: "Recommended",
    recColor: "#34d399",
  },
  {
    title: "Robotics Engineer",
    company: "TechCorp Automation",
    score: 92,
    recommendation: "Recommended",
    recColor: "#34d399",
  },
  {
    title: "Frontend Developer",
    company: "StartupXYZ",
    score: 64,
    recommendation: "Review",
    recColor: "#fb923c",
  },
];

export const AdminCareer: React.FC = () => {
  const frame = useCurrentFrame();
  const uiOpacity = fadeIn(frame, 0, 20);
  const formOpacity = fadeIn(frame, 15, 20);
  const tableOpacity = fadeIn(frame, 30, 20);
  const cvOpacity = fadeIn(frame, 100, 20);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: BG,
        display: "flex",
        fontFamily: "'Inter', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 200,
          background: CARD,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          padding: "24px 0",
          opacity: uiOpacity,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: "0 20px 24px",
            borderBottom: `1px solid ${BORDER}`,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>
            Portfolio
          </div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Admin</div>
        </div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item}
            style={{
              padding: "9px 20px",
              fontSize: 13,
              color: item === "Career" ? CYAN : MUTED,
              background:
                item === "Career" ? "rgba(6,182,212,0.08)" : "transparent",
              borderLeft:
                item === "Career"
                  ? `2px solid ${CYAN}`
                  : "2px solid transparent",
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            padding: "20px 28px",
            borderBottom: `1px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: uiOpacity,
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT }}>
              Career Ops
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
              AI-powered job evaluation and CV pipeline
            </div>
          </div>
          <div style={{ opacity: cvOpacity }}>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 18px",
                border: `1px solid ${CYAN}`,
                borderRadius: 4,
                background: "rgba(6,182,212,0.1)",
                color: CYAN,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <span>📄</span>
              Publish Master CV
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 28px", flex: 1, overflow: "hidden" }}>
          {/* Evaluate form */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: "20px",
              marginBottom: 20,
              opacity: formOpacity,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: TEXT,
                marginBottom: 14,
              }}
            >
              Evaluate Job Posting
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 4,
                  fontSize: 13,
                  color: MUTED,
                }}
              >
                https://jobs.example.com/senior-engineer...
              </div>
              <button
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: 4,
                  background: CYAN,
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Evaluate Job
              </button>
            </div>
          </div>

          {/* Results table */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              overflow: "hidden",
              opacity: tableOpacity,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto auto",
                gap: 0,
                padding: "12px 20px",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              {["Position", "Score", "Recommendation", ""].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#475569",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {JOBS.map((job, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: 0,
                  padding: "14px 20px",
                  borderBottom: i < JOBS.length - 1 ? `1px solid ${BORDER}` : "none",
                  alignItems: "center",
                  opacity: stagger(i, frame, 35, 15, 18),
                }}
              >
                {/* Title + company */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: TEXT }}>
                    {job.title}
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                    @ {job.company}
                  </div>
                </div>

                {/* Score */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 24px",
                  }}
                >
                  <ScoreBar score={job.score} />
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: job.score >= 80 ? "#34d399" : "#fb923c",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 36,
                    }}
                  >
                    {job.score}%
                  </span>
                </div>

                {/* Recommendation */}
                <div style={{ padding: "0 24px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 3,
                      background:
                        job.recommendation === "Recommended"
                          ? "rgba(52,211,153,0.15)"
                          : "rgba(251,146,60,0.15)",
                      color: job.recColor,
                      fontWeight: 500,
                    }}
                  >
                    {job.recommendation}
                  </span>
                </div>

                {/* Action */}
                <div>
                  <button
                    style={{
                      padding: "5px 12px",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 3,
                      background: "transparent",
                      color: MUTED,
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div
      style={{
        width: 60,
        height: 4,
        background: "#2a2d3a",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${score}%`,
          height: "100%",
          background: score >= 80 ? "#34d399" : "#fb923c",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
