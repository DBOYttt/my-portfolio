import Image from "next/image";
import { OWNER } from "@/lib/mock-data";
import { SectionHead } from "@/components/ui/hand-drawn";

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        className="mono"
        style={{
          fontSize: 10.5,
          color: "var(--ink-faint)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {k}
      </div>
      <div style={{ fontSize: 15, color: "var(--ink)", marginTop: 2 }}>{v}</div>
    </div>
  );
}

export default function AboutSection() {
  return (
    <section id="about" className="logbook-section">
      <SectionHead
        num="01"
        kicker="About"
        meta="Self-portrait, in prose"
        title={
          <>
            About the <em>author</em>.
          </>
        }
      />
      <div className="logbook-row">
        <aside className="margin">
          <span
            className="meta"
            style={{
              textTransform: "none",
              letterSpacing: 0,
              fontFamily: "var(--font-newsreader, Georgia, serif)",
              fontStyle: "italic",
              fontSize: 14,
              color: "var(--ink-soft)",
            }}
          >
            &ldquo;Builds things, breaks things, learns the difference.&rdquo;
          </span>
          <div style={{ marginTop: 18 }}>
            <Image
              src="/profile.png"
              alt={OWNER.name}
              width={240}
              height={320}
              style={{
                width: "100%",
                height: "auto",
                display: "block",
                border: "1px solid var(--hairline)",
              }}
              priority
            />
          </div>
        </aside>

        <div className="stack" style={{ ["--gap" as string]: "20px" }}>
          {OWNER.bio.map((p, i) => (
            <p
              key={i}
              className="serif"
              style={{
                fontSize: 19,
                lineHeight: 1.6,
                color: "var(--ink)",
                maxWidth: "62ch",
              }}
            >
              {i === 0 ? (
                <>
                  <span
                    className="serif"
                    style={{
                      float: "left",
                      fontSize: 56,
                      lineHeight: 0.9,
                      paddingRight: 10,
                      paddingTop: 4,
                      color: "var(--accent)",
                      fontWeight: 500,
                    }}
                  >
                    {p[0]}
                  </span>
                  {p.slice(1)}
                </>
              ) : (
                p
              )}
            </p>
          ))}

          <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginTop: 12 }}>
            <Field k="Located" v={OWNER.location} />
            <Field k="Status" v={OWNER.status} />
            <Field k="Best reach" v="email or LinkedIn" />
          </div>
        </div>
      </div>
    </section>
  );
}
