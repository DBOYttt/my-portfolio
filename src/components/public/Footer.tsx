import { OWNER } from "@/lib/mock-data";
import { HandRule } from "@/components/ui/hand-drawn";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ borderTop: "1px solid var(--hairline)", marginTop: 36, padding: "32px 0 56px" }}>
      <HandRule seed="footer-rule" style={{ marginBottom: 32 }} />
      <div className="logbook-row" style={{ alignItems: "end" }}>
        <aside className="margin">
          <span className="num">END</span>
          <span>End of volume</span>
        </aside>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div className="serif" style={{ fontSize: 22, fontStyle: "italic", color: "var(--ink-soft)" }}>
            — fin. Thanks for reading.
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
              letterSpacing: "0.06em",
              textAlign: "right",
            }}
          >
            <div>© {year} {OWNER.name.split(" ")[0]} Czajkowski-Nazim</div>
            <div>set in Newsreader, Inter Tight, JetBrains Mono</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
