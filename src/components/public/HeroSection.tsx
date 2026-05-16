import { OWNER } from "@/lib/mock-data";
import { HandRule, HandUnderline, HandArrow } from "@/components/ui/hand-drawn";

function Specimen({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          color: "var(--ink-faint)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {k}
      </div>
      <div className="serif" style={{ fontSize: 15, color: "var(--ink)", lineHeight: 1.3 }}>
        {v}
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section id="top" className="logbook-section" style={{ paddingTop: 56, paddingBottom: 48 }}>
      <div className="logbook-row">
        <aside className="margin">
          <span className="num">§ 00</span>
          <span>Cover</span>
          <span className="meta">Vol. III · 2026 ed.</span>
          <span className="meta">{OWNER.location}</span>
          <div style={{ marginTop: 22 }}>
            <HandArrow seed="hero-arr" angle={28} length={70} color="var(--accent)" />
          </div>
          <span
            className="meta"
            style={{
              marginTop: 8,
              display: "block",
              fontStyle: "italic",
              textTransform: "none",
              letterSpacing: 0,
              fontFamily: "var(--font-newsreader, Georgia, serif)",
              fontSize: 14,
              color: "var(--ink-soft)",
            }}
          >
            &ldquo;start here&rdquo;
          </span>
        </aside>

        <div>
          <div className="row" style={{ marginBottom: 18, gap: 16 }}>
            <span className="pill">{OWNER.status}</span>
            <span
              className="mono"
              style={{
                fontSize: 11.5,
                color: "var(--ink-faint)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Entry No. 001 · Vol. III · 2026 ed.
            </span>
          </div>

          <h1
            className="serif"
            style={{
              fontSize: "clamp(46px, 7vw, 92px)",
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
              fontWeight: 500,
              marginBottom: 18,
            }}
          >
            {OWNER.nameParts.map((part, i) =>
              i === OWNER.nameParts.length - 1 ? (
                <span key={i} style={{ position: "relative", display: "inline-block" }}>
                  {part}<sup className="fn">*</sup>
                </span>
              ) : (
                <span key={i}>{part}<br /></span>
              )
            )}
          </h1>

          <p
            className="serif"
            style={{
              fontSize: "clamp(20px, 2.2vw, 26px)",
              lineHeight: 1.35,
              color: "var(--ink-soft)",
              maxWidth: "32ch",
              fontStyle: "italic",
              marginBottom: 28,
            }}
          >
            Software engineer, robotics builder, perpetual{" "}
            <span className="hl">tinkerer</span> — currently logging entries from {OWNER.location}.
          </p>

          <div className="row" style={{ gap: 28, marginTop: 28 }}>
            <a href="#projects" className="btn-link">
              Read the entries <span className="arr">→</span>
              <HandUnderline seed="hero-u1" />
            </a>
            <a href="#contact" className="btn-link" style={{ color: "var(--ink-soft)" }}>
              Get in touch <span className="arr">↘</span>
            </a>
          </div>

          <div style={{ marginTop: 40 }}>
            <HandRule seed="hero-rule" />
          </div>

          <div
            style={{
              marginTop: 22,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 24,
            }}
            className="hero-specimen"
          >
            <Specimen k="Languages" v="C# · C++ · Python · TS" />
            <Specimen k="Disciplines" v="Software · Robotics · Embedded" />
            <Specimen k="Built so far" v="14+ projects" />
            <Specimen k="Based in" v={OWNER.location} />
          </div>

          {OWNER.nameHint && (
            <div style={{ marginTop: 36 }}>
              <p
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.06em" }}
              >
                <sup className="fn">*</sup>{" "}{OWNER.nameHint}
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 760px) {
          .hero-specimen { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
