import { ROBOTICS_HIGHLIGHTS } from "@/lib/mock-data";
import { SectionHead, SketchPlaceholder } from "@/components/ui/hand-drawn";

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
      <div className="logbook-row">
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
            Team 9155 · FRC · 2020–2024
          </span>
          <div style={{ marginTop: 14 }}>
            <SketchPlaceholder
              label="ROBOT — competition photo"
              aspect="1 / 1"
              topLeft="IMG"
              topRight="REV. —"
              bottomRight="placeholder"
            />
          </div>
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
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    letterSpacing: "0.06em",
                  }}
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
      <style>{`@media (max-width:760px){ .robotics-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
