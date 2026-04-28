import { getSkills } from "@/lib/data";
import { SectionHead, HandCheck } from "@/components/ui/hand-drawn";

export default async function SkillsSection() {
  const skills = await getSkills();
  if (skills.length === 0) return null;

  return (
    <section id="skills" className="logbook-section">
      <SectionHead
        num="02"
        kicker="Stack"
        meta="Known tools, in active use"
        title={
          <>
            The <em>working</em> kit.
          </>
        }
        sub="Languages and tools I reach for first. Marked with a hand if I've shipped real things with them in the last twelve months."
      />
      <div className="logbook-row">
        <aside className="margin">
          <span
            className="meta"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontSize: 12,
              color: "var(--ink-soft)",
            }}
          >
            <span
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              ✓
            </span>{" "}
            &nbsp;= shipped recently
          </span>
        </aside>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 48px" }}
          className="skills-grid"
        >
          {skills.map((g, i) => (
            <div
              key={g.category}
              style={{ borderTop: "1px solid var(--hairline)", padding: "18px 0" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 8,
                }}
              >
                <h3 className="serif" style={{ fontSize: 22, fontWeight: 500 }}>
                  {g.category}
                </h3>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.06em" }}
                >
                  {String(i + 1).padStart(2, "0")} /{" "}
                  {String(skills.length).padStart(2, "0")}
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: 22,
                  rowGap: 6,
                }}
              >
                {g.skills.map((skill, j) => (
                  <li
                    key={skill}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 16,
                      color: "var(--ink-soft)",
                    }}
                  >
                    {j < 3 ? (
                      <HandCheck size={14} color="var(--accent)" />
                    ) : (
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--ink-faint)" }}
                      >
                        ·
                      </span>
                    )}
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 760px){ .skills-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
}
