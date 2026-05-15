import { ROBOTICS_HIGHLIGHTS } from "@/lib/mock-data";
import { SectionHead } from "@/components/ui/hand-drawn";

export default function RoboticsSection() {
  return (
    <section id="robotics" className="logbook-section">
      <SectionHead
        num="04"
        kicker="Robotics"
        meta="Machines, learned the hard way"
        title={
          <>
            Things that <em>move</em>.
          </>
        }
        sub="Four years on a competitive robotics team taught me more about engineering trade-offs than any course could. Here are the parts that stuck."
      />
      {/* Full-width 3D model embed */}
      <div className="logbook-row" style={{ display: "block", paddingBottom: 0 }}>
        <div style={{ paddingLeft: "calc(120px + 48px)" }} className="robotics-embed-wrap">
          <div style={{ marginBottom: 8, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.06em" }}
            >
              FIG. 01
            </span>
            <span
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: "var(--ink-soft)",
                fontFamily: "var(--font-newsreader, Georgia, serif)",
              }}
            >
              Team 9155 · FRC robot · Autodesk Fusion 360
            </span>
          </div>
          <iframe
            src="https://gmail3794190.autodesk360.com/g/shares/SH28cd1QT2badd0ea72b8f1306dfff8cf9d2"
            title="FRC Robot — Autodesk Fusion 360"
            style={{
              width: "100%",
              height: 520,
              border: "1px solid var(--hairline)",
              borderRadius: 2,
              display: "block",
            }}
            allowFullScreen
            loading="lazy"
          />
        </div>
      </div>

      {/* Highlights grid */}
      <div className="logbook-row" style={{ paddingTop: 0 }}>
        <aside className="margin">
          <span
            className="meta"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 13,
              fontStyle: "italic",
              color: "var(--ink-soft)",
              fontFamily: "var(--font-newsreader, Georgia, serif)",
            }}
          >
            2020–2024
          </span>
        </aside>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}
          className="robotics-grid"
        >
          {ROBOTICS_HIGHLIGHTS.map((r, i) => (
            <div
              key={r.title}
              style={{ borderTop: "1px solid var(--hairline)", padding: "20px 0" }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.06em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="serif" style={{ fontSize: 22, fontWeight: 500 }}>
                  {r.title}
                </h3>
              </div>
              <p
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.55,
                  maxWidth: "44ch",
                  color: "var(--ink-soft)",
                }}
              >
                {r.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width:760px){
          .robotics-grid { grid-template-columns: 1fr !important; }
          .robotics-embed-wrap { padding-left: 0 !important; }
        }
      `}</style>
    </section>
  );
}
