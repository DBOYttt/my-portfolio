import { getExperience } from "@/lib/data";
import { SectionHead } from "@/components/ui/hand-drawn";

export default async function ExperienceSection() {
  const experience = await getExperience();

  return (
    <section id="experience" className="logbook-section">
      <SectionHead
        num="05"
        kicker="Experience"
        meta="Roles, places, durations"
        title={
          <>
            The <em>record</em>.
          </>
        }
      />
      <div className="logbook-row">
        <aside className="margin" />
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {experience.map((e, i) => (
            <li
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr auto",
                gap: 24,
                padding: "20px 0",
                borderTop: "1px solid var(--hairline)",
                borderBottom:
                  i === experience.length - 1
                    ? "1px solid var(--hairline)"
                    : "none",
                alignItems: "baseline",
              }}
              className="exp-row"
            >
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  color: "var(--ink-faint)",
                  letterSpacing: "0.04em",
                }}
              >
                {e.period}
              </span>
              <div>
                <h3 className="serif" style={{ fontSize: 21, fontWeight: 500, marginBottom: 2 }}>
                  {e.role}{" "}
                  <span
                    style={{
                      color: "var(--ink-faint)",
                      fontStyle: "italic",
                      fontWeight: 400,
                    }}
                  >
                    · {e.company}
                  </span>
                </h3>
                <p
                  style={{
                    fontSize: 15.5,
                    lineHeight: 1.55,
                    maxWidth: "62ch",
                    marginTop: 4,
                    color: "var(--ink-soft)",
                  }}
                >
                  {e.description}
                </p>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {e.type}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <style>{`@media (max-width:760px){ .exp-row { grid-template-columns: 1fr !important; } .exp-row .mono { color: var(--accent) !important; } }`}</style>
    </section>
  );
}
