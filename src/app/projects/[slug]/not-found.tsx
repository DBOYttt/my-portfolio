import Link from "next/link";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export default function ProjectNotFound() {
  return (
    <>
      <Nav />
      <main className="page" style={{ paddingTop: 80, paddingBottom: 64, minHeight: "60vh", display: "flex", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase" }}>404</span>
          <h1 style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: 32, fontWeight: 700, color: "var(--ink)", margin: "8px 0 16px" }}>
            Project not found.
          </h1>
          <Link href="/#projects" className="btn-link">
            ← Back to projects
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
